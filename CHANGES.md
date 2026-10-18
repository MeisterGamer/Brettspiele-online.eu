# Stabilität, mobile Nutzung und Sicherheit

## Änderungen

- Server prüft Multiplayer-Identitäten anhand signierter Tokens und der Datenbank, nicht anhand gesendeter Profile. Raumaktionen benötigen Mitgliedschaft; Verwaltungsaktionen benötigen den Raumhost.
- HTTP-Multiplayer benötigt ebenfalls Anmeldung und Raumzugriff. WebSocket-Verbindungen prüfen den Origin und begrenzen Nachrichtengröße und Nachrichtenrate.
- Zufällige lange Raumcodes werden zwischen Browser und Server geteilt. Ein bestehender Fehler mit unterschiedlichen Codes wurde behoben. HTTP-Spielaktionen werden nur einmal im Ereignispuffer gespeichert.
- Erneute Verbindungsversuche mit wachsendem Abstand und Neustart bei Rückkehr der Internetverbindung. Kein paralleles HTTP-Polling; Hintergrundtabs pausieren es.
- Fehleransicht mit Neustartmöglichkeit, statt einer leeren Seite nach React-Renderfehlern.
- Spiele als getrennte JavaScript-Dateien: Hauptbundle im lokalen Vergleich von etwa 1.253 KB auf 842 KB reduziert (unkomprimiert). Der Service Worker lädt weiterhin alle Spiele für seinen Offline-Cache.
- Mobile Touch-Ziele, Eingabefelder ohne automatischen iOS-Zoom, Bildschirmränder und dynamische Bildschirmhöhe berücksichtigt. Browserzoom bleibt möglich; reduzierte Bewegung wird respektiert.
- Service Worker fängt API- und WebSocket-Pfade nicht als HTML-Seiten ab. Im Entwicklungsmodus ist er deaktiviert.

## Betrieb

- Vor Produktivstart `JWT_SECRET` auf einen zufälligen Wert mit mindestens 32 Zeichen setzen. Beispiel zur Erzeugung: `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Bekannte Standards und der Beispielwert werden abgewiesen.
- Ohne konfigurierten Schlüssel wird im Entwicklungsbetrieb ein flüchtiger Schlüssel erzeugt; ein Neustart beendet dann bestehende Anmeldungen.
- Der Web-Setup-Assistent ist nur direkt über localhost erreichbar. Für entfernte Server einen SSH-Tunnel verwenden, z. B. `ssh -L 5555:127.0.0.1:5555 user@server`, anschließend `http://localhost:5555` öffnen. Nach Installation oder vorhandenem Admin sind alle Setup-Schreib- und Testendpunkte gesperrt.
- Die alternative Admin-Erstellung per API benötigt ausdrücklich `ADMIN_SETUP_KEY`. Es gibt keinen Standardschlüssel mehr.
- HTTPS am Reverse Proxy verwenden. Anfragelimits verwenden die direkte Verbindungsadresse; hinter einem Proxy teilen Nutzer derzeit dessen Limit. `trust proxy` nicht pauschal aktivieren; vor Skalierung passende Proxy- und gemeinsame Limit-Konfiguration ergänzen.

## Prüfung und verbleibende Arbeit

- `npm run lint`: TypeScript-Prüfung.
- `npm run build`: Produktionsbundle und Service Worker.
- `npm test`: Regressionstests für Authentifizierung, Limits, Setup über Proxy, WebSocket-Origin, unberechtigte Raumerstellung und doppelte Ereignisse.
- Noch erforderlich: echte MariaDB-/SMTP-Integration, Android-/iOS-Gerätetests in Browser und installierter PWA.
- Spielregeln und Spielstände werden noch teilweise von Clients geliefert. Diese Änderungen stellen keine vollständige serverseitige Spielvalidierung dar.
- Räume sowie Schach-, Dame-, Catan- und Mahjong-Spielstände werden dauerhaft gespeichert. Einzelheiten zur Wiederaufnahme und zum Datenschutz stehen in GAMEPLAY.md.
- Authentifizierungstokens liegen weiterhin im Local Storage; ein späterer Wechsel auf HttpOnly-Cookies benötigt eine abgestimmte CSRF- und WebSocket-Anmeldung.
- Das Hauptbundle ist weiterhin relativ groß. Weitere Aufteilung der Verwaltungs- und Profilansichten bleibt sinnvoll.

## Erweiterung der Spiele

Die anschließenden Änderungen an allen 16 Engines, den KI-Strategien, Yatzy und der Lobby sind in [GAMEPLAY.md](GAMEPLAY.md) beschrieben.
