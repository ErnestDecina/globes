import axios from 'axios';
import { LANGUAGE_CHANGED } from '../base/i18n/actionTypes';
import languageDetector from '../base/i18n/languageDetector.web';
import { ILocalParticipant, IParticipant } from '../base/participants/types';
import ReducerRegistry from '../base/redux/ReducerRegistry';


import {
    ADD_MESSAGE,
    ADD_MESSAGE_REACTION,
    ADD_MESSAGE_REDUCER,
    CLEAR_MESSAGES,
    CLOSE_CHAT,
    EDIT_MESSAGE,
    OPEN_CHAT,
    REMOVE_LOBBY_CHAT_PARTICIPANT,
    RERENDER_CHAT,
    SET_IS_POLL_TAB_FOCUSED,
    SET_LOBBY_CHAT_ACTIVE_STATE,
    SET_LOBBY_CHAT_RECIPIENT,
    SET_PRIVATE_MESSAGE_RECIPIENT
} from './actionTypes';
import { IMessage } from './types';

const DEFAULT_STATE = {
    isOpen: false,
    isPollsTabFocused: false,
    lastReadMessage: undefined,
    messages: [],
    originalMessages: [],
    displayMessages: [],
    reactions: {},
    nbUnreadMessages: 0,
    privateMessageRecipient: undefined,
    lobbyMessageRecipient: undefined,
    isLobbyChatActive: false,
    location: ""
};

export interface IChatState {
    isLobbyChatActive: boolean;
    isOpen: boolean;
    isPollsTabFocused: boolean;
    lastReadMessage?: IMessage;
    lobbyMessageRecipient?: {
        id: string;
        name: string;
    } | ILocalParticipant;
    messages: IMessage[];
    originalMessages: IMessage[];
    displayMessages: IMessage[];
    nbUnreadMessages: number;
    privateMessageRecipient?: IParticipant;
    location: string;
}

ReducerRegistry.register<IChatState>('features/chat', (state = DEFAULT_STATE, action): IChatState => {
    switch (action.type) {
    case ADD_MESSAGE_REDUCER: {
        const newMessage: IMessage = {
            displayName: action.displayName,
            error: action.error,
            participantId: action.participantId,
            isReaction: action.isReaction,
            messageId: action.messageId,
            messageType: action.messageType,
            message: action.message,
            reactions: action.reactions,
            privateMessage: action.privateMessage,
            lobbyChat: action.lobbyChat,
            recipient: action.recipient,
            timestamp: action.timestamp,
        };

        // React native, unlike web, needs a reverse sorted message list.
        const messages = navigator.product === 'ReactNative'
            ? [
                newMessage,
                ...state.messages
            ]
            : [
                ...state.messages,
                newMessage
            ];

        return {
            ...state,
            lastReadMessage:
                action.hasRead ? newMessage : state.lastReadMessage,
            nbUnreadMessages: state.isPollsTabFocused ? state.nbUnreadMessages + 1 : state.nbUnreadMessages,
            messages
        };
    }

    case ADD_MESSAGE_REACTION: {
        const { participantId, reactionList, messageId } = action;

        const messages = state.messages.map(message => {
            if (messageId === message.messageId) {
                const newReactions = new Map(message.reactions);

                reactionList.forEach((reaction: string) => {
                    let participants = newReactions.get(reaction);

                    if (!participants) {
                        participants = new Set();
                        newReactions.set(reaction, participants);
                    }

                    participants.add(participantId);
                });

                return {
                    ...message,
                    reactions: newReactions
                };
            }

            return message;
        });

        return {
            ...state,
            messages
        };
    }

    case CLEAR_MESSAGES:
        return {
            ...state,
            lastReadMessage: undefined,
            messages: []
        };

    case EDIT_MESSAGE: {
        let found = false;
        const newMessage = action.message;
        const messages = state.messages.map(m => {
            if (m.messageId === newMessage.messageId) {
                found = true;

                return newMessage;
            }

            return m;
        });

        // no change
        if (!found) {
            return state;
        }

        return {
            ...state,
            messages
        };
    }

    case SET_PRIVATE_MESSAGE_RECIPIENT:
        return {
            ...state,
            privateMessageRecipient: action.participant
        };

    case OPEN_CHAT:
        return {
            ...state,
            isOpen: true,
            privateMessageRecipient: action.participant
        };

    case CLOSE_CHAT:
        return {
            ...state,
            isOpen: false,
            lastReadMessage: state.messages[
                navigator.product === 'ReactNative' ? 0 : state.messages.length - 1],
            privateMessageRecipient: action.participant,
            isLobbyChatActive: false
        };
    


    case SET_IS_POLL_TAB_FOCUSED: {
        return {
            ...state,
            isPollsTabFocused: action.isPollsTabFocused,
            nbUnreadMessages: 0
        }; }

    case SET_LOBBY_CHAT_RECIPIENT:
        return {
            ...state,
            isLobbyChatActive: true,
            lobbyMessageRecipient: action.participant,
            privateMessageRecipient: undefined,
            isOpen: action.open
        };
    case SET_LOBBY_CHAT_ACTIVE_STATE:
        return {
            ...state,
            isLobbyChatActive: action.payload,
            isOpen: action.payload || state.isOpen,
            privateMessageRecipient: undefined
        };
    case REMOVE_LOBBY_CHAT_PARTICIPANT:
        return {
            ...state,
            messages: state.messages.filter(m => {
                if (action.removeLobbyChatMessages) {
                    return !m.lobbyChat;
                }

                return true;
            }),
            isOpen: state.isOpen && state.isLobbyChatActive ? false : state.isOpen,
            isLobbyChatActive: false,
            lobbyMessageRecipient: undefined
        };
    
    case LANGUAGE_CHANGED:  {
        const temp = [ ...state.originalMessages ];
        const language = languageDetector.detect();

        console.log(state.location);

        (async () => {
            await wait(5000);
            const data = await getTranslatedMessages(state.location, language || '');

            console.log(data);
            const messages = state.messages.map(m => {
                data.map(translatedMessage => {
                    if(translatedMessage.messageId === m.messageId && m.messageType !== "local") {
                        m.message = translatedMessage.translation_message;
                    }
                })
                return m;
            });

            return {
                ...state,
                messages: messages
            }
        })();

        break;
    }

    case RERENDER_CHAT: {
        return {
            ...state,
            messages: state.messages
        }
        break;
    }

    case "UPDATE_LOCATION": {
        return {
            ...state,
            location: action.location
        }
    }
    }


    

    return state;

    
});


async function getTranslatedMessages(location: string, lang: string): Promise<any> {
    console.log(`http://localhost:3000/api/v1/meetings/${location}/translations?lang=${lang}`);
    const data = await axios.get(`http://localhost:3000/api/v1/meetings/${location}/translations?lang=${lang}`);
    
    return await data.data;
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  