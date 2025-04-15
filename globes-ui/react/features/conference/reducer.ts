import API from "../../../modules/API";
import ReducerRegistry from "../base/redux/ReducerRegistry";
import { NEXT_IMAGE, PREVIOUS_IMAGE, SET_IMAGE_INDEX, SET_LANGUAGE, START_POWERPOINT_SLIDES, START_POWERPOINT_SLIDES_AS_PRESENTER, STOP_POWERPOINT_SLIDES_AS_PRESENTER, TOGGLE_DROPDOWN, UPDATE_AI_NOTES_CONTENT, UPDATE_AI_NOTES_WINDOW_REF, UPDATE_MEETING_REAL_NAME, UPDATE_SCREENSHARE_POPUP_STATE } from "./actionTypes";

const DEFAULT_STATE = {
    isScreenSharePopupOpen: false,
    isLocalPDFScreenSharePresenter: false,
    isPDFScreenShare: false,
    pdfScreenShareCount: 0,
    currentIndex: 1,
    languageSelection: 'ko',
    showDropdown: false,
    aiNotesContent: '',
    aiNotesWindowRef: null,
    meetingRealName: ''
};

export interface IKoreanConferenceState {
    isScreenSharePopupOpen: boolean;
    isLocalPDFScreenSharePresenter: boolean;
    isPDFScreenShare: boolean;
    pdfScreenShareCount: number;
    currentIndex: number;
    languageSelection: string;
    showDropdown: boolean;
    aiNotesContent: string;
    aiNotesWindowRef: Window | null;
    meetingRealName: string;

}

ReducerRegistry.register<IKoreanConferenceState>('features/conference', (state = DEFAULT_STATE, action): IKoreanConferenceState => {
    switch (action.type) {
    case UPDATE_MEETING_REAL_NAME: {
      return {
        ...state,
        meetingRealName: action.meetingRealName
      }
    }

    case START_POWERPOINT_SLIDES: {
      console.log(`WWWW: ${action.count}`);

      if(!state.isLocalPDFScreenSharePresenter) {
        return {
          ...state,
          isLocalPDFScreenSharePresenter: false,
          isPDFScreenShare: true,
          pdfScreenShareCount: action.count
      }
      }

      return {
        ...state
      }
    }

    case START_POWERPOINT_SLIDES_AS_PRESENTER: {
      console.log(`WWWW: ${action.count}`);
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
      console.log(`${state.currentIndex}, ${state.pdfScreenShareCount}`);
      const index = state.currentIndex === state.pdfScreenShareCount ? 1 : state.currentIndex + 1;
      API.noitfyPowerpointIncrement(index);
      return {
        ...state,
        currentIndex: index
      };
    case PREVIOUS_IMAGE:
      const index2 =  state.currentIndex === 1 ? state.pdfScreenShareCount : state.currentIndex - 1
      API.noitfyPowerpointDecrement(index2);
      return {
        ...state,
        currentIndex: index2
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



      case UPDATE_AI_NOTES_CONTENT:
        return {
            ...state,
            aiNotesContent: action.aiNotesContent
        };
        
    case UPDATE_AI_NOTES_WINDOW_REF:
        return {
            ...state,
            aiNotesWindowRef: action.windowRef
        };
    }


    

    return state;

    
});