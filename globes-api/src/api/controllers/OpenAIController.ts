
import { NextFunction, Request, Response } from "express";
import { MeetingInput, MeetingOutput } from "../model/Meetings";
import MeetingsService from "../services/MeetingsService";

class OpenAIController {
    async postTranslate(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {

        } catch (error) {
            
        } 
    } 

} 

export default new OpenAIController();