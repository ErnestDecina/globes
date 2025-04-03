import React, { Component, createRef, RefObject, useRef } from "react";
import { IReduxState } from "../../../../app/types";
import { connect } from "react-redux";
import { getDominantSpeakerParticipant, getParticipantByIdOrUndefined } from "../../../../base/participants/functions";
import {
    getLocalAudioTrack,
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant,
    getVideoTrackByParticipant,
} from "../../../../base/tracks/functions.web";
import { MEDIA_TYPE } from "../../../../base/media/constants";
import VideoTrack from "../../../../base/media/components/web/VideoTrack";
import Video from "../../../../base/media/components/web/Video";
import { IParticipant } from "../../../../base/participants/types";

interface IProps {
    /**
     * The participants in the call.
     */
    _remoteParticipants: Array<string>;

    /**
     * The length of the remote participants array.
     */
    _remoteParticipantsLength: number;

    _state: IReduxState;

    _localParticipant: IParticipant | undefined;
    _moderatorVideoStream: any;
}

export interface IState {
    /**
     * Indicates that the canplay event has been received.
     */
    canPlayEventReceived: boolean;

    /**
     * The current display mode of the thumbnail.
     */
    displayMode: number;

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: boolean;

    /**
     * Whether popover is visible or not.
     */
    popoverVisible: boolean;

    currentDomininantSpeaker: IParticipant;
}

class KoreanWebCams extends Component<IProps, IState> {
    public moderatorVideoRef = React.createRef<HTMLVideoElement>();
    public localVideoRef = React.createRef<HTMLVideoElement>();
    public domininatSpeaker1VideoRef = React.createRef<HTMLVideoElement>();
    public domininatSpeaker2VideoRef = React.createRef<HTMLVideoElement>();
    public currentDominantSpeaker: IParticipant | undefined;
    public previousDominantSpeaker: IParticipant | undefined;

    constructor(props: IProps) {
        super(props);
    }

