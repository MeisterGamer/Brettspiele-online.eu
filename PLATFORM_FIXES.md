# Plattformprüfung: Registrierung, Räume und Freunde

Stand: 18.10.2026. Die Änderungen sind im Quellcode umgesetzt. Das ist keine Zusicherung, dass jede Funktion des gesamten Projekts fehlerfrei ist.

## Behobene Ursachen

- Registrierung wartete auf SMTP: Bei einem gestörten E-Mail-Server blieb das Formular hängen. Die Kontoerstellung wartet jetzt nicht mehr auf den Versand. SMTP hat begrenzte Verbindungszeiten; fehlende Konfiguration wird korrekt angezeigt.
- Eingaben waren länger erlaubt als die MariaDB-Spalten. Namen, E-Mail-Adressen, Familienrollen und Clan-Namen werden passend zur Datenbank geprüft. Gleichzeitige Registrierungen erzeugen keine doppelten Konten.
- Freunde waren lokale Musterprofile. Auch unbekannte Namen erzeugten erfundene „Online“-Kontakte. Jetzt werden nur bestehende Konten hinzugefügt, pro Benutzer in MariaDB oder einer lokalen Datei gespeichert. Favoriten und Entfernen werden vom Server bestätigt.
- Einladungen waren nur Benachrichtigungen beim Absender. Jetzt erhält das Zielkonto eine gespeicherte Einladung mit funktionierendem Raumbeitritt. Die Abfrage erfolgt alle 15 Sekunden.
- Räume und Bots wurden im Browser vor einer Serverbestätigung erfunden. Erstellen, Beitreten und Sitzänderungen warten jetzt auf die tatsächliche Antwort. Volle, unbekannte und nicht erlaubte Räume melden einen Fehler.
- Private Räume wurden öffentlich mitgeliefert. Öffentliche Listen enthalten sie jetzt nicht; der Beitritt mit bekanntem Code funktioniert unabhängig vom lokalen Raum-Cache.
- HTTP-Sitzungen konnten nach einem Raumwechsel über WebSocket auf den alten Raum zeigen. Beide Transportwege greifen jetzt auf dieselbe tatsächliche Mitgliedschaft zu.
- Kurze mobile Unterbrechungen entfernten Teilnehmer zu schnell. Die Verbindungsfrist beträgt jetzt fünf Minuten; die vorhandene Wiederaufnahme regelbasierter Partien bleibt erhalten.
- Profil und Avatar waren nur lokal geändert. Profiländerungen werden jetzt serverseitig gespeichert und auf Namenskonflikte geprüft. Null Münzen/Edelsteine bleiben null; fehlende Statistikfelder erhalten Standardwerte.
- Die bekannte Master-PIN konnte die Admin-Oberfläche freischalten. Der PIN-Zugang wurde entfernt. Benutzerliste, Rollen, Sperren, VIP und Münzgutschriften verwenden die echte Serverautorisierung. Laufende WebSocket-Verbindungen prüfen Kontosperren bei jedem Befehl.
- Lokale Bestätigungs-/Reset-Tokens und der lokale JWT-Schlüssel gingen beim Neustart verloren. Sie werden jetzt dauerhaft gespeichert. Kurze Bestätigungscodes sind einem angemeldeten Konto zugeordnet; E-Mail-Links erzeugen keine fremde Anmeldesitzung. Im Profil lassen sich Codes bestätigen und erneut anfordern.
- Temporäre Serverfehler löschten Anmeldungen. Nur abgelaufene, gesperrte oder nicht mehr vorhandene Konten führen jetzt zum Verwerfen der Sitzung.

## Live-System: noch auf dem Host anzuwenden

Die Prüfung von `https://brettspiele-online.eu` erfolgte ausschließlich lesend:

- `/api/health`, `/api/auth/status`, `/api/setup/status` und `/api/rooms` antworteten mit JSON. Die Statusauskunft meldete Datenbank und SMTP als konfiguriert/verbunden.
- `wss://brettspiele-online.eu/api/ws` antwortete mit HTTP 404.
- `wss://brettspiele-online.eu/ws` antwortete mit HTTP 200 statt HTTP 101.

