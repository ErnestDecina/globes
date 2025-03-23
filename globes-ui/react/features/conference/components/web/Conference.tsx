import { throttle } from 'lodash-es';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect as reactReduxConnect } from 'react-redux';

// @ts-expect-error
import VideoLayout from '../../../../../modules/UI/videolayout/VideoLayout';
import { IReduxState, IStore } from '../../../app/types';
import { getConferenceNameForTitle } from '../../../base/conference/functions';
import { hangup } from '../../../base/connection/actions.web';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { setColorAlpha } from '../../../base/util/helpers';
import Chat from '../../../chat/components/web/Chat';
import MainFilmstrip from '../../../filmstrip/components/web/MainFilmstrip';
import ScreenshareFilmstrip from '../../../filmstrip/components/web/ScreenshareFilmstrip';
import StageFilmstrip from '../../../filmstrip/components/web/StageFilmstrip';
import CalleeInfoContainer from '../../../invite/components/callee-info/CalleeInfoContainer';
import LargeVideo from '../../../large-video/components/LargeVideo.web';
import LobbyScreen from '../../../lobby/components/web/LobbyScreen';
import { getIsLobbyVisible } from '../../../lobby/functions';
import { getOverlayToRender } from '../../../overlay/functions.web';
import ParticipantsPane from '../../../participants-pane/components/web/ParticipantsPane';
import Prejoin from '../../../prejoin/components/web/Prejoin';
import { isPrejoinPageVisible } from '../../../prejoin/functions';
import ReactionAnimations from '../../../reactions/components/web/ReactionsAnimations';
import { toggleToolboxVisible } from '../../../toolbox/actions.any';
import { fullScreenChanged, showToolbox } from '../../../toolbox/actions.web';
import JitsiPortal from '../../../toolbox/components/web/JitsiPortal';
import Toolbox from '../../../toolbox/components/web/Toolbox';
import { LAYOUT_CLASSNAMES } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.any';
import VisitorsQueue from '../../../visitors/components/web/VisitorsQueue';
import { showVisitorsQueue } from '../../../visitors/functions';
import { init } from '../../actions.web';
import { maybeShowSuboptimalExperienceNotification } from '../../functions.web';
import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import type { AbstractProps } from '../AbstractConference';

import ConferenceInfo from './ConferenceInfo';
import { default as Notice } from './Notice';
import DefaultConference from './en/DefaultConference';
import languageDetector from '../../../base/i18n/languageDetector.web';
import KoreanConference from './ko/KoreanConference';

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'fullscreenchange'
];

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

    // Display Layout
    _displayLayout: any;

    // Default UI
    _defaultUI: any;

    // Korea UI
    _koreanUI: any;

    dispatch: IStore['dispatch'];
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
class Conference extends AbstractConference<IProps, any> {
    _originalOnMouseMove: Function;
    _originalOnShowToolbar: Function;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        document.title = `${this.props._roomName} | ${interfaceConfig.APP_NAME}`;
    }

    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps: IProps) {
        if (this.props._shouldDisplayTileView
            === prevProps._shouldDisplayTileView) {
            return;
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.unbindEvents();
        APP.conference.isJoined() && this.props.dispatch(hangup());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const language = languageDetector.detect();
        let layout = <DefaultConference/>;

        if(language === "ko") {
            layout = <KoreanConference/>;
        }

        return layout;
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
    const { backgroundAlpha, mouseMoveCallbackInterval } = state['features/base/config'];
    const { overflowDrawer } = state['features/toolbox'];

    return {
        ...abstractMapStateToProps(state),
        _backgroundAlpha: backgroundAlpha,
        _isAnyOverlayVisible: Boolean(getOverlayToRender(state)),
        _layoutClassName: LAYOUT_CLASSNAMES[getCurrentLayout(state) ?? ''],
        _mouseMoveCallbackInterval: mouseMoveCallbackInterval,
        _overflowDrawer: overflowDrawer,
        _roomName: getConferenceNameForTitle(state),
        _showLobby: getIsLobbyVisible(state),
        _showPrejoin: isPrejoinPageVisible(state),
        _showVisitorsQueue: showVisitorsQueue(state)
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
