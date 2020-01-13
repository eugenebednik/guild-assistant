require('dotenv').config()

const Discord = require('discord.js');
const mysql = require('mysql');
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

    // Add this guild to the DB.
    let sql = `REPLACE INTO \`guilds\` (identifier, name) VALUES ('${guild.id}', '${guild.name}');`;

    db.query(sql, (err, result) => {
        if (err) console.log('ERROR:', err);

        console.log(result);
    });
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
    const prefixRegex = new RegExp(` ^ ( < @! ? $ { client.user.id } > | $ { escapeRegex(prefix) })\\ s * `);
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
            const sanitizedMessage = replaceMentions(client, args.join(' '));
            googleTranslate.translate(args.shift().toLowerCase(), sanitizedMessage, message, true);
            break;
        case 'prefix':
            message.reply(`you can either ping me or use \`${prefix}\` as my prefix.`);
            break;
        case 'servertime':
            if (!args.length || args[0].toLowerCase() === 'help') {
                message.reply(i18n.commands.servertime.syntaxHelp);
                return;
            };

            // Get server GMT offset
            let guildId = null;
            let serverGmtOffset = null;

            let sql = `SELECT id FROM guilds WHERE name = ${message.guild.name};`;

            if (!serverGmtOffset && args[0] !== 'offset') {
                message.reply(i18n.commands.servertime.gmtOffsetNotSet);
                return;
            }

            if (args[0] === 'offset' && args.length < 2) {
                message.reply(i18n.commands.servertime.incorrectOffset);
            }

            db.query(sql, (err, result) => {
                if (err) console.log('ERROR:', err);

                if (!result.length) {
                    message.reply('Error: failed to fetch guild, aborting.');
                    return;
                }

                guildId = result.id;
            })

            if (args[0] === 'offset' && args.length === 2) {
                let offsetTz = 'GMT';

                if (args[1].toLowerCase() !== 'gmt') {
                    const match = args[1].match(/[-+]\d{1,2}/);

                    if (match) {
                        const sign = match[0].substr(0, 1);
                        const number = match[0].substr(1, match[0].length);

                        if (sign === '+' && (number < 1 || number > 14)) {
                            message.reply(i18n.commands.servertime.incorrectOffset);
                        }

                        if (sign === '-' && (number < 1 || number > 9)) {
                            message.reply(i18n.commands.servertime.incorrectOffset);
                        }

                        offsetTz += sign + number;
                    }
                }

                sql = `REPLACE INTO \`guild_gmt_offsets\` (offset, guild_id) VALUES ('${offsetTz}', '${guildId}');`;

                db.query(sql, (err, result) => {
                    if (err) console.log('ERROR:', err);

                    if (result.length) {
                        message.reply(`offset ${offsetTz} successfully set. You may now utilize the \`servertime\` command.`);
                        return;
                    } else {
                        message.reply('something went wrong. Ooops!');
                        return;
                    }
                });
            }

            sql = `SELECT * FROM guild_gmt_offsets WHERE guild_id = ${guildId}`;

            db.query(sql, (err, result) => {
                if (err) throw err;

                if (!result.length) {
                    message.reply(`please set the GMT offset for your guild first. Run ${prefix}servertime offset <offset>. Offset is between \`-9\` to \`+14.\``);
                    return;
                }

                serverGmtOffset = result.offset;
            });

            console.log(serverGmtOffset);

            try {
                unirest.get(`${process.env.TIMEZONE_API_URL}/${serverGmtOffset}`).end(response => {
                    if (response.ok) {
                        const body = response.body;

                        console.log(body);
                    }
                });
            } catch (err) {
                console.log('ERROR: ', err);
            }
            break;
        default:
            break;
    }

});

function addGuild(guildId) {

}

client.login(process.env.BOT_DISCORD_TOKEN);