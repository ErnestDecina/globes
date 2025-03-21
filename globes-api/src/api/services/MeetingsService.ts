import { MeetingInput, MeetingOutput } from "../model/Meetings";
import MeetingsRepository from "../repositories/MeetingsRepository";

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

} 

export default new MeetingsService();