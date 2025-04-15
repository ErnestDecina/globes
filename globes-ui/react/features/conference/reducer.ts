import ReducerRegistry from "../base/redux/ReducerRegistry";
import { NEXT_IMAGE, PREVIOUS_IMAGE, SET_IMAGE_INDEX, SET_LANGUAGE, START_POWERPOINT_SLIDES, START_POWERPOINT_SLIDES_AS_PRESENTER, STOP_POWERPOINT_SLIDES_AS_PRESENTER, TOGGLE_DROPDOWN, UPDATE_SCREENSHARE_POPUP_STATE } from "./actionTypes";

const DEFAULT_STATE = {
    isScreenSharePopupOpen: false,
    isLocalPDFScreenSharePresenter: false,
    isPDFScreenShare: false,
    pdfScreenShareCount: 0,
    currentIndex: 0,
    languageSelection: 'ko',
    showDropdown: false
};

export interface IKoreanConferenceState {
    isScreenSharePopupOpen: boolean;
    isLocalPDFScreenSharePresenter: boolean;
    isPDFScreenShare: boolean;
    pdfScreenShareCount: number;
    currentIndex: number;
    languageSelection: string;
    showDropdown: boolean;
}

ReducerRegistry.register<IKoreanConferenceState>('features/conference', (state = DEFAULT_STATE, action): IKoreanConferenceState => {
    switch (action.type) {
    case START_POWERPOINT_SLIDES: {
        return {
            ...state,
            isLocalPDFScreenSharePresenter: false,
            isPDFScreenShare: true,
            pdfScreenShareCount: action.count
        }
    }

    case START_POWERPOINT_SLIDES_AS_PRESENTER: {
        return {
            ...state,
            isLocalPDFScreenSharePresenter: true,
            isPDFScreenShare: true,
            pdfScreenShareCount: action.count
        }
    }

    case STOP_POWERPOINT_SLIDES_AS_PRESENTER: {
        return {
            ...state,
            isLocalPDFScreenSharePresenter: false,
            isPDFScreenShare: false,
            pdfScreenShareCount: 0
        }
    }


    case UPDATE_SCREENSHARE_POPUP_STATE: {
        return {
            ...state,
            isScreenSharePopupOpen: action.isScreenSharePopupOpen
        }
    }

    case SET_IMAGE_INDEX: {
        {
            return {
                ...state,
                currentIndex: action.index
            }
        }
    }

    case NEXT_IMAGE:
      return {
        ...state,
        currentIndex: state.currentIndex === state.pdfScreenShareCount - 1 ? 0 : state.currentIndex + 1
      };
    case PREVIOUS_IMAGE:
      return {
        ...state,
        currentIndex: state.currentIndex === 0 ? state.pdfScreenShareCount - 1 : state.currentIndex - 1
      };
    case SET_LANGUAGE:
      return {
        ...state,
        languageSelection: action.payload,
        showDropdown: false
      };
    case TOGGLE_DROPDOWN:
      return {
        ...state,
        showDropdown: !state.showDropdown
      };
    }
    return state;

    
});