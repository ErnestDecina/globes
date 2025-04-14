import clsx from 'clsx';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import DeviceStatus from '../../../../prejoin/components/web/preview/DeviceStatus';
import { isRoomNameEnabled } from '../../../../prejoin/functions.web';
import Toolbox from '../../../../toolbox/components/web/Toolbox';
import { isButtonEnabled } from '../../../../toolbox/functions.web';
import { getConferenceName } from '../../../conference/functions';
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from '../../../config/constants';
import { withPixelLineHeight } from '../../../styles/functions.web';
import Tooltip from '../../../tooltip/components/Tooltip';
import { isPreCallTestEnabled } from '../../functions';

import ConnectionStatus from './ConnectionStatus';
import Preview from './Preview';
import RecordingWarning from './RecordingWarning';
import UnsafeRoomWarning from './UnsafeRoomWarning';

import axios from 'axios';
import { IState } from '../../../../connection-indicator/components/AbstractConnectionIndicator';

interface IProps {

    /**
     * The list of toolbar buttons to render.
     */
    _buttons: Array<string>;

    /**
     * Determine if pre call test is enabled.
     */
    _isPreCallTestEnabled?: boolean;

    /**
     * The branding background of the premeeting screen(lobby/prejoin).
     */
    _premeetingBackground: string;

    /**
     * The name of the meeting that is about to be joined.
     */
    _roomName: string;

    _state: IState;

    /**
     * Children component(s) to be rendered on the screen.
     */
    children?: ReactNode;

    /**
     * Additional CSS class names to set on the icon container.
     */
    className?: string;

    /**
     * The name of the participant.
     */
    name?: string;

    /**
     * Indicates whether the copy url button should be shown.
     */
    showCopyUrlButton?: boolean;

    /**
     * Indicates whether the device status should be shown.
     */
    showDeviceStatus: boolean;

    /**
     * Indicates whether to display the recording warning.
     */
    showRecordingWarning?: boolean;

    /**
     * If should show unsafe room warning when joining.
     */
    showUnsafeRoomWarning?: boolean;

    /**
     * The 'Skip prejoin' button to be rendered (if any).
     */
    skipPrejoinButton?: ReactNode;

    /**
     * Whether it's used in the 3rdParty prejoin screen or not.
     */
    thirdParty?: boolean;

    /**
     * Title of the screen.
     */
    title?: string;

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean;

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            height: '100%',
            position: 'absolute',
            inset: '0 0 0 0',
            display: 'flex',
            backgroundColor: theme.palette.ui01,
            zIndex: 252,

            '@media (max-width: 720px)': {
                flexDirection: 'column-reverse'
            }
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
            boxSizing: 'border-box',
            margin: '0 48px',
            padding: '24px 0 16px',
            position: 'relative',
            width: '300px',
            height: '100%',
            zIndex: 252,

            '@media (max-width: 720px)': {
                height: 'auto',
                margin: '0 auto'
            },

            // mobile phone landscape
            '@media (max-width: 420px)': {
                padding: '16px 16px 0 16px',
                width: '100%'
            },

            '@media (max-width: 400px)': {
                padding: '16px'
            }
        },
        contentControls: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: 'auto',
            width: '100%'
        },
        title: {
            ...withPixelLineHeight(theme.typography.heading4),
            color: `${theme.palette.text01}!important`,
            marginBottom: theme.spacing(3),
            textAlign: 'center',

            '@media (max-width: 400px)': {
                display: 'none'
            }
        },
        roomNameContainer: {
            width: '100%',
            textAlign: 'center',
            marginBottom: theme.spacing(4)
        },

        roomName: {
            ...withPixelLineHeight(theme.typography.heading5),
            color: theme.palette.text01,
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
        }
    };
});

const PreMeetingScreen = ({
    _buttons,
    _isPreCallTestEnabled,
    _premeetingBackground,
    _roomName,
    children,
    className,
    showDeviceStatus,
    showRecordingWarning,
    showUnsafeRoomWarning,
    skipPrejoinButton,
    title,
    videoMuted,
    videoTrack,
    _state
}: IProps) => {
    const { classes } = useStyles();
    const style = _premeetingBackground ? {
        background: _premeetingBackground,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
    } : {};

    const roomNameRef = useRef<HTMLSpanElement | null>(null);
    const [ isOverflowing, setIsOverflowing ] = useState(false);
    const [ roomName, setRoomName ] = useState(_roomName);

    useEffect(() => {
        if (roomNameRef.current) {
            const element = roomNameRef.current;
            const elementStyles = window.getComputedStyle(element);
            const elementWidth = Math.floor(parseFloat(elementStyles.width));

            setIsOverflowing(element.scrollWidth > elementWidth + 1);
        }
    }, [ _roomName, roomName ]);

    useEffect(() => {
        const fetchData = async () => {
            const { locationURL = { href: '' } as URL } = _state['features/base/connection'];
            const url = locationURL.pathname.slice(1);  // Remove the leading slash to get the UUID or room identifier
        
            try {
                // Make the GET request to fetch meeting data using the extracted URL
                const response = await axios.get(`http://localhost:3000/api/v1/meetings/${url}`);
                const data = await response.data;
                setRoomName(data.meetingName);
    
            } catch (error) {
                // Handle any errors that might occur during the fetch operation
                console.error('There was an error with the fetch operation:', error);
            }
        }

        fetchData();
    }, [])

    return (
        <div className = { clsx('premeeting-screen', classes.container, className) }>
            <div style = { style }>
                <div className = { classes.content }>
                    {_isPreCallTestEnabled && <ConnectionStatus />}

                    <div className = { classes.contentControls }>
                        <h1 className = { classes.title }>
                            {title}
                        </h1>
                        {_roomName && (
                            <span className = { classes.roomNameContainer }>
                                {isOverflowing ? (
                                    <Tooltip content = { roomName }>
                                        <span
                                            className = { classes.roomName }
                                            ref = { roomNameRef }>
                                            {roomName}
                                        </span>
                                    </Tooltip>
                                ) : (
                                    <span
                                        className = { classes.roomName }
                                        ref = { roomNameRef }>
                                        {roomName}
                                    </span>
                                )}
                            </span>
                        )}
                        {children}
                        {_buttons.length && <Toolbox toolbarButtons = { _buttons } />}
                        {skipPrejoinButton}
                        {showUnsafeRoomWarning && <UnsafeRoomWarning />}
                        {showDeviceStatus && <DeviceStatus />}
                        {showRecordingWarning && <RecordingWarning />}
                    </div>
                </div>
            </div>
            <Preview
                videoMuted = { videoMuted }
                videoTrack = { videoTrack } />
        </div>
    );
};


/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const { hiddenPremeetingButtons } = state['features/base/config'];
    const { toolbarButtons } = state['features/toolbox'];
    const premeetingButtons = (ownProps.thirdParty
        ? THIRD_PARTY_PREJOIN_BUTTONS
        : PREMEETING_BUTTONS).filter((b: any) => !(hiddenPremeetingButtons || []).includes(b));

    const { premeetingBackground } = state['features/dynamic-branding'];
    
    return {
        _buttons: hiddenPremeetingButtons
            ? premeetingButtons
            : premeetingButtons.filter(b => isButtonEnabled(b, toolbarButtons)),
        _isPreCallTestEnabled: isPreCallTestEnabled(state),
        _premeetingBackground: premeetingBackground,
        _roomName: isRoomNameEnabled(state) ? getConferenceName(state) : '',
        _state: state
    };
}

export default connect(mapStateToProps)(PreMeetingScreen);

