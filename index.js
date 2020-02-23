require('dotenv').config();

const Discord = require('discord.js');
const i18n = require('./i18n.json');
const client = new Discord.Client();
const prefix = process.env.BOT_PREFIX;
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cron = require('node-cron');
const moment = require('moment');

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
const Broadcast = require('./components/broadcast/Broadcast');
const broadcast = new Broadcast(db);
const Remind = require('./components/remind/Remind');
const remind = new Remind(db);

/**
 * Country emojis
 */
const { code } = require('country-emoji');

client.on('guildCreate', guild => {
  console.log(`Joined a new guild: ${guild.name}`);
});

client.once('ready', () => {
  console.log('Ready!');

  const job = cron.schedule('00 * * * * *', () => {
    console.log('Reminder cron is running.');

    db.getAllGuilds(result => {
      if (result) {
        result.forEach(guild => {
          const discordGuild = client.guilds.get(guild.snowflake);

          if (discordGuild) {
            console.log(`Processing guild ${discordGuild.id}`);
            // Get guild reminders.
            db.getGuildReminders(guild.id, reminders => {
              if (reminders && reminders.length) {
                console.log(`Found reminder tasks for guild ${discordGuild.id}`);

                reminders.forEach(reminder => {
                  const remindOn = moment(reminder.remind_on).utc().startOf('minute');
                  const now = moment(moment.now()).utc();

                  if (now.isSameOrAfter(remindOn)) {
                    // We are good to go on notification
                    console.log(`Processing entry: ${reminder.payload} for user ${reminder.created_by_snowflake}`);

                    const json = JSON.parse(reminder.payload);
                    const channels = [];
                    let mentions = '';

                    json.targets.forEach(target => {
                      if (target.type === 'channel') {
                        const channel = client.channels.get(target.id);

                        if (channel) {
                          channels.push(channel.id);
                        }
                      }

                      if (target.type === 'user') {
                        const user = discordGuild.members.get(target.id);
                        if (user) {
                          mentions += `<@!${user.id}> `;
                        }
                      }
                      else if (target.type === 'role') {
                        const role = discordGuild.roles.get(target.id);
                        if (role) {
                          mentions += `<@&${role.id}> `;
                        }
                      }
                    });

                    channels.forEach(channel => {
                      const message = `${i18n.commands.remind.reminderPrefix} ${mentions.trim()} ${i18n.commands.remind.reminderSuffix} ${json.text}`;
                      discordGuild.channels.get(channel).send(message).then(() => {
                        // Modify recurring reminder
                        if (reminder.recurring === 1) {
                          const newDate = remindOn.add(reminder.recurring_interval, 'hours').format('YYYY-MM-DD HH:mm:ss');
                          db.updateReminderDateTime(guild.id, reminder.created_by_snowflake, newDate, updated => {
                            if (updated) {
                              console.log(`Interval updated for reminder ID ${reminder.id}. New datetime: ${newDate}`);
                            }
                          });
                        }
                        else {
                          db.deleteReminderById(reminder.id, () => {
                            console.log(`Deleted reminder ID ${reminder.id} since it was not recurring`);
                          });
                        }
                      });
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  // Delete all reminders
  db.deleteAllReminders(() => {
    job.start();
  });
});

client.on('messageReactionAdd', (messageReaction) => {
  const { message, emoji } = messageReaction;

  const countryCode = code(emoji.name);
  if (countryCode) {
    googleTranslate.handle(countryCode.toLowerCase(), message, client);
  }
});

client.on('message', message => {
  db.getGuild(message.guild.id, message.guild.name, guildId => {
    // Bots cannot issue commands to the bot
    if (message.author.bot) return;

    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (prefixRegex.test(message.content)) {
      const [, matchedPrefix] = message.content.match(prefixRegex);
      const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      switch (command) {
      case 'ping':
        stick.sendAnyStickies(guildId, message, client);
        message.channel.send('pong');
        break;
      case 'beep':
        stick.sendAnyStickies(guildId, message, client);
        message.channel.send('boop');
        break;
      case 'stats':
        stick.sendAnyStickies(guildId, message, client);
        if (!message.member.hasPermission('ADMINISTRATOR')) {
          message.reply(i18n.general.accessDenied);
          return;
        }

        message.channel.send(`Server count: ${client.guilds.size}`);
        break;
      case 't':
        stick.sendAnyStickies(guildId, message, client);
        googleTranslate.handle(args.shift(), message, client, true, args);
        break;
      case 'prefix':
        stick.sendAnyStickies(guildId, message, client);
        message.reply(i18n.commands.ping.message + `\`${prefix}\``);
        break;
      case 'servertime':
        stick.sendAnyStickies(guildId, message, client);
        servertime.handle(guildId, message, args);
        break;
      case 'movemessage':
        stick.sendAnyStickies(guildId, message, client);
        moveMessage.handle(args, client, message);
        break;
      case 'stick':
        stick.stick(guildId, args, message, client);
        break;
      case 'unstick':
        stick.unstick(guildId, message);
        break;
      case 'broadcast':
        stick.sendAnyStickies(guildId, message, client);
        broadcast.handle(guildId, args, message);
        break;
      case 'remind':
        stick.sendAnyStickies(guildId, message, client);
        remind.remind(guildId, args, message);
        break;
      case 'unremind':
        stick.sendAnyStickies(guildId, message, client);
        remind.unremind(guildId, args, message);
        break;
      default:
        stick.sendAnyStickies(guildId, message, client);
        break;
      }
    }
    else {
      stick.sendAnyStickies(guildId, message, client);
    }
  });
});

client.login(process.env.BOT_DISCORD_TOKEN);
