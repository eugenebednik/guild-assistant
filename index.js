require('dotenv').config();

const Discord = require('discord.js');
const moment = require('moment');
const i18n = require('./i18n.json');
const client = new Discord.Client();
const prefix = process.env.BOT_PREFIX;
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Logging
const log4js = require('log4js');
log4js.configure({
  appenders: {
    botLogger: { type: 'file', filename: process.env.LOG_FILE },
  },
  categories: {
    default: { appenders: ['botLogger'], level: process.env.LOG_LEVEL },
  },
});

const logger = log4js.getLogger('botLogger');

// Database
const Database = require('./components/database/Database.js');
const db = new Database(
  process.env.DB_HOST,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  process.env.DB_DATABASE,
  logger,
);

// Helpers
const { replaceMentions, moveMessage } = require('./resources/helpers/Helpers');

// Google Translate component
const GoogleTranslate = require('./components/google-translate/GoogleTranslate');
const googleTranslate = new GoogleTranslate(process.env.GOOGLE_TRANSLATE_API_KEY, logger);

// Country emojis
const { code } = require('country-emoji');

// UniREST
const unirest = require('unirest');

client.on('guildCreate', guild => {
  console.log(`Joined a new guild: ${guild.name}`);
});

// App begin
client.once('ready', () => {
  console.log('Ready!');
});

client.on('messageReactionAdd', (messageReaction, user) => {
  if (user.bot) return;
  const { message, emoji } = messageReaction;

  if (message.author.bot) return;

  const countryCode = code(emoji.name);
  if (countryCode) {
    const sanitizedMessage = replaceMentions(client, message.content, message.guild);
    googleTranslate.translate(countryCode.toLowerCase(), sanitizedMessage, message, false);
  }
});

client.on('message', message => {
  db.getGuild(message.guild.id, message.guild.name, guildId => {
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (!prefixRegex.test(message.content)) return;

    const [, matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    let sanitizedMessage;
    let targetLang;
    let targetLangEmoji;
    let subCommand;
    let param;

    switch (command) {
    case 'ping':
      message.channel.send('pong');
      break;
    case 'beep':
      message.channel.send('boop');
      break;
    case 'stats':
      if (!message.member.hasPermission('ADMINISTRATOR')) {
        message.reply(i18n.general.accessDenied);
        return;
      }

      message.channel.send(`Server count: ${client.guilds.size}`);
      break;
    case 't':
      if (args.length < 2 || (args.length === 1 && args[0].toLowerCase() === 'help')) {
        message.reply(i18n.commands.t.syntaxHelp);

        return;
      }

      targetLang = args.shift().toLowerCase();
      sanitizedMessage = replaceMentions(client, args.join(' '), message.guild);
      targetLangEmoji = code(targetLang);

      if (targetLangEmoji) {
        targetLang = targetLangEmoji.toLowerCase();
      }

      googleTranslate.translate(targetLang, sanitizedMessage, message, true);
      break;
    case 'prefix':
      message.reply(i18n.commands.ping.message + `\`${prefix}\``);
      break;
    case 'servertime':
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
          if (!args.length) {
            message.reply(i18n.commands.servertime.incorrectOffset);
            return;
          }

          param = args[0].toLowerCase();

          if (!message.member.hasPermission('ADMINISTRATOR')) {
            message.reply(i18n.general.accessDenied);
            return;
          }

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

          db.setServerTimezone(guildId, offsetTz.toUpperCase(), result => {
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

      db.getServerTimezone(guildId, result => {
        if (!result) {
          message.reply(i18n.commands.servertime.firstRunHelp);
          return;
        }

        try {
          unirest.get(`${process.env.TIMEZONE_API_URL}/${result}`).end(response => {
            if (response.ok) {
              const dateTime = moment.parseZone(response.body.datetime).format('dddd, MMMM Do YYYY, HH:mm:ss');

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
            }
          });
        }
        catch (err) {
          logger.error('ERROR:', err);
          throw err;
        }
      });
      break;
    case 'msgmove':
      if (!args.length || (args.length && args.length !== 2)) {
        message.reply(i18n.commands.msgmove.syntaxHelp);
        return;
      }
      else {
        moveMessage(args, client, message);
      }

      break;
    case 'stick':
      if (args.length < 2 || (args.length === 1 && args[0].toLowerCase() === 'help')) {
        message.reply(i18n.commands.stick.syntaxHelp);

        return;
      }

      sanitizedMessage = replaceMentions(client, args.join(' '), message.guild);

      console.log(sanitizedMessage);
      break;
    default:
      break;
    }
  });
});


client.login(process.env.BOT_DISCORD_TOKEN);
