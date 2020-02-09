const XRegExp = require('xregexp');

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

module.exports = {
  replaceMentions: replaceMentions,
};
