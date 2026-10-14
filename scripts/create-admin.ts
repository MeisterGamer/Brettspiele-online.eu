/**
 * Script zur Erstellung eines Administrators in MariaDB
 * Verwendung:
 *   npx tsx scripts/create-admin.ts [Benutzername] [E-Mail] [Passwort]
 * Beispiel:
 *   npx tsx scripts/create-admin.ts Admin admin@brettspiele-online.eu MeinSuperPasswort123
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { initDatabase, findUserByEmailOrUsername, createUser, updateUser } from '../server/db.js';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const username = args[0] || 'Admin';
  const email = args[1] || 'admin@brettspiele-online.eu';
  const password = args[2] || 'AdminPasswort2026!';

  console.log('🎲 ==============================================================');
  console.log('🎲 FamPlay MariaDB - Administrator Erstellung');
  console.log('🎲 ==============================================================');
  console.log(`👤 Gewünschter Benutzername: ${username}`);
  console.log(`📧 E-Mail:                   ${email}`);
  console.log(`🔑 Passwort:                 ${password.replace(/./g, '*')}`);

  console.log('\n[1/3] Verbinde mit Datenbank...');
  await initDatabase();

  console.log('\n[2/3] Prüfe bestehendes Konto...');
  const existing = await findUserByEmailOrUsername(username) || await findUserByEmailOrUsername(email);

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    console.log(`⚠️ Benutzer "${existing.username}" existiert bereits. Aktualisiere Rolle auf "admin" und setze neues Passwort...`);
    await updateUser(existing.id, {
      role: 'admin',
      password_hash: passwordHash,
      is_verified: true,
      is_banned: false,
    });
    console.log(`\n✅ Administrator "${existing.username}" erfolgreich aktualisiert!`);
  } else {
    console.log('[3/3] Erstelle neuen Administrator in MariaDB...');
    const adminRecord = {
      id: `adm_${crypto.randomBytes(8).toString('hex')}`,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role: 'admin' as const,
      family_role: 'Family Champion',
      clan_name: 'Administration',
      level: 10,
      xp: 5000,
      coins: 9999,
      gems: 500,
      is_vip: true,
      is_banned: false,
      is_verified: true,
      avatar_json: JSON.stringify({
        skinTone: '#FCD34D',
        hairStyle: 'spiky',
        hairColor: '#451A03',
        eyes: 'sparkle',
        mouth: 'smile',
        outfit: 'royal',
        outfitColor: '#4F46E5',
        accessory: 'crown',
        flair: 'gold-vip',
      }),
      stats_json: JSON.stringify({
        gamesPlayed: 0,
        gamesWon: 0,
        tournamentsWon: 0,
        favoriteGame: 'Mensch ärgere Dich nicht',
      }),
    };

    await createUser(adminRecord);
    console.log(`\n✅ Administrator "${username}" erfolgreich in MariaDB angelegt!`);
  }

  console.log('\n🎉 Du kannst dich jetzt im Webinterface mit diesen Zugangsdaten einloggen.');
  console.log('🔒 Hinweis: Automatisches Einloggen als Admin ist deaktiviert. Einloggen ist Pflicht.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Fehler:', err);
  process.exit(1);
});
