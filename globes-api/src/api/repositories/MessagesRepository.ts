import Messages, { MessageInput, MessageOutput } from "../model/Messages";


interface IMessagesRepository {
    addMessage(payload: MessageInput): Promise<MessageOutput>;
    getMessages(meeting_id: string): Promise<MessageOutput[]>;
}; // End interface IRoleRepository

class MessagesRepository implements IMessagesRepository {
    async addMessage(payload: MessageInput): Promise<MessageOutput> {
        try {
            const meetingDetails: MessageOutput = (await Messages.create(payload)).toJSON();
            return meetingDetails;
        } catch(error) {
            console.error('Error adding message:', error);
            throw new Error('Failed to add message');
        }
    }

    async getMessages(meeting_id: string): Promise<MessageOutput[]> {
        try {
            const messages = await Messages.findAll({
                where: {
                    meetingId: meeting_id
                }
            });

            return messages.map(msg => msg.toJSON());
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw new Error('Failed to fetch messages');
        }
    }
}

export default new MessagesRepository();