const mysql = require('mysql');
const moment = require('moment');

class Database {
  constructor(dbHost, dbUsername, dbPassword, dbDatabase, logger) {
    this.db = mysql.createConnection({
      host: dbHost,
      user: dbUsername,
      password: dbPassword,
      database: dbDatabase,
    });

    this.db.connect(err => {
      if (err) {
        logger.error('ERROR:', err);
        throw err;
      }
      console.log('Connected to the database.');
    });

    this.logger = logger;
  }

  getGuild(snowflake, guildName, callback) {
    let sql = `SELECT id FROM guilds WHERE snowflake = '${snowflake}' LIMIT 1;`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }

      if (!result.length) {
        sql = `REPLACE INTO \`guilds\` (snowflake, name) VALUES ('${snowflake}', '${guildName}');`;

        this.db.query(sql, (err, newResult) => {
          if (err) {
            this.logger.error('ERROR:', err);
            throw err;
          }

          callback(newResult.insertId);
        });
      }
      else {
        callback(result[0].id);
      }
    });
  }

  setChannelSticky(guildId, channelSnowflake, messageSnowflake, title, text, callback) {
    const now = new moment(moment.now());
    const dateTime = now.format('YYYY-MM-DD HH:mm:ss');

    const sql = `REPLACE INTO \`sticky_messages\` (guild_id, channel_snowflake, message_snowflake, title, message, created_at)
                VALUES (${guildId}, '${channelSnowflake}', '${messageSnowflake}', '${title}', '${text}', '${dateTime}');`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }

      if (typeof callback === 'function') {
        if (result) {
          callback(true);
        }
        else {
          callback(false);
        }
      }
    });
  }

  updateChannelSticky(stickyId, guildId, channelSnowflake, messageSnowflake, title, text, callback) {
    const sql = `UPDATE \`sticky_messages\`
                SET guild_id = ${guildId},
                    channel_snowflake = '${channelSnowflake}',
                    message_snowflake = '${messageSnowflake}',
                    title = '${title}',
                    message = '${text}'
                WHERE id = ${stickyId};`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }

      if (typeof callback === 'function') {
        if (result) {
          callback(true);
        }
        else {
          callback(false);
        }
      }
    });
  }

  getChannelSticky(guildId, channelSnowflake, callback) {
    const sql = `SELECT id, message_snowflake, title, message, created_at
                 FROM  \`sticky_messages\`
                 WHERE guild_id = ${guildId}
                 AND channel_snowflake = '${channelSnowflake}'
                 LIMIT 1;`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }

      if (result.length) {
        callback(result[0]);
      }
      else {
        callback(null);
      }
    });
  }

  deleteChannelSticky(guildId, channelSnowflake, callback) {
    const sql = `DELETE FROM \`sticky_messages\`
                WHERE guild_id = ${guildId}
                AND channel_snowflake = '${channelSnowflake}';`;

    this.db.query(sql, (err) => {
      if (err) {
        this.logger.error('ERROR', err);
        throw err;
      }

      callback();
    });
  }

  getServerTimezone(guildId, callback) {
    const sql = `SELECT offset FROM \`guild_gmt_offsets\` WHERE guild_id = ${guildId} LIMIT 1;`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }

      if (result.length) {
        callback(result[0].offset);
      }
      else {
        callback(null);
      }
    });
  }

  setServerTimezone(guildId, offsetTz, callback) {
    const sql = `REPLACE INTO \`guild_gmt_offsets\` (offset, guild_id) VALUES ('${offsetTz}', ${guildId});`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }

      if (result) {
        callback(true);
      }
      else {
        callback(false);
      }
    });
  }
}

module.exports = Database;

