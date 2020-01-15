class GoogleTranslate {
    constructor(apiKey, languages, logger) {
        this.googleTranslate = require('google-translate')(apiKey);
        this.languages = languages;
        this.logger = logger;
    }

    translate(targetLang, textToTranslate, message, reply = false) {
        if (['us', 'gb', 'au'].includes(targetLang)) targetLang = 'en'
        if (['pt', 'br'].includes(targetLang)) targetLang = 'pt';
        if (['es', 'mx'].includes(targetLang)) targetLang = 'es';
        if (!reply && targetLang === 'ar') targetLang = 'es';

        const targetLanguage = this.languages.find(lang => lang.code === targetLang);

        if (targetLanguage !== undefined) {
            this.googleTranslate.translate(textToTranslate, targetLang, (err, results) => {
                if (results !== undefined) {
                    try {
                        const translatedText = results.translatedText.trim();
                        const sourceLanguage = this.languages.find(lang => lang.code === results.detectedSourceLanguage)

                        if (reply) {
                            message.reply(targetLanguage.name + ':\n' + '```' + translatedText + '```');
                        } else {
                            message.channel.send({
                                embed: {
                                    color: 3447003,
                                    author: {
                                        name: message.author.username,
                                        icon_url: message.author.avatarURL
                                    },
                                    description: translatedText,

                                    footer: {
                                        text: sourceLanguage.name + ' ⟶ ' + targetLanguage.name
                                    }
                                }
                            });
                        }
                    } catch (err) {
                        this.logger.error('ERROR:', err);
                        throw err;
                    }
                }
            });
        }
    }
}

module.exports = GoogleTranslate;