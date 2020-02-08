require('dotenv').config();

const Discord = require('discord.js');
const mysql = require('mysql');
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

// Database stuff
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

// connect to database
db.connect(err => {
    if (err) {
        logger.error('ERROR:', err);
        throw err;
    }
    console.log('Connected to the database.');
});

// Globals
let global;
global.db = db;

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
    getGuildId(message, guildId => {
        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
        if (!prefixRegex.test(message.content)) return;

        let targetLang = args.shift().toLowerCase();

        const [, matchedPrefix] = message.content.match(prefixRegex);
        const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const sanitizedMessage = replaceMentions(client, args.join(' '), message.guild);
        const targetLangEmoji = code(targetLang);

        let subCommand = null;
        let serverGmtOffset = null;
        let sql = '';

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
                const param = args[0].toLowerCase();

                switch (subCommand) {
                case 'help':
                    message.reply(i18n.commands.servertime.syntaxHelp);
                    return;
                case 'offset':
                    if (!args.length) {
                        message.reply(i18n.commands.servertime.incorrectOffset);
                        return;
                    }

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

                    sql = `REPLACE INTO \`guild_gmt_offsets\` (offset, guild_id) VALUES ('${offsetTz.toUpperCase()}', ${guildId});`;

                    db.query(sql, (err, result) => {
                        if (err) {
                            logger.error('ERROR:', err);
                            throw err;
                        }

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

            sql = `SELECT offset FROM \`guild_gmt_offsets\` WHERE guild_id = ${guildId} LIMIT 1;`;

            db.query(sql, (err, result) => {
                if (err) {
                    logger.error('ERROR:', err);
                    throw err;
                }

                if (!result.length) {
                    message.reply(i18n.commands.servertime.firstRunHelp);
                    return;
                }

                serverGmtOffset = result[0].offset;

                try {
                    unirest.get(`${process.env.TIMEZONE_API_URL}/${serverGmtOffset}`).end(response => {
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
                                        text: `${i18n.commands.servertime.serverTime}: ${serverGmtOffset}`,
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
        default:
            break;
        }
    });
});

function getGuildId(message, callback) {
    let sql = `SELECT id FROM guilds WHERE identifier = '${message.guild.id}' LIMIT 1;`;

    db.query(sql, (err, result) => {
        if (err) {
            logger.error('ERROR:', err);
            throw err;
        }

        if (!result.length) {
            sql = `REPLACE INTO \`guilds\` (identifier, name) VALUES ('${message.guild.id}', '${message.guild.name}');`;

            db.query(sql, (err) => {
                if (err) {
                    logger.error('ERROR:', err);
                    throw err;
                }

                callback(result.insertId);
            });
        }
        else {
            callback(result[0].id);
        }
    });
}

client.login(process.env.BOT_DISCORD_TOKEN);
