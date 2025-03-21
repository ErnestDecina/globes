import Meeting, { MeetingInput, MeetingOutput } from "../model/Meetings";


interface IMeetingsRepository {
    createMeeting(payload: MeetingInput): Promise<MeetingOutput>;
    getMeeting(uuid: string): Promise<MeetingOutput>;
}; // End interface IRoleRepository

class MeetingsRepository implements IMeetingsRepository {
    async createMeeting(payload: MeetingInput): Promise<MeetingOutput> {
        try {
            const meetingDetails: MeetingOutput = (await Meeting.create(payload)).toJSON();
            return meetingDetails;
        } catch(error) {
            console.error('Error creating meeting:', error);
            throw new Error('Failed to create meeting');
        }
    }
    
    async getMeeting(uuid: string): Promise<MeetingOutput> {
        try {
          const meeting = await Meeting.findByPk(uuid);
      
          if (!meeting) {
            throw new Error(`Meeting with ID ${uuid} not found`);
          }
      
          // Convert to plain object if you want to return MeetingOutput type
          const meetingDetails: MeetingOutput = meeting.toJSON();
      
          return meetingDetails;
        } catch (error) {
          console.error('Error getting meeting:', error);
          throw new Error('Failed to get meeting');
        }
    }

} // End RoleRepository

export default new MeetingsRepository();