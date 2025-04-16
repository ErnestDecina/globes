import React, { Component } from "react";
import { IReduxState, IStore } from "../../../../app/types";
import { connect } from "react-redux";
import {
    getActiveSpeakersToBeDisplayed,
    getDominantSpeakerParticipant,
    getParticipantByIdOrUndefined,
    hasRaisedHand
} from "../../../../base/participants/functions";
import {
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant,
    getVideoTrackByParticipant,
    isLocalTrackMuted
} from "../../../../base/tracks/functions.web";
import { MEDIA_TYPE } from "../../../../base/media/constants";
import { IParticipant } from "../../../../base/participants/types";
import { ITracksState } from "../../../../base/tracks/reducer";
import { setVisibleRemoteParticipants } from "../../../../filmstrip/actions.web";

interface IProps {
    _remoteParticipants: Array<string>;
    _remoteParticipantsLength: number;
    _state: IReduxState;
    _localParticipant: IParticipant | undefined;
    _moderatorVideoStream: any;
    _localVideoMuted: boolean;
    _dominantSpeaker: string | undefined;
    _tracks: ITracksState;
    dispatch: IStore['dispatch']
}

export interface IState {
    canPlayEventReceived: boolean;
    displayMode: number;
    isHovered: boolean;
    popoverVisible: boolean;
    activeSpeakers: Set<string>;
    raisedHands: Set<string>;
    dominantSpeakerId: string | null;
    randomSpeakerId: string | null;
    lastDominantSpeakerId: string | undefined;
    lastRandomSpeakerId: string | null;
}

class KoreanWebCams extends Component<IProps, IState> {
    public moderatorVideoRef = React.createRef<HTMLVideoElement>();
    public localVideoRef = React.createRef<HTMLVideoElement>();
    public dominantSpeakerVideoRef = React.createRef<HTMLVideoElement>();
    public randomSpeakerVideoRef = React.createRef<HTMLVideoElement>();
    private hasUpdated = false;

    private speakerUpdateInterval: number | null = null;
    private participantUpdateInterval: number | null = null;

    constructor(props: IProps) {
        super(props);
        this.state = {
            canPlayEventReceived: false,
            displayMode: 0,
            isHovered: false,
            popoverVisible: false,
            activeSpeakers: new Set<string>(),
            raisedHands: new Set<string>(),
            dominantSpeakerId: 'aaaaaaaa',
            randomSpeakerId: 'aaaaaaaaa',
            lastDominantSpeakerId: undefined,
            lastRandomSpeakerId: null
        };
    }

    componentDidMount() {
        this.speakerUpdateInterval = window.setInterval(() => {
            this.updateActiveSpeakers();
            this.updateRaisedHands();
        }, 1000);

        this.participantUpdateInterval = window.setInterval(() => {
            this.updateDominantAndRandomSpeakers();
            this.updateVideoTracks();
        }, 2000);

        this.updateDominantAndRandomSpeakers();
        this.updateVideoTracks();

        const { dispatch, _remoteParticipants } = this.props;
    
        // Make all remote participants visible to ensure their tracks are available
        dispatch(setVisibleRemoteParticipants(0, _remoteParticipants.length));
    }

    componentWillUnmount() {
        if (this.speakerUpdateInterval) {
            clearInterval(this.speakerUpdateInterval);
        }
        if (this.participantUpdateInterval) {
            clearInterval(this.participantUpdateInterval);
        }
    }

    getModeratorParticipant = () => {
        if (this.props._localParticipant?.role === "moderator") {
            return this.props._localParticipant;
        }
        for (const participantId of this.props._remoteParticipants) {
            const participant = getParticipantByIdOrUndefined(this.props._state, participantId);
            if (participant?.role === "moderator") {
                return participant;
            }
        }
        return null;
    };

