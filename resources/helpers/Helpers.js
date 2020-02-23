const unirest = require('unirest');
const XRegExp = require('xregexp');
const moment = require('moment');

function replaceMentions(client, message, guild) {
  const matches = XRegExp.matchRecursive(message, '<', '>', 'g');

  if (!matches) return message;

  matches.forEach(mention => {
    if (mention.startsWith('@')) {
      mention = mention.slice(1);

      if (mention.startsWith('!') || mention.startsWith('&')) {
        mention = mention.slice(1);
      }

      if (message.includes(`<@!${mention}>`)) {
        const user = client.users.get(mention);
        message = message.replace(`<@!${mention}>`, `@${user.username}`);
      }
      else if (message.includes(`<@&${mention}>`)) {
        const role = guild.roles.get(mention);
        message = message.replace(`<@&${mention}>`, `@${role.name}`);
      }
    }
    else if (mention.startsWith('#')) {
      mention = mention.slice(1);
      const channel = client.channels.get(mention);
      message = message.replace(`<#${mention}>`, `#${channel.name}`);
    }
  });

  return message;
}

function extractMentionIds(client, message, guild) {
  const matches = XRegExp.matchRecursive(message, '<', '>', 'g');
  const mentions = [];

  if (!matches) return mentions;

  matches.forEach(mention => {
    if (mention.startsWith('@')) {
      mention = mention.slice(1);

      if (mention.startsWith('!') || mention.startsWith('&')) {
        mention = mention.slice(1);
      }

      if (message.includes(`<@!${mention}>`)) {
        const user = client.users.get(mention);

        if (user) {
          mentions.push({
            type: 'user',
            id: user.id,
          });
        }
      }
      else if (message.includes(`<@&${mention}>`)) {
        const role = guild.roles.get(mention);

        if (role) {
          mentions.push({
            type: 'role',
            id: role.id,
          });
        }
      }
    }
    else if (mention.startsWith('#')) {
      mention = mention.slice(1);
      const channel = client.channels.get(mention);
      if (channel) {
        mentions.push({
          type: 'channel',
          id: channel.id,
        });
      }
    }
  });

  return mentions;
}

function getWorldTimeZoneData(apiUrl, offset, callback) {
  try {
    unirest.get(`${apiUrl}/${offset}`).end(response => {
      if (response.ok) {
        callback(moment.parseZone(response.body.datetime).format('dddd, MMMM Do YYYY, HH:mm:ss'));
      }
    });
  }
  catch (err) {
    this.logger.error('ERROR:', err);
    throw err;
  }
}

module.exports = {
  replaceMentions: replaceMentions,
  extractMentionIds: extractMentionIds,
  getWorldTimeZoneData: getWorldTimeZoneData,
};
