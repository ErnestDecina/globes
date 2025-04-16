import { throttle } from "lodash-es";
import React from "react";
import { WithTranslation } from "react-i18next";
import { connect as reactReduxConnect, useSelector } from "react-redux";

// @ts-expect-error
import VideoLayout from "../../../../../../modules/UI/videolayout/VideoLayout";
import { IReduxState, IStore } from "../../../../app/types";
import { getConferenceNameForTitle } from "../../../../base/conference/functions";
import { translate } from "../../../../base/i18n/functions";
import { setColorAlpha } from "../../../../base/util/helpers";
import KoreanLargeVideo from "./KoreanLargeVideo.web";
import LobbyScreen from "../../../../lobby/components/web/LobbyScreen";
import { getIsLobbyVisible } from "../../../../lobby/functions";
import { getOverlayToRender } from "../../../../overlay/functions.web";
import Prejoin from "../../../../prejoin/components/web/Prejoin";
import { isPrejoinPageVisible } from "../../../../prejoin/functions";
import ReactionAnimations from "../../../../reactions/components/web/ReactionsAnimations";
import { toggleToolboxVisible } from "../../../../toolbox/actions.any";
import { closeOverflowMenuIfOpen, fullScreenChanged, showToolbox } from "../../../../toolbox/actions.web";
import { LAYOUT_CLASSNAMES } from "../../../../video-layout/constants";
import { getCurrentLayout } from "../../../../video-layout/functions.any";
import VisitorsQueue from "../../../../visitors/components/web/VisitorsQueue";
import { showVisitorsQueue } from "../../../../visitors/functions";
import { init } from "../../../actions.web";
import { maybeShowSuboptimalExperienceNotification } from "../../../functions.web";
import { AbstractConference, abstractMapStateToProps } from "../../AbstractConference";
import type { AbstractProps } from "../../AbstractConference";
import KoreanWebCams from "./KoreanWebCams";
import {
    X,
    Plus,
    Volume2,
    Volume1,
    Image,
    FileText,
    FileEdit,
    Inbox,
    MoreVertical,
    Mic,
    MicOff,
    Headphones,
    HeadphoneOff,
    Video,
    MessageSquare,
    Cast,
    MonitorX,
    NotebookPen,
    Hand,
    Captions,
    MessageSquareOff,
    VideoOff,
} from "lucide-react";
import { toggleChat } from "../../../../chat/actions.web";
import { leaveConference } from "../../../../base/conference/actions.web";
import KoreanChat from "./KoreanChat";
import { openSettingsDialog } from "../../../../settings/actions.web";
import { IGUMPendingState } from "../../../../base/media/types";
import { getLocalDesktopTrack, isLocalTrackMuted } from "../../../../base/tracks/functions.web";
import { MEDIA_TYPE, VIDEO_MUTISM_AUTHORITY } from "../../../../base/media/constants";
import { muteLocal } from "../../../../video-menu/actions.web";
import { SET_VIDEO_MUTED } from "../../../../base/media/actionTypes";
import { isScreenVideoShared } from "../../../../screen-share/functions";
import { startScreenShareFlow } from "../../../../screen-share/actions.web";
import { setSeeWhatIsBeingShared } from "../../../../large-video/actions.web";
import { getLocalParticipant, hasRaisedHand } from "../../../../base/participants/functions";
import { getLargeVideoParticipant } from "../../../../large-video/functions";
import { sendAnalytics } from "../../../../analytics/functions";
import { createToolbarEvent } from "../../../../analytics/AnalyticsEvents";
import { IParticipant } from "../../../../base/participants/types";
import { raiseHand } from "../../../../base/participants/actions";
import {
    START_POWERPOINT_SLIDES_AS_PRESENTER,
    STOP_POWERPOINT_SLIDES_AS_PRESENTER,
    UPDATE_AI_NOTES_CONTENT,
    UPDATE_AI_NOTES_WINDOW_REF,
    UPDATE_SCREENSHARE_POPUP_STATE,
} from "../../../actionTypes";
import ScreenSharePopup from "./ScreenSharePopup";
import axios from "axios";
import API from "../../../../../../modules/API";