    getNonModeratorParticipants = () => {
        const moderatorId = this.getModeratorParticipant()?.id;
        const localId = this.props._localParticipant?.id;
        
        return this.props._remoteParticipants
            .map(id => getParticipantByIdOrUndefined(this.props._state, id))
            .filter(p => p && p.id !== moderatorId && p.id !== localId) as IParticipant[];
    };

    isParticipantSpeaking = (participantId: string | undefined): boolean => {
        if (!participantId) return false;
        const speakers = getActiveSpeakersToBeDisplayed(this.props._state);
        console.log(`Speaker ${participantId} ${speakers.has(participantId)}`);
        return speakers.has(participantId);
    };

    updateActiveSpeakers = () => {
        const newActiveSpeakers = new Set<string>();
        if (this.props._localParticipant && this.isParticipantSpeaking(this.props._localParticipant.id)) {
            newActiveSpeakers.add(this.props._localParticipant.id);
        }
        this.props._remoteParticipants.forEach(participantId => {
            if (this.isParticipantSpeaking(participantId)) {
                newActiveSpeakers.add(participantId);
            }
        });
        if (JSON.stringify(Array.from(newActiveSpeakers)) !== JSON.stringify(Array.from(this.state.activeSpeakers))) {
            this.setState({ activeSpeakers: newActiveSpeakers });
        }
    };

    updateRaisedHands = () => {
        const newRaisedHands = new Set<string>();
        const checkParticipant = (participant: IParticipant | undefined) => {
            if (hasRaisedHand(participant)) {
                newRaisedHands.add(participant.id);
            }
        };
        checkParticipant(this.props._localParticipant);
        this.props._remoteParticipants.forEach(pid => checkParticipant(getParticipantByIdOrUndefined(this.props._state, pid)));
        if (JSON.stringify(Array.from(newRaisedHands)) !== JSON.stringify(Array.from(this.state.raisedHands))) {
            this.setState({ raisedHands: newRaisedHands });
        }
    };

    updateDominantAndRandomSpeakers = () => {
        const dominantSpeakerId = this.props._dominantSpeaker;
        const moderatorId = this.getModeratorParticipant()?.id;
        const localId = this.props._localParticipant?.id;

        // Get non-moderator, non-local participants
        const nonModeratorParticipants = this.getNonModeratorParticipants();
        const nonModeratorIds = nonModeratorParticipants.map(p => p.id);

        let newDominantId: string | null = null;
        let newRandomId: string | null = null;

        // Set dominant speaker ID (if there is one)
        if (dominantSpeakerId && dominantSpeakerId !== moderatorId && dominantSpeakerId !== localId && dominantSpeakerId !== this.state.lastDominantSpeakerId) {
            newDominantId = dominantSpeakerId;
        } else if (nonModeratorIds.length > 0) {
            // If no dominant speaker, use the first non-moderator
            newDominantId = nonModeratorIds[0];
        }

        // Set random speaker to a different person than dominant speaker
        if (nonModeratorIds.length > 1) {
            const availableSpeakers = nonModeratorIds.filter(id => id !== newDominantId);
            if (availableSpeakers.length > 0 && newRandomId !== this.state.lastRandomSpeakerId) {
                // Pick a random participant from available ones
                const randomIndex = Math.floor(Math.random() * availableSpeakers.length);
                newRandomId = availableSpeakers[randomIndex];
            }
        }

        // If we still don't have a random speaker but need one
        if (!newRandomId && nonModeratorIds.length === 1 && newDominantId) {
            // In case we only have one non-moderator participant, use them for both (better than empty)
            newRandomId = newDominantId;
        }

        this.setState({
            lastRandomSpeakerId: this.state.randomSpeakerId,
            lastDominantSpeakerId: dominantSpeakerId,
            dominantSpeakerId: newDominantId,
            randomSpeakerId: newRandomId
        });
    };