    componentDidMount() {}

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>, snapshot?: any): void {
        const tracks = this.props._state["features/base/tracks"];
        const isLocal = this.props._localParticipant?.local ?? true;
        const _videoTrack = getLocalVideoTrack(tracks);

        // Check if init
        if (!_videoTrack?.jitsiTrack) {
            return;
        }




        // Mod & Local webcam
        // Check if Mod Camera needs update
        if (prevProps._moderatorVideoStream) {
            return;
        }
        const localJitsiVideoTrack = _videoTrack?.jitsiTrack;
        const videoTrackId = localJitsiVideoTrack?.getId();



        // Only Local webcam
        if (this.localVideoRef.current) {
            localJitsiVideoTrack.attach(this.localVideoRef.current);
            this.localVideoRef.current.className = isLocal ? "flipVideoX" : "";
            this.localVideoRef.current.id = isLocal ? "localVideo_container" : `remoteVideo_${videoTrackId || ""}`;
            this.localVideoRef.current.muted = true;
            this.localVideoRef.current.autoplay = true;
        }

        // Dominant Speaker Camera
        if(this.domininatSpeaker1VideoRef.current) {
            this.previousDominantSpeaker = this.currentDominantSpeaker;
            const newDomininantSpeaker = getDominantSpeakerParticipant(this.props._state);

            if(this.previousDominantSpeaker?.id !==  newDomininantSpeaker?.id) {
                this.currentDominantSpeaker = newDomininantSpeaker;
            


                // If mod set only 2 domSpeaker
                if(this.props._localParticipant?.role === "moderator") {
                    // Set New Domininant to domSpeaker 1
                    const participant = getParticipantByIdOrUndefined(this.props._state, newDomininantSpeaker?.id);
        
                    const id = participant?.id ?? "";
                    const isLocal = participant?.local ?? true;
                    const tracks = this.props._state["features/base/tracks"];
                    const _videoTrack = getVideoTrackByParticipant(this.props._state, participant);
                    const _audioTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);

                    if(!_videoTrack?.jitsiTrack) {
                        return;
                    }
                        

                    const jitsiVideoTrack = _videoTrack?.jitsiTrack;
                    const videoTrackId = jitsiVideoTrack?.getId();


                    if (this.domininatSpeaker1VideoRef.current) {
                        jitsiVideoTrack.attach(this.domininatSpeaker1VideoRef.current);
                        this.domininatSpeaker1VideoRef.current.className = "";
                        this.domininatSpeaker1VideoRef.current.id = `remoteVideo_${videoTrackId || ""}`;
                        this.domininatSpeaker1VideoRef.current.muted = true;
                        this.domininatSpeaker1VideoRef.current.autoplay = true;
                    }
                

                    // Set Previous Domininant to domSpeaker 2
                    // Set New Domininant to domSpeaker 1
                    const participant2 = getParticipantByIdOrUndefined(this.props._state, newDomininantSpeaker?.id);
        
                    const id2 = participant?.id ?? "";
                    const _videoTrack2 = getVideoTrackByParticipant(this.props._state, participant2);
                    const _audioTrack2 = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id2);
        
                    if(!_videoTrack2?.jitsiTrack) {
                        return;
                    }
                        

                    const jitsiVideoTrack2 = _videoTrack2?.jitsiTrack;
                    const videoTrackId2 = jitsiVideoTrack2?.getId();


                    if (this.domininatSpeaker2VideoRef.current) {
                        jitsiVideoTrack2.attach(this.domininatSpeaker2VideoRef.current);
                        this.domininatSpeaker2VideoRef.current.className = "";
                        this.domininatSpeaker2VideoRef.current.id = `remoteVideo_${videoTrackId2 || ""}`;
                        this.domininatSpeaker2VideoRef.current.muted = true;
                        this.domininatSpeaker2VideoRef.current.autoplay = true;
                    }
                }
                // else set 1 domSpeaker
                else {
                    // Set New Domininant to domSpeaker 1
                    const participant = getParticipantByIdOrUndefined(this.props._state, newDomininantSpeaker?.id);
        
                    const id = participant?.id ?? "";
                    const isLocal = participant?.local ?? true;
                    const tracks = this.props._state["features/base/tracks"];
                    const _videoTrack = getVideoTrackByParticipant(this.props._state, participant);
                    const _audioTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
        
                    if(!_videoTrack?.jitsiTrack) {
                        return;
                    }
                        

                    const jitsiVideoTrack = _videoTrack?.jitsiTrack;
                    const videoTrackId = jitsiVideoTrack?.getId();


                    if (this.domininatSpeaker1VideoRef.current) {
                        jitsiVideoTrack.attach(this.domininatSpeaker1VideoRef.current);
                        this.domininatSpeaker1VideoRef.current.className = "";
                        this.domininatSpeaker1VideoRef.current.id = `remoteVideo_${videoTrackId || ""}`;
                        this.domininatSpeaker1VideoRef.current.muted = true;
                        this.domininatSpeaker1VideoRef.current.autoplay = true;
                    }
                }

            }
        }





        // Mod webcam
        if (this.moderatorVideoRef.current) {
            // Local is Mod
            if(this.props._localParticipant?.role === "moderator") {
                localJitsiVideoTrack.attach(this.moderatorVideoRef.current);
                this.moderatorVideoRef.current.className = isLocal ? "flipVideoX" : "";
                this.moderatorVideoRef.current.id = isLocal ? "localVideo_container" : `remoteVideo_${videoTrackId || ""}`;
                this.moderatorVideoRef.current.muted = true;
                this.moderatorVideoRef.current.autoplay = true;
                
            }

            // Remote is Mod
            else {
                this.props._remoteParticipants.forEach((participantString) => {
                    const participant = getParticipantByIdOrUndefined(this.props._state, participantString);
        
                    if(participant?.role === "moderator") {
                        const id = participant?.id ?? "";
                        const isLocal = participant?.local ?? true;
                        const tracks = this.props._state["features/base/tracks"];
                        const _videoTrack = getVideoTrackByParticipant(this.props._state, participant);
                        const _audioTrack = isLocal
                            ? getLocalAudioTrack(tracks)
                            : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
            
                        if(!_videoTrack?.jitsiTrack) {
                            return;
                        }
                            

                        const jitsiVideoTrack = _videoTrack?.jitsiTrack;
                        const videoTrackId = jitsiVideoTrack?.getId();


                        if (this.moderatorVideoRef.current) {
                            jitsiVideoTrack.attach(this.moderatorVideoRef.current);
                            this.moderatorVideoRef.current.className = "";
                            this.moderatorVideoRef.current.id = `remoteVideo_${videoTrackId || ""}`;
                            this.moderatorVideoRef.current.muted = true;
                            this.moderatorVideoRef.current.autoplay = true;
                        }
                    }
                });
            }
        }


    }

    render() {
        const modAndLocal =
            <div>
                {/* Moderator WebCam */}
                <div>
                    <label
                        style={{
                            color: "black",
                        }}
                    >
                        주최자
                    </label>
                    <video
                        ref={this.moderatorVideoRef}
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                    ></video>
                </div>

                {/* Domininat Speaker 1 WebCam */}
                <div>
                    <label
                        style={{
                            color: "black",
                        }}
                    >
                        주최자
                    </label>
                    <video
                        ref={this.domininatSpeaker1VideoRef}
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                    ></video>
                </div>

                {/* Domininat Speaker 2 WebCam */}
                <div>
                    <label
                        style={{
                            color: "black",
                        }}
                    >
                        주최자
                    </label>
                    <video
                        ref={this.domininatSpeaker2VideoRef}
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                    ></video>
                </div>
            </div>;

        const justLocal = 
            <div>
                {/* Moderator WebCam */}
                <div>
                    <label
                        style={{
                            color: "black",
                        }}
                    >
                        주최자
                    </label>
                    <video
                        ref={this.moderatorVideoRef}
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                    ></video>
                </div>

                {/* Local WebCam */}
                <div>
                    <label
                        style={{
                            color: "black",
                        }}
                    >
                        당신
                    </label>
                    <video
                        ref={this.localVideoRef}
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                    ></video>
                </div>

                {/* Domininat Speaker 1 WebCam */}
                <div>
                    <label
                        style={{
                            color: "black",
                        }}
                    >
                        현재 발표자
                    </label>
                    <video
                        ref={this.domininatSpeaker1VideoRef}
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                    ></video>
                </div>
            </div>;

        const display = (this.props._localParticipant?.role === "moderator") ? modAndLocal : justLocal; 

        return (
            display
        );
    }
}

function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { remoteParticipants } = state["features/filmstrip"];
    const localParticipant = getParticipantByIdOrUndefined(state, undefined);

    return {
        _remoteParticipants: remoteParticipants,
        _state: state,
        _localParticipant: localParticipant,
    };
}

export default connect(_mapStateToProps)(KoreanWebCams);
