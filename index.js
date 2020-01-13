require('dotenv').config()

const Discord = require('discord.js');
const mysql = require('mysql');
const moment = require('moment');
const i18n = require('./i18n.json');
const client = new Discord.Client();
const prefix = process.env.BOT_PREFIX;
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Database stuff
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

// connect to database
db.connect(err => {
    if (err) throw err;
    console.log('Connected to the database.');
});

// Globals
global.db = db;

// Helpers
const { stripTags, replaceMentions } = require('./resources/helpers/Helpers');

// Google Translate component
const GoogleTranslate = require('./components/google-translate/GoogleTranslate');
const languages = require('./resources/languages.js');
const googleTranslate = new GoogleTranslate(process.env.GOOGLE_TRANSLATE_API_KEY, languages);

// Country emojis
const { flag, code, name, countries } = require('country-emoji');

// Time difference calculator component
const { extractFormats } = require('./components/time-calculator/TimeCalculator');

// UniREST
const unirest = require('unirest');

client.on("guildCreate", guild => {
    console.log(`Joined a new guild: ${guild.name}`);

    initGuild(guild);
})

// App begin
client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageReactionAdd', (messageReaction, user) => {
    if (user.bot) return;
    const { message, emoji } = messageReaction;

    if (message.author.bot) return;

    let countryCode = code(emoji.name);
    if (countryCode !== undefined) {
        const sanitizedMessage = replaceMentions(client, message.content);
        googleTranslate.translate(countryCode.toLowerCase(), sanitizedMessage, message, false);
    }
});

client.on('message', message => {
    // Get local DB guild ID if not set already
    getGuildId(message, guildId => {
        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
        if (!prefixRegex.test(message.content)) return;

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
                message.channel.send(`Server count: ${client.guilds.size}`);
                break;
            case 't':
                if (args.length < 2 || (args.length === 1 && args[0].toLowerCase() === 'help')) {
                    message.reply(i18n.commands.t.syntaxHelp);
                    return;
                };
                const targetLang = args.shift().toLowerCase();
                const sanitizedMessage = replaceMentions(client, args.join(' '));
                googleTranslate.translate(targetLang, sanitizedMessage, message, true);
                break;
            case 'prefix':
                message.reply(i18n.commands.ping.message + `\`${prefix}\``);
                break;
            case 'servertime':
                let subcommand = null;
                let serverGmtOffset = null;
                let sql = '';

                if (args.length) {
                    subcommand = args.shift().toLowerCase();
                }

                if (subcommand) {
                    switch (subcommand) {
                        case 'help':
                            message.reply(i18n.commands.servertime.syntaxHelp);
                            return;
                            break;
                        case 'offset':
                            if (!args.length) {
                                message.reply(i18n.commands.servertime.incorrectOffset);
                                return;
                            }

                            if (!message.member.hasPermission('ADMINISTRATOR')) {
                                message.reply(i18n.general.accessDenied);
                                return;
                            }

                            let offsetTz = 'GMT';
                            const param = args[0].toLowerCase();

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
                                } else {
                                    message.reply(i18n.commands.servertime.incorrectOffset);
                                    return;
                                }
                            }

                            sql = `REPLACE INTO \`guild_gmt_offsets\` (offset, guild_id) VALUES ('${offsetTz.toUpperCase()}', ${guildId});`;

                            db.query(sql, (err, result) => {
                                if (err) console.log('ERROR:', err);

                                if (result) {
                                    message.reply(i18n.commands.servertime.offsetSetSuccess + `\`${offsetTz}\``);
                                    return;
                                } else {
                                    message.reply(i18n.commands.servertime.offsetSetFailure);
                                    return;
                                }
                            });
                            break;
                        default:
                            message.reply(i18n.commands.servertime.syntaxHelp);
                            return;
                            break;
                    }
                }

                sql = `SELECT offset FROM \`guild_gmt_offsets\` WHERE guild_id = ${guildId} LIMIT 1;`;

                db.query(sql, (err, result) => {
                    if (err) console.log('ERROR:', err);

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
                                            icon_url: message.author.avatarURL
                                        },
                                        description: `${i18n.commands.servertime.serverTime}: ${dateTime}`,

                                        footer: {
                                            text: `${i18n.commands.servertime.serverTime}: ${serverGmtOffset}`,
                                        }
                                    }
                                });
                            }
                        });
                    } catch (err) {
                        console.log('ERROR: ', err);
                    }
                });

                break;
            case 'init-guild':
                if (!message.member.hasPermission('ADMINISTRATOR')) {
                    message.reply(i18n.general.accessDenied);
                    return;
                }

                initGuild(message.guild);

                message.reply(i18n.commands.initGuild.success);
                break;
            default:
                break;
        }
    });
});

function getGuildId(message, callback) {
    sql = `SELECT id FROM guilds WHERE identifier = '${message.guild.id}' LIMIT 1;`;

    db.query(sql, (err, result) => {
        if (err) console.log('ERROR:', err);

        if (!result.length) {
            message.reply('Error: failed to fetch guild, aborting.');
            return;
        }

        callback(result[0].id);
    });
}

function initGuild(guild) {
    // Add this guild to the DB.
    let sql = `REPLACE INTO \`guilds\` (identifier, name) VALUES ('${guild.id}', '${guild.name}');`;

    db.query(sql, (err, result) => {
        if (err) console.log('ERROR:', err);
    });
}

client.login(process.env.BOT_DISCORD_TOKEN);