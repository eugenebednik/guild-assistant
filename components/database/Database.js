const mysql = require('mysql');
const moment = require('moment');

class Database {
  constructor(dbHost, dbUsername, dbPassword, dbDatabase, logger) {
    this.db = mysql.createConnection({
      host: dbHost,
      user: dbUsername,
      password: dbPassword,
      database: dbDatabase,
      timezone: 'utc',
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

  getAllGuilds(callback) {
    const sql = 'SELECT id, snowflake FROM guilds;';

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR', err);
        throw err;
      }

      if (result && result.length) {
        callback(result);
      }
      else {
        return null;
      }
    });
  }

  setChannelSticky(guildId, channelSnowflake, messageSnowflake, title, text, createdBySnowflake, callback) {
    const now = new moment(moment.now());
    const dateTime = now.format('YYYY-MM-DD HH:mm:ss');

    const sql = `REPLACE INTO \`sticky_messages\` (
                                  guild_id,
                                  channel_snowflake,
                                  message_snowflake,
                                  title,
                                  message,
                                  created_by_snowflake,
                                  created_at
                                )
                                VALUES (
                                        ${guildId},
                                        '${channelSnowflake}',
                                        '${messageSnowflake}',
                                        '${title}',
                                        '${text.replace(/[\u0800-\uFFFF]/g, '')}',
                                        '${createdBySnowflake}',
                                        '${dateTime}'
                                      );`;

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
                    message = '${text.replace(/[\u0800-\uFFFF]/g, '')}'
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
    const sql = `SELECT id, message_snowflake, title, message, created_by_snowflake, created_at
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

      if (typeof callback === 'function') callback();
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

  getBroadcastChannels(guildId, callback) {
    const sql = `SELECT snowflake FROM \`broadcast_channels\` WHERE guild_id = ${guildId};`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }

      if (result.length) {
        callback(result);
      }
      else {
        callback(null);
      }
    });
  }

  setBroadcastChannel(guildId, channelSnowflake, callback) {
    const sql = `REPLACE INTO \`broadcast_channels\` (guild_id, snowflake) VALUES (${guildId}, '${channelSnowflake}');`;

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

  deleteBroadcastChannel(guildId, channelSnowflake, callback) {
    const sql = `DELETE FROM \`broadcast_channels\` WHERE guild_id = ${guildId} AND snowflake = '${channelSnowflake}';`;

    this.db.query(sql, (err) => {
      if (err) {
        this.logger.error('ERROR', err);
        throw err;
      }

      if (typeof callback === 'function') callback();
    });
  }

  deleteAllBroadcastChannels(guildId, callback) {
    const sql = `DELETE FROM \`broadcast_channels\` WHERE guild_id = ${guildId};`;

    this.db.query(sql, (err) => {
      if (err) {
        this.logger.error('ERROR', err);
        throw err;
      }

      if (typeof callback === 'function') callback();
    });
  }

  deleteRemindersForUser(guildId, authorSnowflake, callback) {
    const sql = `DELETE FROM \`reminders\`
                WHERE guild_id = ${guildId}
                AND created_by_snowflake = ${authorSnowflake};`;

    this.db.query(sql, (err) => {
      if (err) {
        this.logger.error('ERROR', err);
        throw err;
      }

      if (typeof callback === 'function') callback();
    });
  }

  createReminder(guildId, authorSnowflake, dateTime, payload, recurring = false, recurringInterval = null, callback) {
    const now = new moment(moment.now()).format('YYYY-MM-DD HH:mm:ss');
    const isRecurring = recurring ? 1 : 0;

    const sql = `REPLACE INTO \`reminders\`
                (guild_id, remind_on, recurring, recurring_interval, payload, created_by_snowflake, created_at)
                VALUES
                (${guildId}, '${dateTime}', ${isRecurring}, ${recurringInterval}, '${payload.replace(/[\u0800-\uFFFF]/g, '')}', '${authorSnowflake}', '${now}');`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR', err);
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

  updateReminderDateTime(guildId, authorSnowflake, dateTime, callback) {
    const sql = `UPDATE \`reminders\`
                SET remind_on = '${dateTime}'
                WHERE guild_id = ${guildId}
                AND created_by_snowflake = ${authorSnowflake};`;

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

  deleteReminderById(reminderId, callback) {
    const sql = `DELETE FROM \`reminders\` WHERE id = ${reminderId};`;

    this.db.query(sql, (err) => {
      if (typeof callback === 'function') callback();

      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }
    });
  }

  deleteAllReminders(callback) {
    const sql = 'DELETE FROM `reminders`';

    this.db.query(sql, (err) => {
      if (typeof callback === 'function') callback();

      if (err) {
        this.logger.error('ERROR:', err);
        throw err;
      }
    });
  }

  userHasReminders(guildId, authorSnowflake, callback) {
    const sql = `SELECT count(*) AS count
                FROM \`reminders\`
                WHERE guild_id = ${guildId}
                AND created_by_snowflake = '${authorSnowflake}';`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR', err);
        throw err;
      }

      if (result.length) {
        if (result[0].count > 0) {
          callback(true);
        }
      }

      callback(false);
    });
  }

  getGuildReminders(guildId, callback) {
    const sql = `SELECT id, remind_on, recurring, recurring_interval, payload, created_by_snowflake, created_at
                FROM \`reminders\`
                WHERE guild_id = ${guildId};`;

    this.db.query(sql, (err, result) => {
      if (err) {
        this.logger.error('ERROR', err);
        throw err;
      }

      if (result.length) {
        callback(result);
      }
      else {
        callback(null);
      }
    });
  }
}

module.exports = Database;