const FULL_SCREEN_EVENTS = ["webkitfullscreenchange", "mozfullscreenchange", "fullscreenchange"];

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
interface IProps extends AbstractProps, WithTranslation {
    /**
     * The alpha(opacity) of the background.
     */
    _backgroundAlpha?: number;

    /**
     * Are any overlays visible?
     */
    _isAnyOverlayVisible: boolean;

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string;

    /**
     * The config specified interval for triggering mouseMoved iframe api events.
     */
    _mouseMoveCallbackInterval?: number;

    /**
     *Whether or not the notifications should be displayed in the overflow drawer.
     */
    _overflowDrawer: boolean;

    /**
     * Name for this conference room.
     */
    _roomName: string;

    /**
     * If lobby page is visible or not.
     */
    _showLobby: boolean;

    /**
     * If prejoin page is visible or not.
     */
    _showPrejoin: boolean;

    /**
     * If visitors queue page is visible or not.
     * NOTE: This should be set to true once we received an error on connect. Before the first connect this will always
     * be false.
     */
    _showVisitorsQueue: boolean;

    _isChatOpen: boolean;

    _gumPending: IGUMPendingState;

    _audioMuted: boolean;

    _videoMuted: boolean;

    _isScreensharing: boolean;

    _seeWhatIsBeingShared: boolean;

    _localParticipantId: string | undefined;

    _largeVideoParticipantId: string;

    _localScreenShare: IParticipant | undefined;

    _raiseHand: boolean;

    _isScreenSharePopupOpen: boolean;

    _isPDFScreenShare: boolean;

    _aiNotesContent: string;
    _aiNotesWindowRef: Window | null;

    _locationURL: URL;

    _meetingRealName: string;
    dispatch: IStore["dispatch"];
}

/**
 * Returns true if the prejoin screen should be displayed and false otherwise.
 *
 * @param {IProps} props - The props object.
 * @returns {boolean} - True if the prejoin screen should be displayed and false otherwise.
 */
function shouldShowPrejoin({ _showLobby, _showPrejoin, _showVisitorsQueue }: IProps) {
    return _showPrejoin && !_showVisitorsQueue && !_showLobby;
}

/**
 * The conference page of the Web application.
 */
class KoreanConference extends AbstractConference<IProps, any> {
    _originalOnMouseMove: Function;
    _originalOnShowToolbar: Function;

    constructor(props: IProps) {
        super(props);

        const { _mouseMoveCallbackInterval } = props;

        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._originalOnMouseMove = this._onMouseMove;

        this._onShowToolbar = throttle(() => this._originalOnShowToolbar(), 100, {
            leading: true,
            trailing: false,
        });

        this._onMouseMove = throttle((event) => this._originalOnMouseMove(event), _mouseMoveCallbackInterval, {
            leading: true,
            trailing: false,
        });

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
        this._onVideospaceTouchStart = this._onVideospaceTouchStart.bind(this);
        this._setBackground = this._setBackground.bind(this);
        this._onChatButtonClick = this._onChatButtonClick.bind(this);
        this._onLeaveButtonClick = this._onLeaveButtonClick.bind(this);
        this._onSettingsButtonClick = this._onSettingsButtonClick.bind(this);
        this._onMuteAudioButtonClick = this._onMuteAudioButtonClick.bind(this);
        this._onWebcamButtonClick = this._onWebcamButtonClick.bind(this);
        this._onScreenShareButtonClick = this._onScreenShareButtonClick.bind(this);
        this._onRaiseHandButtonClick = this._onRaiseHandButtonClick.bind(this);
        this._toggleScreenSharePopup = this._toggleScreenSharePopup.bind(this);
        this._handleScreenShare = this._handleScreenShare.bind(this);
        this._handleFileSubmit = this._handleFileSubmit.bind(this);
        this._openAINotesWindow = this._openAINotesWindow.bind(this);
        this._handleAINotesWindowMessage = this._handleAINotesWindowMessage.bind(this);
        this._onAINotesButtonClick = this._onAINotesButtonClick.bind(this); 
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        FULL_SCREEN_EVENTS.forEach((name) => document.removeEventListener(name, this._onFullScreenChange));
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._start();
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<any>, snapshot?: any): void {
        const { _localScreenShare, _isScreensharing } = this.props;



        if (_localScreenShare && _isScreensharing) {
            VideoLayout.updateLargeVideo(_localScreenShare?.id, true, true);
        } else {
            VideoLayout.updateLargeVideo(undefined, true, true);
        }
    }

