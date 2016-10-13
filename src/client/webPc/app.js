import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import './app.scss';

import user from '../action/user';
import ui from '../action/pc';
import socket from '../socket';
import api, { publicApi } from '../api';

import Notification from '../common/notification';
import MaskLayout from '../common/maskLayout';
import ImageViewer from '../common/imageViewer';

window.KoajsReactChat = publicApi;

class App extends React.Component {
    static propTypes = {
        state: PropTypes.object.isRequired,
        children: PropTypes.element,
        location: PropTypes.object.isRequired,
        windowFocus: PropTypes.bool,
        desktopNotification: PropTypes.bool,
        soundNotification: PropTypes.bool,
    };

    static contextTypes = {
        router: React.PropTypes.object.isRequired,
    }

    constructor(props, context) {
        super(props, context);
        api.init(this);
    }

    componentWillMount() {
        // force to root path
        this.context.router.push('/');

        // try auto login
        const token = window.localStorage.getItem('token');
        if (token && token !== '') {
            user
            .reConnect(token)
            .then(result => {
                if (result.status === 201) {
                    user.online();
                    if (this.props.location.pathname === '/') {
                        this.context.router.push('/main');
                    }
                }
            });
        }

        // register server event
        socket.on('groupMessage', data => {
            api.emit('rawMessage', data);
            user.addGroupMessage(data);

            if (this.props.soundNotification) {
                this.sound.play();
            }

            if (!api.getVirtualMessageName(data.content) && window.Notification && window.Notification.permission === 'granted' && !this.props.windowFocus && this.props.desktopNotification) {
                const notification = new window.Notification(
                    `${data.from.username} - 发来消息:`,
                    {
                        icon: data.from.avatar,
                        body: data.type === 'text' ? data.content : `[${data.type}]`,
                        tag: data.from.id,
                    }
                );
                notification.onclick = function () {
                    window.blur();
                    window.focus();
                    this.close();
                };
                // auto close
                setTimeout(notification.close.bind(notification), 3000);
            }
        });

        socket.on('message', data => {
            api.emit('rawMessage', data);
            user.addMessage(data);

            if (this.props.soundNotification) {
                this.sound.play();
            }

            if (!api.getVirtualMessageName(data.content) && window.Notification && window.Notification.permission === 'granted' && !this.props.windowFocus && this.props.desktopNotification) {
                const notification = new window.Notification(
                    `${data.from.username} - 发来消息:`,
                    {
                        icon: data.from.avatar,
                        body: data.type === 'text' ? data.content : `[${data.type}]`,
                        tag: data.from.id,
                    }
                );
                notification.onclick = function () {
                    this.close();
                    window.blur();
                    setTimeout(() => {
                        window.focus();
                    }, 0);
                };
                // auto close
                setTimeout(notification.close.bind(notification), 3000);
            }
        });

        socket.on('disconnect', () => {
            user.offline();
        });
        socket.on('reconnect', () => {
            user
            .reConnect()
            .then(result => {
                if (result.status === 201) {
                    user.online();
                }
            });
        });

        // html5 notification
        if (window.Notification && (window.Notification.permission === 'default' || window.Notification.permission === 'denied')) {
            window.Notification.requestPermission();
        }
    }

    componentDidMount() {
        window.onfocus = () => ui.windowFocus(true);
        window.onblur = () => ui.windowFocus(false);
    }

    render() {
        // for debug
        // console.log(this.props.state.toJS());
        const width = window.screen.width;
        const height = window.screen.height;

        return (
            <div className="window">
                <div
                    className="background"
                    style={{ backgroundSize: `${width}px ${height - 50}px` }}
                >
                    {
                    /^\/main/.test(this.props.location.pathname) ?
                        <div style={{ backgroundSize: `${width}px ${height - 50}px` }} />
                    :
                        null
                }
                </div>
                <Notification />
                <MaskLayout />
                <ImageViewer />
                <audio
                    ref={sound => this.sound = sound}
                >
                    <source src="http://assets.suisuijiang.com/message_sound.mp3" type="audio/mp3" />
                    <source src="http://assets.suisuijiang.com/message_sound.ogg" type="audio/ogg" />
                    <source src="http://assets.suisuijiang.com/message_sound.wav" type="audio/wav" />
                </audio>
                { this.props.children }
            </div>
        );
    }
}

export default connect(
    state => ({
        state: state,
        windowFocus: state.getIn(['pc', 'windowFocus']),
        desktopNotification: state.getIn(['pc', 'desktopNotification']),
        soundNotification: state.getIn(['pc', 'soundNotification']),
    })
)(App);
