import { Model, DataTypes, Optional } from 'sequelize';
import { DatabasePostgres } from '../../database';

interface MeetingsAttributes {
    id: string;
    meetingName: string;
    meetingTime: Date;
    meetingDescription?: string;
}

export type MeetingInput = Optional<MeetingsAttributes, 'id' | 'meetingDescription'>;
export type MeetingOutput = Required<MeetingsAttributes>;

class Meeting extends Model<MeetingsAttributes, MeetingInput> implements MeetingsAttributes {
    public id!: string;
    public meetingName!: string;
    public meetingTime!: Date;
    public meetingDescription?: string;
}

Meeting.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        meetingName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        meetingTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        meetingDescription: {
            type: DataTypes.STRING,
            allowNull: true
        },
    },
    {
        tableName: 'Meetings',
        freezeTableName: true,
        timestamps: true,
        paranoid: true,
        sequelize: DatabasePostgres,
    }
);

export default Meeting;