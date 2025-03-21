import * as dotenv from 'dotenv';
dotenv.config();

export const openai_api_key: string = String(process.env.OPENAI_API_KEY);

                                        