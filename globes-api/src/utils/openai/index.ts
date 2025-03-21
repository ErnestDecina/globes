import OpenAI from "openai";
import { openai_api_key } from "../../config/openai.config";

const openai = new OpenAI({
    apiKey: openai_api_key
});


