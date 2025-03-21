
import { NextFunction, Request, Response } from "express";
import { MeetingInput, MeetingOutput } from "../model/Meetings";
import MeetingsService from "../services/MeetingsService";
import { MessageInput } from "../model/Messages";

class MeetingsController {
    async getMeetings(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const meetingUUID: string = req.params.uuid;
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

    async postMessage(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const messageDetails: MessageInput = req.body;
            messageDetails.meetingId = req.params.uuid
            res.status(200).send(await MeetingsService.postMessage(messageDetails));
        } catch (error) {
            res.status(400).send();
        } 
    } 

    async getMessages(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const meetingUUID: string = req.params.uuid;
            res.status(200).send(await MeetingsService.getMessages(meetingUUID));
        } catch (error) {
            res.status(400).send();
        } 
    } 

    async getTranslations(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const meetingUUID: string = req.params.meeting_uuid;
            let langauge: string = req.query.lang;

            if(!langauge) {
                langauge = 'en';
            }
            

            res.status(200).send(await MeetingsService.getTranslations(meetingUUID, langauge));
        } catch (error) {
            res.status(400).send();
        } 
    } 

    async getTranslation(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const messageUUID: string = req.params.message_uuid;
            let langauge: string = req.query.lang;

            if(!langauge) {
                langauge = 'en';
            }
            

            res.status(200).send(await MeetingsService.getTranslation(messageUUID, langauge));
        } catch (error) {
            res.status(400).send();
        } 
    } 
} 

export default new MeetingsController();