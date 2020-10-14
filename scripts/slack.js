const { post } = require('./network');
const users = require('./users.json');

module.exports = {
    sendMessage: function (user, message) {
        const SLACKCHANNEL = users[user];
        if (SLACKCHANNEL) {
            return post(SLACKCHANNEL, {
                "text": message
            });
        } else {
            return Promise.resolve();
        }
    }
}