Damit ist die WebSocket-Weiterleitung des laufenden Hosts fehlerhaft. Der HTTP-Ersatzweg ist weiter verfügbar und wurde mit den echten API-Routern getestet. `deploy/nginx-locations.conf` enthält passende nginx-Blöcke für die beiden WebSocket-Pfade und `/api/`. Sie müssen innerhalb des vorhandenen Serverblocks eingebunden werden. Bestehende kollidierende Locations entsprechend ersetzen; TLS-Einstellungen beibehalten. Bei Apache ist eine entsprechende WebSocket-Weiterleitung erforderlich.

Für die Bereitstellung: Änderungen auf den Host übernehmen, Abhängigkeiten mit `npm ci` installieren, `npm run build` ausführen und den vorhandenen Node-Prozess mit `NODE_ENV=production` neu starten. `JWT_SECRET` muss wie bisher dauerhaft konfiguriert sein. Die zusätzlichen MariaDB-Tabellen werden beim Serverstart angelegt; der Datenbankbenutzer benötigt dafür CREATE-Rechte. nginx-Konfiguration mit `nginx -t` prüfen und erst danach neu laden. `TRUST_PROXY=loopback` passt zu einem lokalen Reverse Proxy; bei einem entfernten Proxy die tatsächlich vertrauten Adressen konfigurieren.

Hier wurde kein Live-Konto angelegt, keine produktive Nachricht versendet und keine Live-Server-Konfiguration verändert. Ein erfolgreicher SMTP-Status belegt keine E-Mail-Zustellung. Ein tatsächlicher Zustelltest mit den produktiven Zugangsdaten bleibt erforderlich.

## Validierung

- Gesamte automatisierte Testsuite inklusive Regeln, KI, Kampagnen, Assets und Multiplayer.
- `server/platform.test.ts`: vollständige Konten-, Freundes-, Einladungs- und Raumabläufe über dieselben Router wie der laufende Server; Berechtigungen, Duplikate, Profilpersistenz, Neustartpersistenz, Passwort-Reset und absichtlich nicht antwortendes SMTP.
- Dieselben Plattformtests wurden zusätzlich mit einer echten MariaDB in einer eigenen temporären Testdatenbank ausgeführt. Die Testdatenbank wird anschließend entfernt.
- `src/services/apiAuth.test.ts`: Sitzungserhalt bei Serverfehlern, verständliche Fehler bei HTML statt API-JSON und kein Kontowechsel durch fremde E-Mail-Bestätigung.
- Browserprüfung mit zwei getrennten Sitzungen: Registrierung, Freund hinzufügen, Einladung empfangen und annehmen, Bereitschaft und synchronisierter Schachzug. Aufnahme unter `artifacts/plattform-multiplayer-pruefung.png`.
- Zusätzlicher Browserdurchlauf hinter einem lokalen Proxy mit absichtlich abgewiesenen WebSocket-Upgrades: Raumbeitritt, geladener Spielstand, eigener Schachzug und vom Server bestätigter Tischchat über HTTP. Aufnahme unter `artifacts/plattform-http-pruefung.png`.
- TypeScript und Produktions-/PWA-Build.

Ergebnis des abschließenden Standarddurchlaufs: 57/57 Tests erfolgreich; TypeScript und Build erfolgreich. Zusätzlich bestand der Plattformdurchlauf mit echter MariaDB.

Tests: `npm test`, `npm run lint`, `npm run build`. Optionaler MariaDB-Durchlauf: `FAMPLAY_TEST_MARIADB=1 npm run test:platform` (PowerShell: `$env:FAMPLAY_TEST_MARIADB='1'; npm run test:platform`). Der Test benötigt CREATE- und DROP-Rechte für seine ausschließlich mit `famplay_test_` beginnende Testdatenbank.
