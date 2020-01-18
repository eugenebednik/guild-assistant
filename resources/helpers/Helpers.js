const XRegExp = require('xregexp');
const i18n = require('../../i18n.json');

function replaceMentions(client, message, guild) {
    const matches = XRegExp.matchRecursive(message, '<', '>', 'g')

    if (!matches) return message;

    matches.forEach(mention => {
        if (mention.startsWith('@')) {
            mention = mention.slice(1);

            if (mention.startsWith('!') || mention.startsWith('&')) {
                mention = mention.slice(1);
            }

            if (message.includes(`<@!${mention}>`)) {
                const user = client.users.get(mention);
                message = message.replace(`<@!${mention}>`, `@${user.username}`);
            } else if (message.includes(`<@&${mention}>`)) {
                const role = guild.roles.get(mention);
                message = message.replace(`<@&${mention}>`, `@${role.name}`);
            }
        } else if (mention.startsWith('#')) {
            mention = mention.slice(1);
            const channel = client.channels.get(mention);
            message = message.replace(`<#${mention}>`, `#${channel.name}`);
        }
    });

    return message;
}

function moveMessage(args, client, message) {
    let targetChannelMatches = XRegExp.matchRecursive(args[1], '<#', '>', 'g');

    if (targetChannelMatches.length) {
        let targetChannel = client.channels.get(`${targetChannelMatches[0]}`);

        if (targetChannel) {
            message.channel.fetchMessage(args[0]).then(async targetMessage => {
                await targetChannel.send(targetMessage.content);
                if (targetMessage) targetMessage.delete();
            });
        } else {
            message.reply(i18n.commands.msgmove.channelNotFound);
        }
    } else {
        message.reply(i18n.commands.msgmove.channelNotFound);
    }
}

function getEmoji(string) {
    console.log(string);
    const result = XRegExp.matchRecursive(string, '<:name:', '>', 'g');
    console.log(result);

    if (result.length) {
        return result;
    } else {
        return;
    }
}

module.exports = {
    replaceMentions: replaceMentions,
    moveMessage: moveMessage,
    getEmoji: getEmoji,
};