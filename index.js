const Discord = require('discord.js');
const config = require('./config.json');
const GoogleTranslate = require('./components/google-translate/GoogleTranslate.js');

const client = new Discord.Client();
const prefix = config.prefix;
const googleTranslate = new GoogleTranslate(config.google.translate.apiKey);
const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

client.once('ready', () => {
    console.log('Ready!');
});

client.on('message', message => {
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (!prefixRegex.test(message.content)) return;

    const [, matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'ping':
            {
                console.log('here');
                message.channel.send('pong');
                break;
            }
        case 'tr':
            {
                if (args.length < 2) return;
                const targetLang = args.shift().toLowerCase();
                const textToTranslate = args.join(' ');
                googleTranslate.translate(targetLang, textToTranslate, message);
                break;
            }
        case 'prefix':
            {
                message.reply(`You can either ping me or use \`${prefix}\` as my prefix.`);
            }
    }
});

client.login(config.token);