    updateVideoTracks = () => {
        const isLocalModerator = this.props._localParticipant?.role === "moderator";
        const moderator = this.getModeratorParticipant();

        // Attach moderator video
        if (moderator) {
            if (moderator.local) {
                const tracks = this.props._state["features/base/tracks"];
                const localVideoTrack = getLocalVideoTrack(tracks);
                const localJitsiTrack = localVideoTrack?.jitsiTrack;

                if (this.moderatorVideoRef.current && localJitsiTrack &&  !this.moderatorVideoRef.current.srcObject) {
                    localJitsiTrack.attach(this.moderatorVideoRef.current);
                    this.moderatorVideoRef.current.muted = true;
                    this.moderatorVideoRef.current.autoplay = true;
                }
            } else {
                if (this.moderatorVideoRef.current && !this.moderatorVideoRef.current.srcObject) {
                    this.attachTrackToVideoElement(moderator.id, this.moderatorVideoRef, "moderatorVideo");
                }
            }
        }

        // Attach local user video (only if not a moderator)
        if (!isLocalModerator && this.props._localParticipant) {
            const tracks = this.props._state["features/base/tracks"];
            const localVideoTrack = getLocalVideoTrack(tracks);
            const localJitsiTrack = localVideoTrack?.jitsiTrack;

            if (this.localVideoRef.current && localJitsiTrack && !this.localVideoRef.current.srcObject) {
                localJitsiTrack.attach(this.localVideoRef.current);
                this.localVideoRef.current.muted = true;
                this.localVideoRef.current.autoplay = true;
            }
        }

        // Attach dominant speaker video
        console.log(`${this.state.dominantSpeakerId}, ${this.state.lastDominantSpeakerId}`);
        if (this.state.dominantSpeakerId) {
            const success = this.attachTrackToVideoElement(
                this.state.dominantSpeakerId, 
                this.dominantSpeakerVideoRef, 
                "dominantSpeakerVideo"
            );
            if (!success) {
                console.log("Failed to attach dominant speaker video", this.state.dominantSpeakerId);
            }
        }
        
        // Attach random speaker video
        if (this.state.randomSpeakerId) {
            const success = this.attachTrackToVideoElement(
                this.state.randomSpeakerId, 
                this.randomSpeakerVideoRef, 
                "randomSpeakerVideo"
            );
            if (!success) {
                console.log("Failed to attach random speaker video", this.state.randomSpeakerId);
            }
        }

        this.hasUpdated = false;
    };

    attachTrackToVideoElement = (participantId: string | null | undefined, videoRef: React.RefObject<HTMLVideoElement>, elementId: string) => {
        if (!participantId || !videoRef.current) return false;


        const participant = getParticipantByIdOrUndefined(this.props._state, participantId);
        if (!participant) return false;

        const videoTrack = getVideoTrackByParticipant(this.props._state, participant);
        const jitsiVideoTrack = videoTrack?.jitsiTrack;

        if (jitsiVideoTrack && videoRef.current) {
            try {
                
                jitsiVideoTrack.attach(videoRef.current);
                videoRef.current.className = "";
                videoRef.current.id = elementId;
                videoRef.current.muted = true;
                videoRef.current.autoplay = true;
                return true;
            } catch (e) {
                console.error("Error attaching track:", e);
                return false;
            }
        }
        return false;
    };

    getBorderStyle = (participantId: string | null | undefined) => {
        if (!participantId) return {};
        let style = { border: "none", boxShadow: "none" };
        if (this.state.activeSpeakers.has(participantId)) {
            style = { border: "4px solid green", boxShadow: "0 0 10px green" };
        }
        if (this.state.raisedHands.has(participantId)) {
            style = { border: "4px solid yellow", boxShadow: "0 0 10px yellow" };
        }
        return style;
    };

    getParticipantDisplayName = (participantId: string | null | undefined) => {
        if (!participantId) return "Unknown";
        const participant = getParticipantByIdOrUndefined(this.props._state, participantId);
        return participant?.name || "Unknown";
    };

