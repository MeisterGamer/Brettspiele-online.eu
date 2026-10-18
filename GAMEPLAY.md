# Spiele, KI und Multiplayer

## Gemeinsame Erweiterungen

Alle 16 spielbaren Engines nutzen die neue Spielleiste mit individuellen Strategietipps, Partiezähler, Neustart und browserabhängigem Vollbild. Am Online-Tisch synchronisiert der Host neue Partien. Bereitschaft und Tischchat sind in der Lobby erreichbar; auf dem Handy den Tischbereich ausklappen.

Verzögerte Aktionen werden beim Verlassen des Spiels verworfen. Neustarts der klassischen Engines stoppen ausstehende Bot-Aktionen und Würfelanimationen. Schach, Dame, Vier gewinnt und Tic-Tac-Toe wurden außerdem bei Tastaturbedienung bzw. Feldbeschriftungen verbessert.

## KI

| Spiel | Änderung |
| --- | --- |
| Tic-Tac-Toe | Leicht zufällig, normal mit Gewinn-/Blockpriorität, schwer mit vollständigem Minimax. Eine vorhandene Gewinnmöglichkeit wird nicht mehr durch eine Blockade überschrieben. |
| Vier gewinnt | Zentrum und Drohungen bewerten; Alpha-Beta-Suche über drei bzw. fünf Halbzüge. |
| Schach | Figurenwerte, Entwicklung, Zentrumsnähe, bedrohte Figuren und auf schwer gegnerische Antworten berücksichtigen. Legale Züge werden mit chess.js geprüft, einschließlich Königssicherheit, Rochade, en passant und Umwandlung. |
| Dame | Brasilianische Dame auf 64 Feldern mit fliegenden Damen, maximalem Schlagzwang und vollständigen Mehrfachschlägen; KI sucht ausschließlich regelkonforme Zugfolgen. |
| Schiffe versenken | Leicht zufällig, sonst Schachbrettsuche und Trefferverfolgung; schwer setzt erkannte Richtungen fort. Kein Zugriff auf die versteckte Flotte bei der Zugauswahl. Randpositionen bei der Flottenaufstellung sind korrigiert. |
| Memory | Nur tatsächlich aufgedeckte Karten merken; Gedächtnis auf 2, 6 oder 16 Karten begrenzen. Bekannte Paare bevorzugen, unbekannte Karten erkunden. Online-Deckzuordnung korrigiert. |
| Käsekästchen | Vollständige Kästchen bevorzugen und die dritte Seite eines offenen Kästchens vermeiden. Normal und schwer verwenden aktuell dieselbe Heuristik. |
| Mahjong | Leicht zufällig, sonst Paare nach freigelegten Steinen und Ebenenhöhe bewerten; schwer berücksichtigt verbleibende spielbare Paare. |
| Yatzy | Vollständige Bot-Züge mit Halten, Nachwürfeln und Auswahl einer offenen Kategorie; getrennte Punktekarten und Spielerwechsel. |

Leicht/Normal/Schwer lassen sich für die ersten acht Spiele in der Spielleiste auswählen. Yatzy verwendet derzeit eine feste Strategie. Bei den übrigen Spielen bleibt die bestehende KI erhalten. FamCards und Catan mischen Karten nun mit Fisher–Yates statt einer zufälligen Sortierfunktion.

## Multiplayer

- WebSocket und HTTP verwenden denselben autorisierten Nachrichtenpfad: Erstellen, Beitreten, Bereitschaft, Chat, Bot-Verwaltung, Schwierigkeit und Neustart funktionieren über beide Transporte.
- Nur der Host verwaltet den Tisch und startet eine gemeinsame Partie; alle menschlichen Spieler müssen dafür bereit sein.
- Verbindungsstatus wird tatsächlich angezeigt. Bei erkanntem Offline-Zustand sind die Spielbedienelemente gesperrt.
- Ereignisnummern verhindern erneutes Anwenden bereits empfangener Nachrichten. Bei Wiederverbindung wird der verpasste Ereignisabschnitt vor der neuen Raumzustellung gelesen. Der Puffer umfasst höchstens 500 Ereignisse; Schach, Dame, Catan und Mahjong speichern zusätzlich dauerhafte serverseitige Spielstände.
- Wiederverbindungsfrist bei Socket-Verlust: 30 Sekunden; laufende serverseitige Partien behalten ihre Spielerplätze darüber hinaus. Aktive HTTP-Abfragen halten den Raumbeitritt aufrecht.
- Yatzy ist serverseitig geführt: Serverwürfel, drei Würfe, gehaltene Würfel, Punkte und Zugreihenfolge. Bis zu vier Spieler mit eigenen Punktekarten; der Host führt Bot-Kommandos aus.
- Spielerlimits berücksichtigen die Zwei- bzw. Vierspieler-Engines. Neue Teilnehmer können einer bereits gestarteten Partie nicht beitreten; vorhandene Teilnehmer dürfen sich wieder verbinden.

## Verifikation

`npm test`, `npm run lint` und `npm run build` prüfen Regeln, Suche, Serverrechte, HTTP-Tische, echte WebSocket-Kommunikation zwischen zwei angemeldeten Testnutzern sowie den Produktionsbuild.

Zusätzlich wurden alle 16 Engines auf einer 390 Pixel breiten Browser-Testfläche geladen und die Tic-Tac-Toe- und Yatzy-Bedienung interaktiv geprüft. Diese Testfläche verwendet künstliche Teilnehmer; sie ersetzt keinen Test auf echten Android- und iOS-Geräten.

## Abgeschlossene Regel- und Multiplayer-Erweiterung

