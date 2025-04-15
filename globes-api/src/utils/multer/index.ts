import multer from "multer";
import path from "path";
import fs from "fs";
import { Express } from "multer";
import Logger from "../logger";
import { exec } from 'child_process';
import util from 'util';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import libre from 'libreoffice-convert';


const execPromise = util.promisify(exec);
const libreConvert = util.promisify(libre.convert);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extract meeting_uuid from request params
    const meeting_uuid = req.params.meeting_uuid;
    const language = req.query.lang || "en";

    Logger.info(`Meeting uuid: ${meeting_uuid}, Lang: ${language}`);

    // Create a specific directory for this meeting
    const uploadDir = path.join("/workspace/globes-api", "uploads", "meetings", meeting_uuid, language, "slides");

    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const language = req.query.lang;
    cb(null, "slide-" + language + path.extname(file.originalname));
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file types
  const allowedFileTypes = [
    "application/pdf", // PDF
    "application/vnd.ms-powerpoint", // PPT (older format)
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX (newer format)
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and PowerPoint files are allowed"));
  }
};

export const uploadSlides = (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  // Initialize multer with our configured storage and file filter
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }).single("slides"); // 'slides' is the field name for the file

  // Handle the upload
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    // If successful, continue to the next middleware
    next();
  });
};

export const convertSlidesToImages = async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const meeting_uuid = req.params.meeting_uuid;
    const uploadedFilePath = req.file.path;
    const language = req.query.lang || "en";
    const fileExtension = path.extname(uploadedFilePath).toLowerCase();
    const imagesDir = path.join("/workspace/globes-api", "uploads", "meetings", meeting_uuid, language, "images");
    
    // Create images directory if it doesn't exist
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Store the images directory in the request for the next middleware
    req.body.imagesDir = imagesDir;
    req.body.imageFiles = [];

    // Different conversion methods based on file type
    if (fileExtension === '.pdf') {
      await convertPdfToImages(uploadedFilePath, imagesDir, req);
    } else if (['.ppt', '.pptx'].includes(fileExtension)) {
      // First convert PPT/PPTX to PDF
      const pdfPath = path.join(path.dirname(uploadedFilePath), 
                               `${path.basename(uploadedFilePath, fileExtension)}.pdf`);
      
      await convertPptToPdf(uploadedFilePath, pdfPath);
      
      // Then convert PDF to images
      await convertPdfToImages(pdfPath, imagesDir, req);
      
      // Clean up the intermediate PDF file
      fs.unlinkSync(pdfPath);
    }

    next();
  } catch (error) {
    console.error('Conversion error:', error);
    return res.status(500).json({ 
      error: 'Failed to convert slides to images',
      details: error.message 
    });
  }
};

async function convertPptToPdf(pptPath: string, outputPdfPath: string): Promise<void> {
  const inputBuffer = fs.readFileSync(pptPath);
  const outputFormat = '.pdf';
  
  // Using libreoffice-convert
  try {
    const pdfBuffer = await libreConvert(inputBuffer, outputFormat, undefined);
    fs.writeFileSync(outputPdfPath, pdfBuffer);
  } catch (error) {
    // Fallback to command-line LibreOffice if available
    try {
      await execPromise(`libreoffice --headless --convert-to pdf --outdir "${path.dirname(outputPdfPath)}" "${pptPath}"`);
    } catch (cmdError) {
      throw new Error(`PowerPoint to PDF conversion failed: ${error.message}. Command line fallback also failed: ${cmdError.message}`);
    }
  }
}

// Function to convert PDF to images using pdf-lib and sharp
async function convertPdfToImages(pdfPath: string, imagesDir: string, req: Express.Request): Promise<void> {
  try {
    // Read the PDF file
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    // For each page in the PDF
    for (let i = 0; i < pageCount; i++) {
      try {
        // Extract current page as a new PDF
        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
        singlePagePdf.addPage(copiedPage);
        const singlePageBytes = await singlePagePdf.save();
        
        // Write single page PDF temporarily
        const tempSinglePagePath = path.join(imagesDir, `temp_page_${i}.pdf`);
        fs.writeFileSync(tempSinglePagePath, singlePageBytes);
        
        // Convert single page PDF to image using sharp
        // Note: This is a simplified approach - for better quality rendering consider using pdf2image or similar
        const imageOutputPath = path.join(imagesDir, `slide_${String(i + 1).padStart(3, '0')}.png`);
        
        // For better PDF rendering, we can use ghostscript via exec if installed on the system
        try {
          // Try using ghostscript for better quality (if installed)
          await execPromise(`gs -dQUIET -dSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -r300 -o "${imageOutputPath}" "${tempSinglePagePath}"`);
        } catch (gsError) {
          // Fallback to sharp with lower quality
          await sharp(tempSinglePagePath, { density: 300 })
            .png()
            .toFile(imageOutputPath);
        }
        
        // Clean up temp file
        fs.unlinkSync(tempSinglePagePath);
        
        // Add to list of generated image files
        req.body.imageFiles.push(imageOutputPath);
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
        // Continue with other pages even if one fails
      }
    }
  } catch (error) {
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  }
}
