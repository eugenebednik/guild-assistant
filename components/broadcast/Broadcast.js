const i18n = require('../../i18n.json');
const moment = require('moment');

/**
 * Helpers
 */
const { replaceMentions } = require('../../resources/helpers/Helpers');

class Broadcast {
  constructor(db) {
    this.db = db;
  }

  handle(guildId, args, message, client) {
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      message.reply(i18n.general.accessDenied);
      return;
    }

    if (!args.length) {
      message.reply(i18n.commands.broadcast.syntaxHelp);
      return;
    }

    if (args.length) {
      switch (args[0]) {
      case 'help':
        message.reply(i18n.commands.broadcast.syntaxHelp);
        return;
      case 'remove-channel':
        this.db.deleteBroadcastChannel(
          guildId,
          message.channel.id,
          () => message.reply(i18n.commands.broadcast.removeChannel.success));
        break;
      case 'add-channel':
        this.db.setBroadcastChannel(guildId, message.channel.id, result => {
          if (result) {
            message.reply(i18n.commands.broadcast.addChannel.success);
          }
          else {
            message.reply(i18n.commands.broadcast.addChannel.failure);
          }
        });
        break;
      case 'remove-all-channels':
        this.db.deleteAllBroadcastChannels(
          guildId,
          () => message.reply(i18n.commands.broadcast.removeAllChannels.success));
        break;
      default:
        this.db.getBroadcastChannels(guildId, result => {
          if (result) {
            result.forEach(channelSnowflake => {
              const bcChannel = message.guild.channels.find(channel => channel.id === channelSnowflake.snowflake);
              const sanitizedMessage = replaceMentions(client, args.join(' '), message.guild);
              const now = new moment(moment.now());
              const dateTime = now.format('dddd, MMMM Do YYYY, HH:mm:ss');

              bcChannel.send({
                embed: {
                  title: i18n.commands.broadcast.title,
                  color: 3447003,
                  author: {
                    name: message.author.username,
                    icon_url: message.author.avatarURL,
                  },

                  description: sanitizedMessage,

                  footer: {
                    text: `${i18n.commands.broadcast.broadcastOnLabel} ${dateTime}`,
                  },
                },
              });
              message.reply(i18n.commands.broadcast.sendSuccess);
            });
          }
          else {
            message.reply(i18n.commands.broadcast.noChannelsSet);
          }
        });

        return;
      }
    }
  }
}

module.exports = Broadcast;
