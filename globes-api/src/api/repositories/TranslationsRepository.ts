import TranslatedMessages, { TranslationInput, TranslationOutput } from "../model/TranslationMessages";


interface ITranslatedMessagesRepository {
    addTranslation(payload: TranslationInput): Promise<TranslationOutput>;
    getTranslations(meeting_id: string, language: string): Promise<TranslationOutput[]>;
    getTranslation(message_id: string, language: string): Promise<TranslationOutput>;
}; // End interface IRoleRepository

class MessagesRepository implements ITranslatedMessagesRepository {
    async addTranslation(payload: TranslationInput): Promise<TranslationOutput> {
        try {
            const translationDetails: TranslationOutput = (await TranslatedMessages.create(payload)).toJSON();
            return translationDetails;
        } catch (error) {
            console.error('Error adding translation:', error);
            throw new Error('Failed to add translation');
        }
    }

    async getTranslations(
        meeting_id: string,
        language: string
    ): Promise<TranslationOutput[]> {
        try {
            const messages = await TranslatedMessages.findAll({
                where: {
                    meetingId: meeting_id,
                    translated_language: language
                }
            });

            return messages.map(msg => msg.toJSON());
        } catch (error) {
            console.error('Error fetching translations:', error);
            throw new Error('Failed to fetch translations');
        }
    }

    async getTranslation(
        message_id: string,
        language: string
    ): Promise<TranslationOutput> {
        try {
            const messages = await TranslatedMessages.findAll({
                where: {
                    messageId: message_id,
                    translated_language: language
                }
            });

            return messages.map(msg => msg.toJSON())[0];
        } catch (error) {
            console.error('Error fetching translations:', error);
            throw new Error('Failed to fetch translations');
        }
    }
}

export default new MessagesRepository();