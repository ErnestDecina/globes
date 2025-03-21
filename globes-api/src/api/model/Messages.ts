import { Model, DataTypes, Optional } from 'sequelize';
import { DatabasePostgres } from '../../database';

export interface MessageAttributes {
    messageId: string;
    meetingId: string;
    originalMessage: string;

    language: string;
}


export type MessageInput = Optional<MessageAttributes, 'messageId'>;
export type MessageOutput= Required<MessageAttributes>;


class Messages extends Model<MessageAttributes, MessageInput> implements MessageAttributes {
    messageId: string;
    meetingId: string;
    originalMessage: string;
    language: string;
}

Messages.init(
    {
        messageId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        meetingId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
              model: 'Meetings',
              key: 'id',         
            },
            onDelete: 'CASCADE',    
            onUpdate: 'CASCADE',    
          },
        originalMessage:  {
            type: DataTypes.STRING,
            allowNull: false,
        },
        language: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        tableName: 'Messages',
        freezeTableName: true,
        timestamps: true,
        paranoid: true,
        sequelize: DatabasePostgres,
    }
);

export default Messages;