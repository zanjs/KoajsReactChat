const mongoose = require('mongoose');
const User = require('../model/user');
const Group = require('../model/group');
const GroupMessage = require('../model/groupMessage');
const isLogin = require('../police/isLogin');
const config = require('../../../config/config');
const imageUtil = require('../util/image');
const assert = require('../util/assert');
const messageFrequency = require('../util/messageFrequency');

const GroupMessageRoute = {
    'POST /groupMessage': function* (data) {
        yield* isLogin(this.socket, data, this.end);
        if (!messageFrequency(this.socket.user)) {
            return this.end(401, 'send messages too frequently');
        }
        assert(!data.type, this.end, 400, 'need type param but not exists');
        assert(!data.content, this.end, 400, 'need content param but not exists');
        assert(!data.linkmanId, this.end, 400, 'need linkmanId param but not exists');
        assert(!mongoose.Types.ObjectId.isValid(data.linkmanId), this.end, 400, 'linkmanId is invalid');

        const user = yield User.findById(this.socket.user);
        const group = yield Group.findById(data.linkmanId);

        if (data.type === 'text') {
            data.content = data.content.slice(0, config.maxMessageLength);
            data.content = data.content
                .replace(/&/g, '&amp')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/'/g, '&apos;');
        }
        else if (data.type === 'image') {
            // if data.content is image data
            if (/^data:image/.test(data.content)) {
                const fileName = `message_${Date.now().toString()}.${data.content.match(/data:image\/(.+);base64/)[1]}`;
                data.content = yield* imageUtil.saveImageData(fileName, data.content);
            }
        }

        const message = new GroupMessage({
            from: user,
            to: group,
            type: data.type,
            content: data.content,
        });

        let savedMessage = null;
        try {
            savedMessage = yield message.save();
            group.messages.push(savedMessage);
            yield group.save();
        }
        catch (err) {
            return this.end(500, 'server error when save new message');
        }

        yield GroupMessage.populate(savedMessage, { path: 'from', select: '_id username gender birthday avatar' });
        yield GroupMessage.populate(savedMessage, { path: 'to', select: '_id' });
        const sendMessage = {
            _id: savedMessage._id,
            content: savedMessage.content,
            type: savedMessage.type,
            from: savedMessage.from,
            to: savedMessage.to,
            createTime: savedMessage.createTime,
        };

        this.socket.to(group._id.toString()).emit('groupMessage', sendMessage);

        this.end(201, sendMessage);
    },

    'GET /groupMessage/history': function* (data) {
        assert(!data.groupId, this.end, 400, 'need groupId param but not exists');
        assert(!data.length, this.end, 400, 'need length param but not exists');

        const group = yield Group.findById(data.groupId);
        let skip = group.messages.length - data.length - 30;
        let limit = 30;
        if (skip < 0) {
            limit += skip;
            skip = 0;
        }
        const messages = limit > 0 ? yield GroupMessage.find({ to: data.groupId }, null, { skip, limit }).populate({ path: 'from', select: '_id username gender birthday avatar' }) : [];
        this.end(200, messages);
    },
};

module.exports = GroupMessageRoute;
