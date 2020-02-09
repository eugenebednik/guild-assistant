const XRegExp = require('xregexp');
const i18n = require('../../i18n.json');

class MoveMessage {
  handle(args, client, message) {
    if (!args.length || (args.length && args.length !== 2)) {
      message.reply(i18n.commands.movemessage.syntaxHelp);
      return;
    }

    if (/^[0-9]{1,18}$/.test(args[0])) {
      const targetChannelMatches = XRegExp.matchRecursive(args[1], '<#', '>', 'g');

      if (targetChannelMatches.length) {
        const targetChannel = client.channels.get(`${targetChannelMatches[0]}`);

        if (targetChannel) {
          const targetMessage = message.channel.messages.get(args[0]);
          if (targetMessage) {
            targetMessage.delete();
            targetChannel.send({
              embed: {
                color: 3447003,
                author: {
                  name: message.author.username,
                  icon_url: message.author.avatarURL,
                },
                description: targetMessage.content,
              },
            });
          }
          else {
            message.reply(i18n.commands.movemessage.invalidMessageId);
          }
        }
        else {
          message.reply(i18n.commands.movemessage.channelNotFound);
        }
      }
      else {
        message.reply(i18n.commands.movemessage.channelNotFound);
      }
    }
  }
}

module.exports = MoveMessage;
