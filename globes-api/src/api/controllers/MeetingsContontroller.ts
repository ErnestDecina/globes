
import { NextFunction, Request, Response } from "express";
import { MeetingInput, MeetingOutput } from "../model/Meetings";
import MeetingsService from "../services/MeetingsService";

class MeetingsController {
    async getMeetings(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const meetingUUID: string = req.body.uuid;
            res.status(200).send(await MeetingsService.getMeetings(meetingUUID));
        } catch (error) {
            res.status(400).send();
        } 
    } 

    async postMeetings(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const meetingDetails: MeetingInput = req.body;
            res.status(200).send(await MeetingsService.createMeetings(meetingDetails));
        } catch (error) {
            res.status(400).send();
        } 
    } 
} 

export default new MeetingsController();