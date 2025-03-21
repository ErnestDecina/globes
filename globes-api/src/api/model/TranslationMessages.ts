import { Model, DataTypes, Optional } from 'sequelize';
import { MessageAttributes } from './Messages';
import { DatabasePostgres } from '../../database';


interface TranslationAttributes {
    translatedMessageId: string;

    messageId: string;
    meetingId: string;

    translation_message: string;
    translated_language: string;
}

export type TranslationInput = Optional<MessageAttributes, 'messageId'>;
export type TranslationOutput = Required<TranslationAttributes>;


class TranslatedMessages extends Model<TranslationAttributes, TranslationInput> implements TranslationAttributes {
    translatedMessageId: string;

    messageId: string;
    meetingId: string;

    translation_message: string;
    translated_language: string;
}

TranslatedMessages.init(
    {
        translatedMessageId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },

        messageId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Messages',
                key: 'messageId',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
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

        translation_message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        translated_language: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        tableName: 'TranslatedMessages',
        freezeTableName: true,
        timestamps: true,
        paranoid: true,
        sequelize: DatabasePostgres,
    }
);

export default TranslatedMessages;