const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const GroupSchema = new Schema({
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now },

    name: {
        type: String,
        trim: true,
        unique: true,
        match: /^[\-_0-9a-z\u4e00-\u9eff]{1,16}$/i,
    },
    avatar: {
        type: String,
        default: 'http://github.panli.com/img/favicon.png',
    },
    // 公告
    announcement: {
        type: String,
        default: '无公告',
    },
    announcementPublisher: {
        type: String,
        default: 'system',
    },
    announcementTime: {
        type: Date,
        default: Date.now,
    },

    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    messages: [
        {
            type: Schema.Types.ObjectId,
            ref: 'GroupMessage',
        },
    ],
});

const Group = mongoose.model('Group', GroupSchema);
module.exports = Group;
