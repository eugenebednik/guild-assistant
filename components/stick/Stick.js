const i18n = require('../../i18n.json');
const { Date } = require('sugar-date');
const moment = require('moment');

/**
 * Helpers
 */
const { replaceMentions } = require('../../resources/helpers/Helpers');

class Stick {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
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

        if ((!parts[0] || (parts[0] && parts[0].trim() === '')) || (!parts[1] || (parts[1] && parts[1].trim() === ''))) {
          message.reply(i18n.commands.stick.syntaxHelp);
          return;
        }

        const sanitizedTitle = replaceMentions(client, parts.shift(), message.guild);
        const sanitizedMessage = replaceMentions(client, parts.join(' '), message.guild);
        const base64EncodedMessage = Buffer.from(sanitizedMessage, 'utf8').toString('base64');
        const now = new moment(moment.now());
        const dateTime = now.format('YYYY-MM-DD HH:mm:ss');

        message.channel.send(
          this.getEmbed(message, sanitizedTitle, sanitizedMessage, message.author, new Date(dateTime).long()))
          .then(sent => {
            this.db.setChannelSticky(
              guildId,
              message.channel.id,
              sent.id,
              sanitizedTitle,
              base64EncodedMessage,
              message.author.id,
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

  sendAnyStickies(guildId, message, client) {
    this.db.getChannelSticky(guildId, message.channel.id, stickyMessage => {
      if (stickyMessage) {
        message.channel.fetchMessage(`${stickyMessage.message_snowflake}`).then(async targetMessage => {
          await targetMessage.delete();
          let originalAuthor = (await message.guild.fetchMember(stickyMessage.created_by_snowflake)).user;
          if (!originalAuthor) originalAuthor = client.user;
          const dateTime = new Date(stickyMessage.created_at, { fromUTC: true }).long();
          const text = Buffer.from(stickyMessage.message, 'base64').toString('utf8');
          message.channel
            .send(this.getEmbed(message, stickyMessage.title, text, originalAuthor, dateTime))
            .then(sentMsg => {
              this.db.updateChannelSticky(
                stickyMessage.id,
                guildId,
                message.channel.id,
                sentMsg.id,
                stickyMessage.title,
                stickyMessage.message);
            });
        }).catch(err => {
          console.log('ERROR:', err);
          this.db.deleteChannelSticky(guildId, message.channel.id, () => {
            // Do nothing.
          });
        });
      }
    });
  }

  getEmbed(message, sanitizedTitle, sanitizedMessage, originalAuthor, dateTime) {
    return {
      embed: {
        title: sanitizedTitle,
        color: 3447003,
        author: {
          name: originalAuthor.username,
          icon_url: originalAuthor.avatarURL,
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
