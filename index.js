require('dotenv').config();

const Discord = require('discord.js');
const i18n = require('./i18n.json');
const client = new Discord.Client();
const prefix = process.env.BOT_PREFIX;
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

/**
 * Database
 * @type {Database}
 */
const Database = require('./components/database/Database.js');
const db = new Database(
  process.env.DB_HOST,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  process.env.DB_DATABASE,
  logger,
);

/**
 * Modules
 */
const GoogleTranslate = require('./components/google-translate/GoogleTranslate');
const googleTranslate = new GoogleTranslate(process.env.GOOGLE_TRANSLATE_API_KEY, logger);
const Servertime = require('./components/servertime/Servertime');
const servertime = new Servertime(logger, db, process.env.TIMEZONE_API_URL);
const Stick = require('./components/stick/Stick');
const stick = new Stick(db);
const MoveMessage = require('./components/movemessage/MoveMessage');
const moveMessage = new MoveMessage();
<<<<<<< HEAD
=======
const Broadcast = require('./components/broadcast/Broadcast');
const broadcast = new Broadcast(db);
>>>>>>> develop

/**
 * Country emojis
 */
const { code } = require('country-emoji');

client.on('guildCreate', guild => {
  console.log(`Joined a new guild: ${guild.name}`);
});

client.once('ready', () => {
  console.log('Ready!');
});

client.on('messageReactionAdd', (messageReaction, user) => {
  if (user.bot) return;
  const { message, emoji } = messageReaction;

  if (message.author.bot) return;

  const countryCode = code(emoji.name);
  if (countryCode) {
    googleTranslate.handle(countryCode.toLowerCase(), message, client);
  }
});

client.on('message', message => {
  if (message.author.bot) return;

  db.getGuild(message.guild.id, message.guild.name, guildId => {
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (!prefixRegex.test(message.content)) {
      stick.sendAnyStickies(guildId, message);
      return;
    }

    const [, matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

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
      googleTranslate.handle(args.shift(), message, client, true, args);
      break;
    case 'prefix':
      message.reply(i18n.commands.ping.message + `\`${prefix}\``);
      break;
    case 'servertime':
      servertime.handle(guildId, message, args);
      break;
    case 'movemessage':
      moveMessage.handle(args, client, message);
      break;
    case 'stick':
      stick.stick(guildId, args, message, client, args);
      break;
    case 'unstick':
      stick.unstick(guildId, message);
      break;
<<<<<<< HEAD
=======
    case 'broadcast':
      broadcast.handle(guildId, args, message);
      break;
>>>>>>> develop
    default:
      stick.sendAnyStickies(guildId, message);
      break;
    }
  });
});

client.login(process.env.BOT_DISCORD_TOKEN);
