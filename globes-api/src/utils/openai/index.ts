import OpenAI from "openai";
import { openai_api_key } from "../../config/openai.config";
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import MessagesRepository from "../../api/repositories/MessagesRepository";
import sharp from "sharp"; // You'll need to install this: npm install sharp

export const openAI = new OpenAI({
    apiKey: openai_api_key
});

export async function translateTextToLanguageNoContext(
    tranlsate_to_language: string,
    message: string
) {
    const chatCompletion = await openAI.chat.completions.create({
        messages: [{ role: "user", content: `translate this message into ${tranlsate_to_language} in a professional language and if the languages are the same return the orgininal message and only return the translation if its a differnet lanuague, do not add any extra formats, only return the translated string: ${message}` }],
        model: "gpt-3.5-turbo-0125",
    });
    const tranlsation = chatCompletion.choices[0].message.content;
    if(!tranlsation) {
        throw Error('No response from OpenAI');
    }
    return tranlsation;
}

export async function makeSummaryOfMeeting(
    meeting_uuid: string,
    language: string
) {
    try {
        const messagesDB = await MessagesRepository.getMessages(meeting_uuid);
        
        // Combine messages text
        const combinedText = messagesDB
            .map(m => m.originalMessage)
            .filter(Boolean)
            .join("\n");
        
        // Check if combined text is too large and truncate if necessary
        const MAX_TEXT_LENGTH = 30000; // Adjust based on OpenAI's limits
        const truncatedText = combinedText.length > MAX_TEXT_LENGTH 
            ? combinedText.substring(0, MAX_TEXT_LENGTH) + "\n\n[Note: Text was truncated due to size limits]"
            : combinedText;
            
        // Use standard chat completions API instead of assistants API
        // This avoids the file_ids parameter issue
        const prompt = `Make sure to translate your response into ${language}.
        
Here are the messages from a meeting discussion:

${truncatedText}

Please provide a concise summary. Make sure to have them in bullet point format and add a lot of detail.`;

        // Using completion API instead of assistants API
        const chatCompletion = await openAI.chat.completions.create({
            model: "gpt-4-turbo-preview", // Use GPT-4 for better summarization
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 2000,
        });
        
        const summary = chatCompletion.choices[0].message.content;
        
        if (!summary) {
            throw new Error("No response received from OpenAI");
        }
        
        console.log("\n📝 Summary:\n", summary);
        return summary;
    } catch (error) {
        console.error("Error in makeSummaryOfMeeting:", error);
        throw error;
    }
}

// For reference only - not using this in updated solution
async function compressImage(inputPath: string, quality = 70): Promise<Buffer> {
    try {
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        // Resize large images to reduce dimensions
        let processedImage = image;
        if (metadata.width && metadata.width > 1920) {
            processedImage = image.resize(1920, null, { fit: 'inside' });
        }
        
        // Determine output format based on input
        if (metadata.format === 'png') {
            // For PNG, use PNG compression
            return await processedImage
                .png({ quality, compressionLevel: 9 })
                .toBuffer();
        } else {
            // For other formats, use JPEG compression
            return await processedImage
                .jpeg({ quality })
                .toBuffer();
        }
    } catch (error) {
        console.error("Image compression error:", error);
        throw error;
    }
}

// For reference only - not using this in updated solution
async function uploadImagesWithCompression(imageDir: string): Promise<string[]> {
    // Check if directory exists
    if (!existsSync(imageDir)) {
        console.warn(`Image directory not found: ${imageDir}`);
        return []; // Return empty array if directory doesn't exist
    }

    // Create a temp directory for compressed images
    const tempDir = path.join(imageDir, '../compressed_temp');
    if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
    }

    const files = readdirSync(imageDir);
    const fileIds = [];
    
    // OpenAI file size limit (20MB)
    const MAX_FILE_SIZE = 19 * 1024 * 1024; // Slightly under 20MB to be safe
    
    // Supported image formats
    const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    
    for (const file of files) {
        const filePath = path.join(imageDir, file);
        const fileExt = path.extname(file).toLowerCase();
        
        // Skip files that aren't supported image formats
        if (!SUPPORTED_FORMATS.includes(fileExt)) {
            console.warn(`Skipping unsupported file format: ${file}`);
            continue;
        }
        
        try {
            // Get original file size
            const stats = statSync(filePath);
            
            // Try compression with progressively lower quality until file size is acceptable
            let quality = 70;
            let compressedBuffer: Buffer | null = null;
            
            while (quality >= 20) {
                try {
                    compressedBuffer = await compressImage(filePath, quality);
                    
                    if (compressedBuffer && compressedBuffer.length <= MAX_FILE_SIZE) {
                        break;
                    }
                    
                    // Reduce quality and try again
                    quality -= 10;
                } catch (compressError) {
                    console.error(`Error compressing ${file}:`, compressError.message);
                    compressedBuffer = null;
                    break;
                }
            }
            
            // If we couldn't compress enough, skip this file
            if (!compressedBuffer || compressedBuffer.length > MAX_FILE_SIZE) {
                console.warn(`Could not compress ${file} enough to meet size requirements. Skipping.`);
                continue;
            }
            
            // Save compressed file to temp location (optional)
            const compressedFilePath = path.join(tempDir, `compressed_${file}`);
            writeFileSync(compressedFilePath, compressedBuffer);
            
            try {
                // Upload compressed file
                const upload = await openAI.files.create({
                    file: compressedBuffer,
                    name: file,
                    purpose: "assistants",
                });
                
                fileIds.push(upload.id);
                console.log(`Successfully uploaded compressed: ${file} (${compressedBuffer.length / (1024 * 1024).toFixed(2)}MB) (${upload.id})`);
            } catch (uploadError) {
                console.error(`Upload error for ${file}:`, uploadError.message);
            }
            
        } catch (error) {
            console.error(`Error processing file ${file}:`, error.message);
            // Continue with other files even if one fails
        }
    }
    
    console.log(`Successfully uploaded ${fileIds.length} of ${files.length} files`);
    return fileIds;
}