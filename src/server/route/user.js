const assert = require('../util/assert');
const promise = require('bluebird');
const bcrypt = promise.promisifyAll(require('bcrypt'), { suffix: '$' });
const User = require('../model/user');
const Group = require('../model/group');
const mongoose = require('mongoose');
const isLogin = require('../police/isLogin');
const imageUril = require('../util/image');

// bcrypt salt length
const saltRounds = 10;
const avatarColors = ['aquamarine', 'blueviolet', 'chocolate', 'darkcyan', 'darkgrey', 'darkmagenta', 'darkorange', 'darkseagreen', 'darkslategrey',
                    'deeppink', 'deepskyblue', 'dimgrey', 'forestgreen', 'indigo'];

const UserRoute = {
    'POST /user': function* (data) {
        assert(!data.username, this.end, 400, 'need username param but not exists');
        assert(!data.password, this.end, 400, 'need password param but not exists');

        const user = yield User.findOne({ username: data.username });
        assert(user, this.end, 400, 'username already exists');

        const defaultGroup = yield Group.findOne({ isDefault: true });

        const salt = yield bcrypt.genSalt$(saltRounds);
        const hash = yield bcrypt.hash$(data.password, salt);
        const newUser = new User({
            username: data.username,
            salt,
            password: hash,
            avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
            groups: [defaultGroup],
        });

        let savedUser = null;
        try {
            savedUser = yield newUser.save();
            defaultGroup.members.push(newUser);
            yield defaultGroup.save();
        }
        catch (err) {
            if (err.message === 'User validation failed') {
                return this.end(400, 'username invalid');
            }
            return this.end(500, 'server error when save new user');
        }
        this.end(201, savedUser);
    },
    'GET /user': function* (data) {
        assert(!mongoose.Types.ObjectId.isValid(data.id), this.end, 400, `id:'${data.id}' is invalid`);

        const user = yield User.findById(data.id, '-password -salt');
        if (user) {
            this.end(200, user);
        }
        else {
            this.end(404, 'user not exists');
        }
    },
    'GET /user/me': function* (data) {
        yield* isLogin(this.socket, data, this.end);
        const user = yield User.findById(this.socket.user, '-password -salt');
        this.end(200, user);
    },
    'POST /user/friend': function* (data) {
        yield* isLogin(this.socket, data, this.end);
        assert(!mongoose.Types.ObjectId.isValid(data.userId), this.end, 400, `userId:'${data.userId}' is invalid`);

        const me = yield User.findById(this.socket.user);
        if (me.friends.indexOf(data.userId) !== -1) {
            this.end(204);
        }

        const user = yield User.findById(data.userId);
        assert(!user, this.end, 400, `user:'${data.userId}' not exists`);

        me.friends.push(user._id);
        yield me.save();
        this.end(204);
    },
    'DELETE /user/friend': function* (data) {
        yield* isLogin(this.socket, data, this.end);
        assert(!mongoose.Types.ObjectId.isValid(data.userId), this.end, 400, `userId:'${data.userId}' is invalid`);

        const me = yield User.findById(this.socket.user);
        const index = me.friends.indexOf(data.userId);
        if (index === -1) {
            this.end(204);
        }

        const user = yield User.findById(data.userId);
        assert(!user, this.end, 400, `user:'${data.userId}' not exists`);

        me.friends.splice(index, 1);
        yield me.save();
        this.end(204);
    },

    'GET /user/avatar': function* (data) {
        assert(!data.username, this.end, 400, 'need username param but not exists');

        const user = yield User.findOne({ username: data.username });
        if (user) {
            return this.end(200, { username: user.username, avatar: user.avatar });
        }
        else {
            return this.end(200, { avatar: '' });
        }
    },

    'PUT /user/avatar': function* (data) {
        yield* isLogin(this.socket, data, this.end);
        assert(!data.avatar, this.end, 400, 'need avatar param but not exists');

        const user = yield User.findById(this.socket.user, '-password -salt');
        const fileName = `user_${user._id}_${Date.now().toString()}.${data.avatar.match(/data:image\/(.+);base64/)[1]}`;
        user.avatar = yield* imageUril.saveImageData(fileName, data.avatar);
        yield user.save();

        return this.end(200, user);
    },

    'POST /user/expression': function* (data) {
        yield* isLogin(this.socket, data, this.end);
        assert(!data.src, this.end, 400, 'need src param but not exists');

        const user = yield User.findById(this.socket.user, '-password -salt');
        if (user.expressions.indexOf(data.src) === -1) {
            user.expressions.push(data.src);
            yield user.save();
        }

        return this.end(201, user.expressions);
    },

    'DELETE /user/expression': function* (data) {
        yield* isLogin(this.socket, data, this.end);
        assert(!data.src, this.end, 400, 'need src param but not exists');

        const user = yield User.findById(this.socket.user, '-password -salt');
        const index = user.expressions.indexOf(data.src);
        if (index !== -1) {
            user.expressions.splice(index, 1);
            yield user.save();
        }

        return this.end(200, user.expressions);
    },
};

module.exports = UserRoute;
