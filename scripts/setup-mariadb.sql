-- ==============================================================================
-- FamPlay Brettspiele - MariaDB Initialisierungs-Script
-- ==============================================================================
-- Anleitung für Linux Server (z.B. root@tender-blackwell):
-- 1. Führe diesen Befehl im Terminal aus:
--    sudo mysql < scripts/setup-mariadb.sql
-- 2. Passe bei Bedarf das Passwort in der .env Datei an:
--    DB_USER=famplay_user
--    DB_PASSWORD=famplay_secure_password_2026
--    DB_NAME=famplay_brettspiele
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `famplay_brettspiele` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Erstelle Datenbank-Benutzer (falls noch nicht vorhanden)
CREATE USER IF NOT EXISTS 'famplay_user'@'localhost' IDENTIFIED BY 'famplay_secure_password_2026';
CREATE USER IF NOT EXISTS 'famplay_user'@'127.0.0.1' IDENTIFIED BY 'famplay_secure_password_2026';

-- Berechtigungen vergeben
GRANT ALL PRIVILEGES ON `famplay_brettspiele`.* TO 'famplay_user'@'localhost';
GRANT ALL PRIVILEGES ON `famplay_brettspiele`.* TO 'famplay_user'@'127.0.0.1';
FLUSH PRIVILEGES;

USE `famplay_brettspiele`;

-- 1. Tabelle für registrierte Spieler
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(64) UNIQUE NOT NULL,
  `email` VARCHAR(191) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'moderator', 'user') DEFAULT 'user',
  `family_role` VARCHAR(32) DEFAULT 'Family Member',
  `clan_name` VARCHAR(64) DEFAULT '',
  `level` INT DEFAULT 1,
  `xp` INT DEFAULT 0,
  `coins` INT DEFAULT 500,
  `gems` INT DEFAULT 10,
  `is_vip` TINYINT(1) DEFAULT 0,
  `is_banned` TINYINT(1) DEFAULT 0,
  `is_verified` TINYINT(1) DEFAULT 0,
  `avatar_json` LONGTEXT,
  `stats_json` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabelle für E-Mail-Aktivierungscodes (6-stellige Codes)
CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `token` VARCHAR(128) NOT NULL,
  `code` VARCHAR(16) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_token` (`token`),
  INDEX `idx_code` (`code`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabelle für Passwort-Zurücksetzen
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `token` VARCHAR(128) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reset_token` (`token`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabelle für Match-Historie & Statistiken
CREATE TABLE IF NOT EXISTS `match_history` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `game_id` VARCHAR(64) NOT NULL,
  `game_title` VARCHAR(128) NOT NULL,
  `result` ENUM('won', 'lost', 'draw') NOT NULL,
  `score` INT DEFAULT 0,
  `opponent_name` VARCHAR(64) DEFAULT '',
  `coins_earned` INT DEFAULT 0,
  `xp_earned` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_match_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ MariaDB Datenbank "famplay_brettspiele" und alle Tabellen erfolgreich eingerichtet!' AS Status;