    render() {
        const {
            _isAnyOverlayVisible,
            _layoutClassName,
            _notificationsVisible,
            _overflowDrawer,
            _showLobby,
            _showPrejoin,
            _showVisitorsQueue,
            t,
        } = this.props;

        return (
            <div
                onMouseEnter={this._onMouseEnter}
                onMouseLeave={this._onMouseLeave}
                onMouseMove={this._onMouseMove}
                ref={this._setBackground}
                style={{
                    backgroundColor: "white",
                    height: "100vh",
                    width: "100vw",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <ScreenSharePopup
                    isOpen={this.props._isScreenSharePopupOpen}
                    onClose={this._toggleScreenSharePopup}
                    onScreenShare={this._handleScreenShare}
                    onFileSubmit={this._handleFileSubmit}
                />
                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        height: "100%",
                        backgroundColor: "white",
                    }}
                >
                    <div
                        style={{
                            flex: 5, // Takes most space
                            position: "relative",
                            backgroundColor: "white",
                            height: "100%",
                            width: "100%",
                        }}
                    >
                        {/* Video */}

                        <div
                            onTouchStart={this._onVideospaceTouchStart}
                            style={{
                                height: "90%",
                                width: "100%",
                                backgroundColor: "black",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <KoreanLargeVideo />
                        </div>

                        {/* Navbar - FIXED */}
                        <div
                            style={{
                                position: "absolute",
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    padding: "8px",
                                    backgroundColor: "#f3f4f6",
                                }}
                            >
                                {/* 3-dot menu on the left */}
                                <div
                                    style={{
                                        flexShrink: 0,
                                    }}
                                >
                                    <button
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "50%",
                                            backgroundColor: "#d1d5db",
                                            color: "#374151",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                        onClick={this._onSettingsButtonClick}
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                </div>

                                {/* Centered action buttons */}
                                <div
                                    style={{
                                        flexGrow: 1,
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <button
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "50%",
                                            backgroundColor: "#ef4444",
                                            color: "white",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                        onClick={this._onLeaveButtonClick}
                                    >
                                        <X size={20} />
                                    </button>

                                    {!this.props._audioMuted ? (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#2cfc03",
                                                color: "white",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onMuteAudioButtonClick}
                                        >
                                            <Mic size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ff0000",
                                                color: "white",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onMuteAudioButtonClick}
                                        >
                                            <MicOff size={20} />
                                        </button>
                                    )}

                                    {/* Video Camera */}
                                    {!this.props._videoMuted ? (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#2cfc03",
                                                color: "white",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onWebcamButtonClick}
                                        >
                                            <Video size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ff0000",
                                                color: "white",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onWebcamButtonClick}
                                        >
                                            <VideoOff size={20} />
                                        </button>
                                    )}

                                    {/* ScreenShare */}

                                    {this.props._isScreensharing || this.props._isPDFScreenShare ? (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ff0000",
                                                color: "white",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onScreenShareButtonClick}
                                        >
                                            <MonitorX size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#0394fc",
                                                color: "white",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onScreenShareButtonClick}
                                        >
                                            <Cast size={20} />
                                        </button>
                                    )}

