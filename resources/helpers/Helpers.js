const XRegExp = require('xregexp');

function stripTags(message) {
    const matches = XRegExp.matchRecursive(message, '<', '>', 'g')

    if (!matches) return message;

    matches.forEach(tag => {
        message.replace(tag, '');
    });

    return message;
}

function replaceMentions(client, message) {
    const matches = XRegExp.matchRecursive(message, '<', '>', 'g')

    if (!matches) return message;

    matches.forEach(mention => {
        if (mention.startsWith('@')) {
            mention = mention.slice(1);

            if (mention.startsWith('!')) {
                mention = mention.slice(1);
            }

            const user = client.users.get(mention);

            if (message.includes(`<@!${mention}>`)) {
                message = message.replace(`<@!${mention}>`, `@${user.username}`);
            } else {
                message = message.replace(`<@${mention}>`, `@${user.username}`);
            }
        } else if (mention.startsWith('#')) {
            mention = mention.slice(1);

            const channel = client.channels.get(mention);

            message = message.replace(`<#${mention}>`, `#${channel.name}`);
        }
    });

    return message;
}

module.exports = {
    stripTags: stripTags,
    replaceMentions: replaceMentions,
};