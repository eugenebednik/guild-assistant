const countryCode = require('country-language');
const languageDefinitions = require('../../resources/languages');

class GoogleTranslate {
  constructor(apiKey, logger) {
    this.googleTranslate = require('google-translate')(apiKey);
    this.logger = logger;
  }

  translate(targetLang, textToTranslate, message, isCommand = false) {
    let targetLanguage;

    if (!isCommand) {
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

      targetLanguage = languageDefinitions.find(lang => lang.code === countryLang);
    }
    else {
      targetLanguage = languageDefinitions.find(lang => lang.code === targetLang.toLowerCase());

      if (!targetLanguage) {
        targetLanguage = languageDefinitions.find(lang => lang.code === 'en');
      }
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
