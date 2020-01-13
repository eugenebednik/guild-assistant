CREATE DATABASE  IF NOT EXISTS `guildassistant`;
USE `guildassistant`;

SET FOREIGN_KEY_CHECKS = 0;

--
-- Table structure for table `guild_gmt_offsets`
--

DROP TABLE IF EXISTS `guild_gmt_offsets`;
CREATE TABLE `guild_gmt_offsets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `guild_id` bigint(20) unsigned NOT NULL,
  `offset` char(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `guild_id_UNIQUE` (`guild_id`),
  KEY `guild_id_INDEX` (`guild_id`),
  CONSTRAINT `fk_guild_id` FOREIGN KEY (`guild_id`) REFERENCES `guilds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `guilds`
--

DROP TABLE IF EXISTS `guilds`;
CREATE TABLE `guilds` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `identifier` varchar(45) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier_UNIQUE` (`identifier`),
  KEY `name` (`name`),
  KEY `identifier_INDEX` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;