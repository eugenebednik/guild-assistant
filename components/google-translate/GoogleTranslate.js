const countryCode = require('country-language');
const languageDefinitions = require('../../resources/languages');
const i18n = require('../../i18n.json');

/**
 * Helpers
 */
const { replaceMentions } = require('../../resources/helpers/Helpers');

/**
 * Country emojis
 */
const { code } = require('country-emoji');

class GoogleTranslate {
  constructor(apiKey, logger) {
    this.googleTranslate = require('google-translate')(apiKey);
    this.logger = logger;
  }

  handle(targetLang, message, client, isCommand = false, args = []) {
    let targetLangEmoji;
    let textToTranslate;
    let targetLanguage;

    if (isCommand) {
      if (!args.length || (args.length && args[0].toLowerCase() === 'help')) {
        message.reply(i18n.commands.t.syntaxHelp);
        return;
      }

      textToTranslate = replaceMentions(client, args.join(' '), message.guild);
      targetLangEmoji = code(targetLang);

      if (targetLangEmoji) {
        targetLang = targetLangEmoji.toLowerCase();
      }

      targetLanguage = languageDefinitions.find(lang => lang.code === targetLang.toLowerCase());

      if (!targetLanguage) {
        targetLanguage = languageDefinitions.find(lang => lang.code === 'en');
      }
    }
    else {
      const countryLang = countryCode.getCountryLanguages(targetLang.toUpperCase(), (err, languages) => {
        if (err) throw err;
        if (languages && languages[0]) {
          if (targetLang === 'il') {
            return 'he';
          }
          else {
            return languages[0].iso639_1.toLowerCase();
          }
        }
        else {
          return 'en';
        }
      });

      textToTranslate = replaceMentions(client, message.content, message.guild);
      targetLanguage = languageDefinitions.find(lang => lang.code === countryLang);
    }

    this.googleTranslate.translate(textToTranslate, targetLanguage.code, (err, results) => {
      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }

      if (results) {
        const translatedText = results.translatedText.trim();
        const sourceLanguage = languageDefinitions.find(lang =>
          lang.code === results.detectedSourceLanguage.toLowerCase());

        if (isCommand) {
          message.reply(targetLanguage.name + ':\n' + '```' + translatedText + '```');
        }
        else {
          message.channel.send({
            embed: {
              color: 3447003,
              author: {
                name: message.author.username,
                icon_url: message.author.avatarURL,
              },

              description: translatedText,

              footer: {
                text: sourceLanguage.name + ' ⟶ ' + targetLanguage.name,
              },
            },
          });
        }
      }
    });
  }
}

module.exports = GoogleTranslate;
