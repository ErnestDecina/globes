import translateTextToLanguageNoContext from "../../utils/openai";
import { MeetingInput, MeetingOutput } from "../model/Meetings";
import { MessageInput, MessageOutput } from "../model/Messages";
import { TranslationInput, TranslationOutput } from "../model/TranslationMessages";
import MeetingsRepository from "../repositories/MeetingsRepository";
import MessagesRepository from "../repositories/MessagesRepository";
import TranslationsRepository from "../repositories/TranslationsRepository";

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

    async postMessage(payload: MessageInput): Promise<MessageOutput> {
        try {
            const message = await MessagesRepository.addMessage(payload);

            
            // Translate to Korean
            const translation: TranslationInput = {
                messageId: message.messageId,
                meetingId: message.meetingId,
                translation_message: await translateTextToLanguageNoContext('ko', message.originalMessage),
                translated_language: 'ko'
            }
            TranslationsRepository.addTranslation(translation);

            
            return message;
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

    getTranslations(
        meeting_id: string,
        language: string,
    ): Promise<TranslationOutput[]> {
        try {
            // Add Unhashing
            return TranslationsRepository.getTranslations(meeting_id, language);
        } catch(error) {
            console.error('Error getting translations:', error);
            throw new Error('Failed to get translations');
        }
    }
} 

export default new MeetingsService();