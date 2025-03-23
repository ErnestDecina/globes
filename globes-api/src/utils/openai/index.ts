import OpenAI from "openai";
import { openai_api_key } from "../../config/openai.config";

export const openAI = new OpenAI({
    apiKey: openai_api_key
});

export default async function translateTextToLanguageNoContext(
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


