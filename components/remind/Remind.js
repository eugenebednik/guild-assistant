const { Date } = require('sugar-date');
const moment = require('moment');
const i18n = require('../../i18n.json');

class Remind {
  constructor(db) {
    this.db = db;
  }

  remind(guildId, args, message) {
    const targets = [];
    let payload;
    let subCommand;
    let parts;
    let joinedMessage;
    let date;
    let momentConverted;
    let dateTime;
    let recurring;
    let recurringInterval;
    let recurringIntervalString;
    let isRecurring = false;

    if (args.length) {
      subCommand = args.shift().toLowerCase();
    }

    if (subCommand) {
      switch (subCommand) {
      case 'help':
        message.reply(i18n.commands.remind.syntaxHelp);
        return;
      case 'set':
        if (!args.length) {
          message.reply(i18n.commands.remind.syntaxHelp);
          return;
        }

        // Check if input is valid
        parts = args.join(' ').split('|');

        // Format is remind <any time or date string> | <message> | <extra mentions besides self like roles, channels, etc>
        if ((!parts[0] || (parts[0] && parts[0].trim() === '')) || (!parts[1] || (parts[1] && parts[1].trim() === ''))) {
          message.reply(i18n.commands.remind.syntaxHelp);
          return;
        }

        date = Date.create(parts.shift().trim(), { fromUTC: true });

        if (date.toString() === 'Invalid Date') {
          message.reply(i18n.commands.remind.invalidDateProvided);
          return;
        }

        joinedMessage = parts[0].trim();

        // Push self to mention payload.
        targets.push({
          type: 'user',
          id: message.author.id,
        });

        // Push current channel to channels.
        targets.push({
          type: 'channel',
          id: message.channel.id,
        });

        if (parts[1] && parts[1].trim() !== '') {
          recurring = parts[1].trim().split(' ');

          if (recurring[0]) {
            if (recurring[0].trim() === 'recurring') {
              isRecurring = true;
              // 1 hour
              recurringInterval = 1;
              recurringIntervalString = recurring[1] ? recurring[1].trim() : '';

              if (recurringIntervalString !== '') {
                if (!isNaN(recurringIntervalString)) {
                  recurringInterval = parseInt(recurringIntervalString);
                }
              }
            }
          }
        }

        // Encode the payload!
        payload = JSON.stringify({
          text: joinedMessage,
          targets: targets,
        });

        momentConverted = new moment(date).utc().startOf('minute');
        dateTime = momentConverted.format('YYYY-MM-DD HH:mm:ss');

        // Insert a reminder for each mentioned channel.
        this.db.createReminder(guildId, message.author.id, dateTime, payload, isRecurring, recurringInterval, () => {
          if (isRecurring) {
            message.reply(i18n.commands.remind.createdRecurring);
          }
          else {
            message.reply(i18n.commands.remind.createdNonRecurring);
          }
        });
        break;
      case 'remove':
        this.db.deleteRemindersForUser(guildId, message.author.id, () => {
          message.reply(i18n.commands.remind.deleted);
        });
        break;
      default:
        message.reply(i18n.commands.remind.syntaxHelp);
        return;
      }
    }
  }

  unremind(guildId, args, message) {
    if (args && args.length) {
      message.reply(i18n.commands.unremind.syntaxHelp);
      return;
    }

    this.db.deleteRemindersForUser(guildId, message.author.id, () => {
      message.reply(i18n.commands.unremind.removed);
    });
  }
}

module.exports = Remind;
