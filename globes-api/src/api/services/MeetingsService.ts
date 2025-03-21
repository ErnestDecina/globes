import { MeetingInput, MeetingOutput } from "../model/Meetings";
import { MessageInput, MessageOutput } from "../model/Messages";
import MeetingsRepository from "../repositories/MeetingsRepository";
import MessagesRepository from "../repositories/MessagesRepository";

interface IMeetingsService {
    createMeetings(payload: MeetingInput): Promise<MeetingOutput>;
    getMeetings(uuid: string): Promise<MeetingOutput>;
}; // End interface IExampleService

class MeetingsService implements IMeetingsService {
    createMeetings(payload: MeetingInput): Promise<MeetingOutput> {
        try {
            // Add hashing
            return MeetingsRepository.createMeeting(payload);
        } catch(error) {
            console.error('Error creating meeting:', error);
            throw new Error('Failed to create meeting');
        }
        
    }

    getMeetings(uuid: string): Promise<MeetingOutput> {
        try {
            // Add Unhashing
            return MeetingsRepository.getMeeting(uuid);
        } catch(error) {
            console.error('Error getting meeting:', error);
            throw new Error('Failed to get meeting');
        }
    }

    postMessage(payload: MessageInput): Promise<MessageOutput> {
        try {
            return MessagesRepository.addMessage(payload);
        } catch(error) {
            console.error('Error adding message:', error);
            throw new Error('Failed to add message');
        }
    } 

    getMessages(meeting_id: string): Promise<MessageOutput[]> {
        try {
            // Add Unhashing
            return MessagesRepository.getMessages(meeting_id);
        } catch(error) {
            console.error('Error getting meeting:', error);
            throw new Error('Failed to get meeting');
        }
    }
} 

export default new MeetingsService();