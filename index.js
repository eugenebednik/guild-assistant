const Discord = require('discord.js');
const config = require('./config.json');
const GoogleTranslate = require('./components/google-translate/GoogleTranslate.js');
const languages = require('./resources/languages.js');
const { flag, code, name, countries } = require('country-emoji');

const client = new Discord.Client();
const prefix = config.prefix;
const googleTranslate = new GoogleTranslate(config.google.translate.apiKey, languages);
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageReactionAdd', (messageReaction, user) => {
    if (user.bot) return;
    const { message, emoji } = messageReaction;

    let countryCode = code(emoji.name);
    if (countryCode !== undefined) {
        googleTranslate.translate(countryCode.toLowerCase(), message.content, message, false);
    }
});

client.on('message', message => {
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (!prefixRegex.test(message.content)) return;

    const [, matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'ping':
            console.log('here');
            message.channel.send('pong');
            break;
        case 'tr':
            if (args.length < 2) return;
            googleTranslate.translate(args.shift().toLowerCase(), args.join(' '), message, true);
            break;
        case 'prefix':
            message.reply(`You can either ping me or use \`${prefix}\` as my prefix.`);
    }

});

client.login(config.token);