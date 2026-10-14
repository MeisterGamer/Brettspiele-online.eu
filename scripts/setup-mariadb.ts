/**
 * MariaDB Migrations- & Verbindungstest-Script
 * Verwendung:
 *   npm run setup:mariadb
 */

import dotenv from 'dotenv';
import { initDatabase, getDatabaseStatus } from '../server/db.js';

dotenv.config();

async function main() {
  console.log('🎲 ==============================================================');
  console.log('🎲 FamPlay - MariaDB Verbindung & Schema Initialisierung');
  console.log('🎲 ==============================================================');

  const status = getDatabaseStatus();
  console.log(`📡 Konfigurierte Host: ${status.host}:${status.port}`);
  console.log(`📦 Datenbankname:      ${status.database}`);
  if (status.socket) {
    console.log(`🔌 Unix-Socket:        ${status.socket}`);
  }

  console.log('\n[1/2] Prüfe MariaDB Verbindung und erstelle Tabellen falls nötig...');
  const success = await initDatabase();

  if (success) {
    console.log('\n✅ ERFOLG: MariaDB ist verbunden und alle Tabellen (users, tokens, etc.) sind einsatzbereit!');
    console.log('🎉 Du kannst nun Benutzer über die Web-Oberfläche registrieren oder einen Admin anlegen:');
    console.log('   npx tsx scripts/create-admin.ts');
  } else {
    console.log('\n⚠️ HINWEIS: MariaDB konnte nicht erreicht werden.');
    console.log('👉 Bitte prüfe deine MariaDB Konfiguration in der .env Datei:');
    console.log('   DB_HOST=127.0.0.1');
    console.log('   DB_PORT=3306');
    console.log('   DB_USER=famplay_user (oder root)');
    console.log('   DB_PASSWORD=dein_passwort');
    console.log('   DB_NAME=famplay_brettspiele');
    console.log('\n👉 Oder führe das SQL-Script direkt auf deinem Linux-Server aus:');
    console.log('   sudo mysql < scripts/setup-mariadb.sql');
  }

  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('\n❌ Unerwarteter Fehler:', err);
  process.exit(1);
});
