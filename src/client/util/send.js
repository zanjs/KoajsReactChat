import user from '../action/user';
import Store from '../store';
import ui from '../action/pc';

const filterReg = [
    /^\d+$/,
    /^hello\s*w/i,
    /^test/,
    /sdf|sfd|dsf|dfs|fsd|fds/,
    /abc/,
    /^\.+$/,
    /^ceshi/,
];

function send(linkmanType, linkmanId, messageType, messageContent) {
    const messageId = `self${Date.now()}`;
    user.addSelfMessage(linkmanType, linkmanId, messageType, messageContent, messageId);

    // If the user is created today, the message filtering rules apply
    const userCreateTime = new Date(Store.getState().getIn(['user', 'createTime']));
    const nowTime = new Date();
    if (
        userCreateTime.getFullYear() === nowTime.getFullYear() &&
        userCreateTime.getMonth() === nowTime.getMonth() &&
        userCreateTime.getDay() === nowTime.getDay()
    ) {
        for (const reg of filterReg) {
            if (reg.test(messageContent)) {
                return;
            }
        }
    }

    if (linkmanType === 'group') {
        return user.sendGroupMessage(linkmanId, messageType, messageContent).then(response => {
            if (response.status === 401 && response.data === 'send messages too frequently') {
                ui.openNotification('消息发送频率过快, 请稍候.');
            }
            return response;
        });
    }
    else {
        return user.sendMessage(linkmanId, messageType, messageContent).then(response => {
            if (response.status === 401 && response.data === 'send messages too frequently') {
                ui.openNotification('消息发送频率过快, 请稍候.');
            }
            return response;
        });
    }
}

export default send;
