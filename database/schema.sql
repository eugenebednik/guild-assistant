# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 192.168.10.10 (MySQL 5.7.27-0ubuntu0.18.04.1)
# Database: guildassistant
# Generation Time: 2020-02-23 09:04:40 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table broadcast_channels
# ------------------------------------------------------------

DROP TABLE IF EXISTS `broadcast_channels`;

CREATE TABLE `broadcast_channels` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `guild_id` bigint(20) unsigned NOT NULL,
  `snowflake` varchar(18) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `guild_id_2` (`guild_id`,`snowflake`),
  KEY `guild_id` (`guild_id`),
  KEY `snowflake` (`snowflake`),
  CONSTRAINT `broadcast_channels_ibfk_1` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table guild_gmt_offsets
# ------------------------------------------------------------

DROP TABLE IF EXISTS `guild_gmt_offsets`;

CREATE TABLE `guild_gmt_offsets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `guild_id` bigint(20) unsigned NOT NULL,
  `offset` char(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `guild_id_UNIQUE` (`guild_id`),
  KEY `guild_id_INDEX` (`guild_id`),
  CONSTRAINT `fk_guild_id` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table guilds
# ------------------------------------------------------------

DROP TABLE IF EXISTS `guilds`;

CREATE TABLE `guilds` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `snowflake` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier_UNIQUE` (`snowflake`),
  KEY `name` (`name`),
  KEY `identifier_INDEX` (`snowflake`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



# Dump of table reminders
# ------------------------------------------------------------

DROP TABLE IF EXISTS `reminders`;

CREATE TABLE `reminders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `guild_id` bigint(20) unsigned NOT NULL,
  `remind_on` datetime NOT NULL,
  `recurring` tinyint(1) NOT NULL DEFAULT '0',
  `recurring_interval` int(11) DEFAULT NULL,
  `payload` text NOT NULL,
  `created_by_snowflake` varchar(18) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `guild_id` (`guild_id`),
  CONSTRAINT `guild_id_foreign` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table sticky_messages
# ------------------------------------------------------------

DROP TABLE IF EXISTS `sticky_messages`;

CREATE TABLE `sticky_messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `guild_id` bigint(20) unsigned NOT NULL,
  `channel_snowflake` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `message_snowflake` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_snowflake` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `unique_vals` (`channel_snowflake`,`guild_id`),
  KEY `guild_id` (`guild_id`),
  KEY `message_snowlflake` (`message_snowflake`),
  KEY `created_by_snowflake` (`created_by_snowflake`),
  CONSTRAINT `sticky_messages_ibfk_1` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
