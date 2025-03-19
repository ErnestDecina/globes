
import { NextFunction, Request, Response } from "express";

class MeetingsController {
    async getMeetings(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {


            res.status(200).send({
                    example: 'hello world'
            });
        } catch (error) {
            res.status(400).send();
        } 
    } 
} 

export default new MeetingsController();