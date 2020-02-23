const i18n = require('../../i18n.json');
const { getWorldTimeZoneData } = require('../../resources/helpers/Helpers');

class Servertime {
  constructor(logger, db, timezoneApiUrl) {
    this.logger = logger;
    this.db = db;
    this.timeZoneApiUrl = timezoneApiUrl;
  }

  handle(guildId, message, args) {
    let subCommand;
    let param;

    if (args.length) {
      subCommand = args.shift().toLowerCase();
    }

    if (subCommand) {
      let offsetTz = 'GMT';

      switch (subCommand) {
      case 'help':
        message.reply(i18n.commands.servertime.syntaxHelp);
        return;
      case 'offset':
        if (!message.member.hasPermission('ADMINISTRATOR')) {
          message.reply(i18n.general.accessDenied);
          return;
        }

        if (!args.length) {
          message.reply(i18n.commands.servertime.incorrectOffset);
          return;
        }

        param = args[0].toLowerCase();

        if (param !== 'gmt') {
          const match = param.match(/[-+]\d{1,2}/);

          if (match) {
            const sign = match[0].substr(0, 1);
            const number = match[0].substr(1, match[0].length);

            if (sign === '+' && (number < 1 || number > 14)) {
              message.reply(i18n.commands.servertime.incorrectOffset);
              return;
            }

            if (sign === '-' && (number < 1 || number > 9)) {
              message.reply(i18n.commands.servertime.incorrectOffset);
              return;
            }

            offsetTz += sign + number;
          }
          else {
            message.reply(i18n.commands.servertime.incorrectOffset);
            return;
          }
        }

        this.db.setServerTimezone(guildId, offsetTz.toUpperCase(), result => {
          if (result) {
            message.reply(i18n.commands.servertime.offsetSetSuccess + `\`${offsetTz}\``);
          }
          else {
            message.reply(i18n.commands.servertime.offsetSetFailure);
          }
        });
        break;
      default:
        message.reply(i18n.commands.servertime.syntaxHelp);
        return;
      }
    }

    this.db.getServerTimezone(guildId, result => {
      if (!result) {
        message.reply(i18n.commands.servertime.firstRunHelp);
        return;
      }

      getWorldTimeZoneData(this.timeZoneApiUrl, result, dateTime => {
        message.channel.send({
          embed: {
            color: 3447003,
            author: {
              name: message.author.username,
              icon_url: message.author.avatarURL,
            },
            description: `${i18n.commands.servertime.serverTime}: ${dateTime}`,

            footer: {
              text: `${i18n.commands.servertime.serverTime}: ${result}`,
            },
          },
        });
      });
    });
  }
}

module.exports = Servertime;