    getParticipantCount = () => {
        // Count local user + remote participants
        return 1 + this.props._remoteParticipants.length;
    };

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>) {
        const { dispatch } = this.props;
        
        console.log("Remote participants:", this.props._remoteParticipants);
        console.log("All tracks:", this.props._tracks);
        this.hasUpdated = true;

        if (JSON.stringify(prevProps._remoteParticipants) !== JSON.stringify(this.props._remoteParticipants)) {
            const { dispatch, _remoteParticipants } = this.props;
    
            // Make all remote participants visible to ensure their tracks are available
            dispatch(setVisibleRemoteParticipants(0, _remoteParticipants.length));
            
            this.updateDominantAndRandomSpeakers();
            this.updateVideoTracks();
        }
        if (prevState.dominantSpeakerId !== this.state.dominantSpeakerId || 
            prevState.randomSpeakerId !== this.state.randomSpeakerId) {
            this.updateVideoTracks();
        }
    };

    renderVideoContainer = (videoRef: React.RefObject<HTMLVideoElement>, participantId: string | null | undefined, label: string, isMuted: boolean = false) => {
        return (
            <div style={{ position: 'relative', marginBottom: '10px', padding: '20px' }} >
                <label style={{ color: "black", marginBottom: '5px', display: 'block', textAlign: 'center' }}>
                    {label} {participantId && this.state.activeSpeakers.has(participantId) ? "(말하는 중)" : ""}
                </label>
                <div style={{
                    ...this.getBorderStyle(participantId),
                    overflow: 'hidden',
                    borderRadius: '8px',
                    minHeight: '120px',
                    background: '#f0f0f0'
                }}>
                    {!isMuted ? (
                        <video
                            ref={videoRef}
                            style={{ width: "100%", height: "auto" }}
                        ></video>
                    ) : (
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/482/482432.png"
                            style={{ width: "100%", height: "auto" }}
                            alt="Video muted"
                        />
                    )}
                </div>
            </div>
        );
    };

    render() {
        const moderator = this.getModeratorParticipant();
        const isLocalModerator = this.props._localParticipant?.role === "moderator";
        const participantCount = this.getParticipantCount();
        const dominantSpeakerName = this.getParticipantDisplayName(this.state.dominantSpeakerId);
        const randomSpeakerName = this.getParticipantDisplayName(this.state.randomSpeakerId);
        return (
            <div>
                {/* Moderator Video */}
                {this.renderVideoContainer(
                    this.moderatorVideoRef,
                    moderator?.id,
                    "주최자"
                )}

                {/* Local User Video - Only show if not already shown as moderator */}
                {!isLocalModerator && this.renderVideoContainer(
                    this.localVideoRef,
                    this.props._localParticipant?.id,
                    "당신",
                    this.props._localVideoMuted
                )}

                {/* Dominant Speaker Video */}
                {this.state.dominantSpeakerId && this.renderVideoContainer(
                    this.dominantSpeakerVideoRef,
                    this.state.dominantSpeakerId,
                    `발표자: ${dominantSpeakerName}`
                )}

                {/* Random Speaker Video */}
                {this.props._localParticipant?.role === "moderator" && this.state.randomSpeakerId && participantCount >= 3 && this.renderVideoContainer(
                    this.randomSpeakerVideoRef,
                    this.state.randomSpeakerId,
                    `참가자: ${randomSpeakerName}`
                )}
            </div>
        );
    }
}

function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { remoteParticipants } = state["features/filmstrip"];
    const localParticipant = getParticipantByIdOrUndefined(state, undefined);
    const tracks = state["features/base/tracks"];
    const { dominantSpeaker } = state['features/base/participants']
    
    return {
        _remoteParticipants: remoteParticipants,
        _remoteParticipantsLength: remoteParticipants.length,
        _state: state,
        _localParticipant: localParticipant,
        _localVideoMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.VIDEO),
        _dominantSpeaker: dominantSpeaker,
        _tracks: tracks
    };
}

export default connect(_mapStateToProps)(KoreanWebCams);