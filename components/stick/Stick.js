const i18n = require('../../i18n.json');
const moment = require('moment');

/**
 * Helpers
 */
const { replaceMentions } = require('../../resources/helpers/Helpers');

class Stick {
  constructor(db) {
    this.db = db;
  }

  stick(guildId, args, message, client) {
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      message.reply(i18n.general.accessDenied);
      return;
    }

    if (!args.length || (args.length === 1 && args[0].toLowerCase() === 'help')) {
      message.reply(i18n.commands.stick.syntaxHelp);
      return;
    }

    this.db.getChannelSticky(guildId, message.channel.id, result => {
      if (!result) {
        const parts = args.join(' ').split('|');
        parts.forEach(part => {
          part.trim();
        });

        if ((!parts[0] || (parts[0] && parts[0] === '')) || (!parts[1] || (parts[0] && parts[0] === ''))) {
          message.reply(i18n.commands.stick.syntaxHelp);
          return;
        }

        const sanitizedTitle = replaceMentions(client, parts[0], message.guild);
        const sanitizedMessage = replaceMentions(client, parts[1], message.guild);

        message.channel.send(this.getEmbed(message, sanitizedTitle, sanitizedMessage)).then(sent => {
          this.db.setChannelSticky(
            guildId,
            message.channel.id,
            sent.id,
            sanitizedTitle,
            sanitizedMessage,
            setResult => {
              if (setResult) {
                message.reply(i18n.commands.stick.success);
              }
            });
        });
      }
      else {
        message.reply(i18n.commands.stick.alreadyExists);
      }
    });
  }

  unstick(guildId, message) {
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      message.reply(i18n.general.accessDenied);
      return;
    }

    this.db.getChannelSticky(guildId, message.channel.id, result => {
      if (result) {
        this.db.deleteChannelSticky(guildId, message.channel.id, () => message.reply(i18n.commands.unstick.deleted));
      }
      else {
        message.reply(i18n.commands.unstick.noMessageExists);
      }
    });
  }

  sendAnyStickies(guildId, message) {
    this.db.getChannelSticky(guildId, message.channel.id, stickyMessage => {
      if (stickyMessage) {
        message.channel.fetchMessage(`${stickyMessage.message_snowflake}`).then(async targetMessage => {
          await targetMessage.delete();
          const dateTime = new moment(stickyMessage.created_at).format('dddd, MMMM Do YYYY, HH:mm:ss');
          message.channel
            .send(this.getEmbed(message, stickyMessage.title, stickyMessage.message, dateTime))
            .then(sentMsg => {
              this.db.updateChannelSticky(
                stickyMessage.id,
                guildId,
                message.channel.id,
                sentMsg.id,
                stickyMessage.title,
                stickyMessage.message);
            });
        });
      }
    });
  }

  getEmbed(message, sanitizedTitle, sanitizedMessage, dateTime) {
    return {
      embed: {
        title: sanitizedTitle,
        color: 3447003,
        author: {
          name: message.author.username,
          icon_url: message.author.avatarURL,
        },

        description: sanitizedMessage,

        footer: {
          text: `${i18n.commands.stick.createdAtLabel} ${dateTime}`,
        },
      },
    };
  }
}

module.exports = Stick;