- Schach: Königssicherheit, Rochaderechte, en passant, vier Umwandlungsfiguren, Matt, Patt, unzureichendes Material, Remisangebote, Aufgabe, dreifache Stellungswiederholung und 50-Züge-Antrag sowie automatische fünfmalige Wiederholung und 75-Züge-Regel. Die Zugliste bleibt nach Wiederaufnahme erhalten. Regelbibliothek: [chess.js](https://jhlywa.github.io/chess.js/).
- Dame: ausdrücklich brasilianische Dame-64 mit Rückwärtsschlagen der Steine, fliegenden Damen und größtmöglicher Schlagfolge. Geschlagene Figuren blockieren bis zum Zugende; Umwandlung erfolgt am Ende. Wiederholung, materialabhängige Endspielfristen, Remisvereinbarung und Aufgabe sind umgesetzt. Regelgrundlage: [FMJD Section 64](https://fmjd64.org/rules-of-the-game/).
- Catan: serverseitige Startaufstellung, Ressourcenbank, Würfelproduktion, Abwerfen bei sieben, Räuber und Diebstahl, Gebäudelimits, Straßenverbindung, längste Straße und größte Rittermacht, Häfen, Bank- und Spielerhandel mit Zustimmung sowie Entwicklungskarten und Siegprüfung. Fremde Ressourcenarten, Entwicklungskarten und der Nachziehstapel werden nicht an Mitspieler übertragen. Auf kleinen Bildschirmen steht zusätzlich eine Liste legaler Bauplätze zur Verfügung.
- Mahjong: gemeinsam geführtes Solo-/Duellspiel mit serverseitigen Paarprüfungen, Punkten und Zugwechseln. Alle drei Aufbauten besitzen 144 eindeutige Positionen und eine nachgewiesene Lösungsfolge mit 72 Paaren. Mischen, Tipps und Solo-Rücknahme werden geprüft. Das Brett passt sich der Bildschirmbreite an und lässt sich vergrößert verschieben.

Diese vier Spiele prüfen Identität, Zugrecht, Runden- und Spielstandversion sowie doppelte Kommandos auf dem Server. Die KI läuft dort unabhängig vom Host-Browser weiter. WebSocket und HTTP nutzen dieselben Regeln. Regelmäßige private Zustandsabfragen erlauben die Wiederaufnahme nach Seitenneuladen oder Verbindungsunterbrechung.

Räume und diese vier Spielstände werden atomar in `.data/matches.json` gespeichert und nach Serverneustart wiederhergestellt. `FAMPLAY_DATA_DIR` ändert das Verzeichnis; `FAMPLAY_PERSISTENCE=0` deaktiviert die Speicherung. Das Verzeichnis enthält geheime Karten und darf nicht öffentlich ausgeliefert werden. Bei unlesbarer Datei wird diese nicht überschrieben. Für Anmeldungen über Serverneustarts hinweg ist ein beständiger `JWT_SECRET` notwendig.

Zusätzliche Browserprüfung: zwei getrennte angemeldete Testspieler in Schach, Dame, Catan und Mahjong; ein Browser verwendet WebSocket, der andere ausschließlich HTTP. Züge, Punkte, KI-Aufstellung und Wiederaufnahme wurden interaktiv geprüft. Die mobile Mahjong-Ansicht wurde bei 390 Pixeln ohne horizontalen Seitenüberlauf geprüft.

## Weitere Systemgrenzen

Die übrigen Engines behalten teilweise clientseitige Spielzustände; Diamond Blast ist ein Einzelspiel. Die dauerhafte Wiederaufnahme gilt für die vier oben genannten Engines. Echte Android-/iOS-Geräte sowie MariaDB und SMTP benötigen weiterhin Tests in der jeweiligen Betriebsumgebung.

## Levelkampagnen: Mahjong und Diamond Blast

Beide Spiele bieten 50 Levels: Sehr leicht, Leicht, Mittel, Schwer und Experte mit jeweils zehn Levels. Jede Schwierigkeit ist direkt zugänglich; innerhalb der Stufe schaltet ein Sieg das nächste Level frei. Sterne und Bestwerte werden auf dem Gerät gespeichert.

Mahjong verwendet reproduzierbare und vollständig lösbare Bretter mit 48 bis 144 Steinen. Leichte Levels sind flach, höhere Stufen nutzen geschichtete Aufbauten. Tipps und Mischen sind begrenzt, bei Experte deaktiviert; Rücknahme ist im Levelmodus gesperrt. Ein Stern für das Abräumen, zwei ohne Hilfen, drei zusätzlich innerhalb der angezeigten Richtzeit. Freies Spiel mit den bisherigen 144-Steine-Aufbauten bleibt verfügbar. Online wählt der Host das Level; Auswahl und Hilfen werden serverseitig geprüft und der laufende Level gespeichert.

Diamond Blast steigert Punktziele, reduziert verfügbare Züge und ergänzt Eis, Felsen, Ketten sowie Farbsammelziele. Alle Hindernisziele entsprechen den tatsächlich gesetzten Hindernissen. Die Siegprüfung berücksichtigt die abschließende Kaskade einschließlich des letzten Zuges. Die neue Kampagne speichert separat vom bisherigen 100-Level-Modus; vorhandene Endlos-/Zeitmodus-Bestwerte werden übernommen.

Verifikation: vollständige Lösungsfolgen aller 50 Mahjong-Levels, je drei spielbare Startfelder aller 50 Diamond-Blast-Levels, Hilfenlimits, Freischaltung und Online-Levelrechte. Beide ersten Levels wurden im Browser gewonnen; Sterne und Freischaltung blieben nach Neuladen erhalten. Beide Levelauswahlen wurden auf 390 Pixel Breite geprüft.
