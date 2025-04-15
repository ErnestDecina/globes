import ReducerRegistry from "../base/redux/ReducerRegistry";
import { UPDATE_SCREENSHARE_POPUP_STATE } from "./actionTypes";

const DEFAULT_STATE = {
    isScreenSharePopupOpen: false,
};

export interface IKoreanConferenceState {
    isScreenSharePopupOpen: boolean;
}

ReducerRegistry.register<IKoreanConferenceState>('features/conference', (state = DEFAULT_STATE, action): IKoreanConferenceState => {
    switch (action.type) {
    case UPDATE_SCREENSHARE_POPUP_STATE: {
        return {
            ...state,
            isScreenSharePopupOpen: action.isScreenSharePopupOpen
        }
    }
    }
    return state;

    
});