                                    {/* Handup */}
                                    {!this.props._raiseHand ? (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#0394fc",
                                                color: "white",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onRaiseHandButtonClick}
                                        >
                                            <Hand size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ff0000",
                                                color: "white",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onRaiseHandButtonClick}
                                        >
                                            <Hand size={20} />
                                        </button>
                                    )}

                                    {/* AI Notes */}
                                    <button
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "50%",
                                            backgroundColor: "#0394fc",
                                            color: "white",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                        onClick={this._onAINotesButtonClick}
                                    >
                                        <NotebookPen size={20} />
                                    </button>

                                    {/* SubTitles */}
                                    <button
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "50%",
                                            backgroundColor: "#0394fc",
                                            color: "white",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Captions size={20} />
                                    </button>
                                </div>

                                {/* Help button on the right */}
                                <div
                                    style={{
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* Chat button */}
                                    {this.props._isChatOpen ? (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#d1d5db",
                                                color: "#374151",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onChatButtonClick}
                                        >
                                            <MessageSquareOff size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "50%",
                                                backgroundColor: "#d1d5db",
                                                color: "#374151",
                                                border: "none",
                                                cursor: "pointer",
                                            }}
                                            onClick={this._onChatButtonClick}
                                        >
                                            <MessageSquare size={20}></MessageSquare>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Webcam or Chat */}
                    <div
                        style={{
                            flex: 1, // Smaller right section
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "white",
                        }}
                    >
                        {this.props._isChatOpen ? (
                            <div
                                style={{
                                    height: "100%",
                                }}
                            >
                                <KoreanChat />
                            </div>
                        ) : (
                            <KoreanWebCams />
                        )}
                    </div>

                    {shouldShowPrejoin(this.props) && <Prejoin />}
                    {_showLobby && !_showVisitorsQueue && <LobbyScreen />}
                </div>
                <ReactionAnimations />
            </div>
        );
    }

    _onChatButtonClick(event: React.MouseEvent<HTMLDivElement>) {
        if (!event) {
            return;
        }

        if (this.props._isChatOpen !== undefined) {
            const oldIsOpen = this.props._isChatOpen;
            const isOpen = oldIsOpen ? false : true;
            this.props.dispatch(toggleChat());

            console.log(isOpen);
        }
    }

    _onLeaveButtonClick(event: React.MouseEvent<HTMLDivElement>) {
        if (!event) {
            return;
        }
        this.props.dispatch(leaveConference());
    }

    _onSettingsButtonClick(event: React.MouseEvent<HTMLDivElement>) {
        if (!event) {
            return;
        }

        this.props.dispatch(openSettingsDialog(undefined, false));
    }

    _onMuteAudioButtonClick(event: React.MouseEvent<HTMLDivElement>) {
        if (!event) {
            return;
        }

        this.props.dispatch(muteLocal(!this.props._audioMuted, MEDIA_TYPE.AUDIO));
    }

    _onWebcamButtonClick(event: React.MouseEvent<HTMLDivElement>) {
        if (!event) {
            return;
        }

        console.log(`Video Muted: ${this.props._videoMuted}`);
        if (!this.props._videoMuted) {
            this.props.dispatch({
                type: SET_VIDEO_MUTED,
                authority: VIDEO_MUTISM_AUTHORITY.USER,
                ensureTrack: true,
                muted: true,
            });

            typeof APP === "undefined" || APP.conference.muteVideo(true, true);
        } else {
            this.props.dispatch({
                type: SET_VIDEO_MUTED,
                authority: VIDEO_MUTISM_AUTHORITY.USER,
                ensureTrack: true,
                muted: false,
            });

            typeof APP === "undefined" || APP.conference.muteVideo(false, true);
        }
    }

    _onScreenShareButtonClick(event: React.MouseEvent<HTMLDivElement>) {
        if (!event) {
            return;
        }

        const { dispatch } = this.props;

        console.log(`ScreenShare: ${this.props._isScreensharing}, PDF Share: ${this.props._isPDFScreenShare}`);

        // If already screen sharing, just toggle it off
        if (this.props._isPDFScreenShare) {
            dispatch({ type: STOP_POWERPOINT_SLIDES_AS_PRESENTER });
            API.noitfyPowerpointStop();
            return;
        }

        if (this.props._isScreensharing) {
            this._handleScreenShare();
            return;
        }

        // Otherwise, show the popup
        this._toggleScreenSharePopup();
    }

    _toggleScreenSharePopup() {
        const { dispatch, _isScreenSharePopupOpen, _isPDFScreenShare } = this.props;

        if (_isScreenSharePopupOpen) {
            dispatch({
                type: UPDATE_SCREENSHARE_POPUP_STATE,
                isScreenSharePopupOpen: false,
            });
        } else {
            dispatch({
                type: UPDATE_SCREENSHARE_POPUP_STATE,
                isScreenSharePopupOpen: true,
            });
        }
    }

    _handleScreenShare() {
        const { dispatch, _isScreensharing, _largeVideoParticipantId, _localScreenShare } = this.props;

        sendAnalytics(createToolbarEvent("toggle.screen.sharing", { enable: !_isScreensharing }));

        if (!_isScreensharing) {
            dispatch(setSeeWhatIsBeingShared(true));
            dispatch(closeOverflowMenuIfOpen());
            dispatch(startScreenShareFlow(true));
        } else {
            dispatch(setSeeWhatIsBeingShared(false));
            dispatch(startScreenShareFlow(false));
        }
    }

    async _handleFileSubmit(files: { file1: File | null; file2: File | null }) {
        const { dispatch, _locationURL } = this.props;

        const url = _locationURL.pathname.slice(1);

        if (files.file1) {
            const formData = new FormData();
            formData.append("slides", files.file1);

            try {
                axios.post(`http://localhost:3000/api/v1/meetings/${url}/slides?lang=en`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            } catch (error) {
                console.error(error);
            }
        }

        if (files.file2) {
            const formData = new FormData();
            formData.append("slides", files.file2);

            try {
                const response = await axios.post(
                    `http://localhost:3000/api/v1/meetings/${url}/slides?lang=ko`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                const data = response.data;

                console.log(data);
                dispatch({
                    type: START_POWERPOINT_SLIDES_AS_PRESENTER,
                    count: data.count,
                });
                API.noitfyPowerpointStart(data.count);
            } catch (error) {
                console.error(error);
            }
        }
    }

    _onRaiseHandButtonClick(event: React.MouseEvent<HTMLDivElement>) {
        if (!event) {
            return;
        }

        const { dispatch, _raiseHand } = this.props;

        dispatch(raiseHand(!_raiseHand));
    }


    _openAINotesWindow() {
        const { dispatch, _aiNotesContent, _aiNotesWindowRef, _meetingRealName, _locationURL } = this.props;
        const url = _locationURL.pathname.slice(1);
        // Check if window is already open
        if (_aiNotesWindowRef && !_aiNotesWindowRef.closed) {
            _aiNotesWindowRef.focus();
            return;
        }
        
        // Open new window
        const aiNotesWindow = window.open( 
            'http://localhost:3000/static/ai-notes-window.html', // Path to your HTML file
            'AINotesWindow',
            'width=800,height=600,resizable=yes,scrollbars=yes'
        );
        
        if (aiNotesWindow) {
            // Save reference to the window
            dispatch({
                type: UPDATE_AI_NOTES_WINDOW_REF,
                windowRef: aiNotesWindow
            });
            
            // Setup message listener for communication with the new window
            window.addEventListener('message', this._handleAINotesWindowMessage);
            
            // Wait for window to load before sending data
            window.addEventListener('message', (event) => {
                if (event.data?.type === 'aiNotesWindowReady') {
                    aiNotesWindow.postMessage({
                        type: 'notesContent',
                        content: _aiNotesContent || ''
                    }, '*');
            
                    aiNotesWindow.postMessage({
                        type: 'roomName',
                        roomName: _meetingRealName || 'Unknown'
                    }, '*');

                    aiNotesWindow.postMessage({
                        type: 'uuid',
                        uuid: url
                    }, '*');
                }
            
                // optionally handle other messages
            });
        }
    }

    _handleAINotesWindowMessage(event) {
        const { dispatch } = this.props;
        
        // Handle messages from the AI Notes window
        if (event.data && event.data.type) {
            switch (event.data.type) {
                case 'notesUpdated':
                case 'notesSaved':
                    // Update Redux with the notes content
                    dispatch({
                        type: UPDATE_AI_NOTES_CONTENT,
                        aiNotesContent: event.data.content
                    });
                    break;
                    
                case 'aiNotesWindowClosed':
                    // Update Redux with the final notes before window closed
                    dispatch({
                        type: UPDATE_AI_NOTES_CONTENT,
                        aiNotesContent: event.data.content
                    });
                    
                    // Clean up window reference
                    dispatch({
                        type: UPDATE_AI_NOTES_WINDOW_REF,
                        windowRef: null
                    });
                    
                    // Remove the message listener
                    window.removeEventListener('message', this._handleAINotesWindowMessage);
                    break;
                    
                case 'aiNotesWindowReady':
                    // Window is ready, we could trigger a notes generation if needed
                    break;
            }
        }
    }

    _onAINotesButtonClick(event: React.MouseEvent<HTMLDivElement>) {
        if (!event) {
            return;
        }
        
        this._openAINotesWindow();
    }

    /**
     * Sets custom background opacity based on config. It also applies the
     * opacity on parent element, as the parent element is not accessible directly,
     * only though it's child.
     *
     * @param {Object} element - The DOM element for which to apply opacity.
     *
     * @private
     * @returns {void}
     */
    _setBackground(element: HTMLDivElement) {
        if (!element) {
            return;
        }

        if (this.props._backgroundAlpha !== undefined) {
            const elemColor = element.style.background;
            const alphaElemColor = setColorAlpha(elemColor, this.props._backgroundAlpha);

            element.style.background = alphaElemColor;
            if (element.parentElement) {
                const parentColor = element.parentElement.style.background;
                const alphaParentColor = setColorAlpha(parentColor, this.props._backgroundAlpha);

                element.parentElement.style.background = alphaParentColor;
            }
        }
    }

    /**
     * Handler used for touch start on Video container.
     *
     * @private
     * @returns {void}
     */
    _onVideospaceTouchStart() {
        this.props.dispatch(toggleToolboxVisible());
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }

    /**
     * Triggers iframe API mouseEnter event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseEnter(event: React.MouseEvent) {
        APP.API.notifyMouseEnter(event);
    }

    /**
     * Triggers iframe API mouseLeave event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseLeave(event: React.MouseEvent) {
        APP.API.notifyMouseLeave(event);
    }

    /**
     * Triggers iframe API mouseMove event.
     *
     * @param {MouseEvent} event - The mouse event.
     * @private
     * @returns {void}
     */
    _onMouseMove(event: React.MouseEvent) {
        APP.API.notifyMouseMove(event);
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        FULL_SCREEN_EVENTS.forEach((name) => document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;

        // if we will be showing prejoin we don't want to call connect from init.
        // Connect will be dispatched from prejoin screen.
        dispatch(init(!shouldShowPrejoin(this.props)));

        maybeShowSuboptimalExperienceNotification(dispatch, t);
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { backgroundAlpha, mouseMoveCallbackInterval } = state["features/base/config"];
    const { overflowDrawer } = state["features/toolbox"];
    const { isOpen } = state["features/chat"];
    const { gumPending } = state["features/base/media"].audio;
    const _audioMuted = isLocalTrackMuted(state["features/base/tracks"], MEDIA_TYPE.AUDIO);
    const tracks = state["features/base/tracks"];
    const localParticipantId = getLocalParticipant(state)?.id;
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const { seeWhatIsBeingShared } = state["features/large-video"];
    const localDesktopTrack = getLocalDesktopTrack(tracks);
    const { local, localScreenShare, remote } = state["features/base/participants"];
    const localParticipant = getLocalParticipant(state);
    const { isScreenSharePopupOpen, isPDFScreenShare } = state["features/conference"];
    const { locationURL = { href: "" } as URL } = state["features/base/connection"];
    const { meetingRealName } = state["features/conference"];
    return {
        ...abstractMapStateToProps(state),
        _backgroundAlpha: backgroundAlpha,
        _isAnyOverlayVisible: Boolean(getOverlayToRender(state)),
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state) ?? ""],
        _mouseMoveCallbackInterval: mouseMoveCallbackInterval,
        _overflowDrawer: overflowDrawer,
        _roomName: getConferenceNameForTitle(state),
        _showLobby: getIsLobbyVisible(state),
        _showPrejoin: isPrejoinPageVisible(state),
        _showVisitorsQueue: showVisitorsQueue(state),
        _isChatOpen: isOpen,
        _gumPending: gumPending,
        _audioMuted: _audioMuted,
        _videoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        _isScreensharing: isScreenVideoShared(state),
        _localParticipantId: localParticipantId,
        _largeVideoParticipantId: localDesktopTrack?.participantId,
        _seeWhatIsBeingShared: Boolean(seeWhatIsBeingShared),
        _localScreenShare: localScreenShare,
        _raiseHand: hasRaisedHand(localParticipant),
        _isScreenSharePopupOpen: isScreenSharePopupOpen,
        _locationURL: locationURL,
        _isPDFScreenShare: isPDFScreenShare,
        _meetingRealName: meetingRealName
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(KoreanConference));
