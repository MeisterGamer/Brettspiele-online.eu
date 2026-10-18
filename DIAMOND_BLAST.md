# Diamond Blast: Kristallmine

Eine durchgehende Kampagne von 1 bis maximal 50. Nur das nächste Level wird freigeschaltet; nach Level 50 erscheint der Kampagnenabschluss. Die fünf Kapitel dienen der Übersicht und bieten keine getrennten Einstiege. Vorhandene Sterne und Bestwerte werden übernommen; die Freischaltung ergibt sich aus lückenlos abgeschlossenen Levels.

## Eigene Bilder

Alle drei PNG-Dateien wurden mit dem integrierten Imagegen-Werkzeug speziell für Diamond Blast erstellt, in public/assets/diamond-blast/ gespeichert und in Spiel und Menü eingebunden. Die vollständigen Prompts liegen dort in prompts.json. Kein API-/CLI-Fallback.

- gems.png: Rubin als Herz, Saphir als Tropfen, rechteckiger Smaragd, dreieckiger Topas, sechseckiger Amethyst und runder Bernstein. Farbe und Form unterscheiden die Steine.
- objects.png: Zeilen- und Spaltenlaser, Bombe, Regenbogenprisma, Eisrahmen, Fels, Kettenrahmen und Meisterstern.
- vault.png: eigenes Höhlen-Spielbrett mit Kristallrahmen und dunkler Spielfläche.

Bildatlanten vermeiden zusätzliche Anfragen pro Feld. Alle Bilder werden vom Service Worker für Offline-Nutzung gecacht.

## Regeln und Stabilität

Die gemeinsame reine Zugauswertung prüft Nachbarschaft, gesperrte Steine, Kombinationen, Spezialeffekte, Kettenreaktionen, Schwerkraft und Ziele. Ein Zug wird erst nach seiner vollständigen Kaskade abgeschlossen. Ein Hindernis nimmt pro Welle höchstens einen Treffer; Treffer zählen auf allen Wegen für die Ziele. Felsen, Eis und Ketten bleiben fest, bis sie beseitigt werden. Ungültige Züge kosten keinen Zug. Mischen bewahrt die verbleibenden Hindernisse und ihre Reststärke. Neustart und Verlassen verhindern nachträgliche Änderungen durch alte Animationen.

## Leveltabelle

Punktziele steigen in jedem Level. Zugbudgets steigen nie. Neue Hindernisse, zusätzliche Farben und zweite Sammelziele erhöhen die Anforderungen; Namen, Startfelder und die Hindernisaufbauten unterscheiden die Levels. Ein Neustart reproduziert dasselbe Startfeld.

| Level | Name | Züge | Punkte | Farben | Eis | Fels | Kette | Sammelziele |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Erster Glanz | 36 | 2350 | 5 | 0 | 0 | 0 | – |
| 2 | Funkenspur | 36 | 2500 | 5 | 0 | 0 | 0 | – |
| 3 | Rubinquelle | 36 | 2650 | 5 | 0 | 0 | 0 | – |
| 4 | Saphirbogen | 36 | 2800 | 5 | 0 | 0 | 0 | – |
| 5 | Bernsteinfund | 36 | 2950 | 5 | 0 | 0 | 0 | 8 Rubine sammeln |
| 6 | Smaragdlicht | 35 | 3100 | 5 | 0 | 0 | 0 | 8 Saphire sammeln |
| 7 | Topasbrücke | 35 | 3250 | 5 | 0 | 0 | 0 | 8 Smaragde sammeln |
| 8 | Erster Frost | 35 | 3400 | 5 | 2 | 0 | 0 | 9 Topasse sammeln |
| 9 | Eisfenster | 35 | 3550 | 5 | 2 | 0 | 0 | 9 Amethyste sammeln |
| 10 | Kristalltor | 34 | 3700 | 5 | 2 | 0 | 0 | 9 Rubine sammeln |
| 11 | Frostgarten | 34 | 4200 | 6 | 2 | 0 | 0 | 9 Rubine sammeln |
| 12 | Blaue Adern | 34 | 4350 | 6 | 2 | 0 | 0 | 10 Saphire sammeln |
| 13 | Eiskreuz | 34 | 4500 | 6 | 2 | 0 | 0 | 10 Smaragde sammeln |
| 14 | Gletscherpfad | 33 | 4650 | 6 | 3 | 0 | 0 | 10 Topasse sammeln |
| 15 | Gefrorene Krone | 33 | 4800 | 6 | 3 | 0 | 0 | 10 Amethyste sammeln |
| 16 | Kältekammer | 33 | 4950 | 6 | 3 | 0 | 0 | 11 Bernsteine sammeln |
| 17 | Froststern | 33 | 5100 | 6 | 3 | 0 | 0 | 11 Rubine sammeln |
| 18 | Erster Fels | 32 | 5250 | 6 | 3 | 2 | 0 | 11 Saphire sammeln |
| 19 | Steinbrücke | 32 | 5400 | 6 | 3 | 2 | 0 | 11 Smaragde sammeln |
| 20 | Tor zur Mine | 32 | 5550 | 6 | 4 | 2 | 0 | 12 Topasse sammeln |
| 21 | Basaltring | 32 | 6050 | 6 | 4 | 2 | 0 | 12 Amethyste sammeln |
| 22 | Verborgene Ader | 31 | 6200 | 6 | 4 | 2 | 0 | 12 Bernsteine sammeln |
| 23 | Felsengasse | 31 | 6350 | 6 | 4 | 2 | 0 | 12 Rubine sammeln |
| 24 | Zwillingsstollen | 31 | 6500 | 6 | 4 | 2 | 0 | 13 Saphire sammeln |
| 25 | Tiefer Schacht | 31 | 6650 | 6 | 4 | 2 | 0 | 13 Smaragde sammeln |
| 26 | Stufenbruch | 30 | 6800 | 6 | 5 | 3 | 0 | 13 Topasse sammeln |
| 27 | Steinerner Stern | 30 | 6950 | 6 | 5 | 3 | 0 | 14 Amethyste sammeln |
| 28 | Erste Kette | 30 | 7100 | 6 | 5 | 3 | 2 | 14 Bernsteine sammeln |
| 29 | Schlosskammer | 30 | 7250 | 6 | 5 | 3 | 2 | 14 Rubine sammeln |
| 30 | Basaltherz | 30 | 7400 | 6 | 5 | 3 | 2 | 14 Saphire sammeln |
| 31 | Verschlungene Wege | 29 | 7900 | 6 | 5 | 3 | 2 | 15 Smaragde sammeln |
| 32 | Kettenbogen | 29 | 8050 | 6 | 6 | 3 | 2 | 15 Topasse sammeln |
| 33 | Frost und Eisen | 29 | 8200 | 6 | 6 | 3 | 2 | 15 Amethyste sammeln |
| 34 | Die Kreuzung | 29 | 8350 | 6 | 6 | 4 | 2 | 15 Bernsteine sammeln |
| 35 | Versiegelte Ader | 28 | 8500 | 6 | 6 | 4 | 3 | 16 Rubine sammeln |
| 36 | Doppelfund | 28 | 8650 | 6 | 6 | 4 | 3 | 16 Saphire sammeln, 12 Amethyste sammeln |
| 37 | Eiserne Treppe | 28 | 8800 | 6 | 6 | 4 | 3 | 16 Smaragde sammeln, 12 Bernsteine sammeln |
| 38 | Prismenfenster | 28 | 8950 | 6 | 7 | 4 | 3 | 16 Topasse sammeln, 12 Rubine sammeln |
| 39 | Kammer der Farben | 27 | 9100 | 6 | 7 | 4 | 3 | 17 Amethyste sammeln, 12 Saphire sammeln |
| 40 | Das letzte Schloss | 27 | 9250 | 6 | 7 | 4 | 3 | 17 Bernsteine sammeln, 12 Smaragde sammeln |
| 41 | Dunkler Kristall | 27 | 9750 | 6 | 7 | 4 | 3 | 17 Rubine sammeln, 12 Topasse sammeln |
| 42 | Splitterlabyrinth | 27 | 9900 | 6 | 7 | 5 | 4 | 17 Saphire sammeln, 13 Amethyste sammeln |
| 43 | Glutkammer | 26 | 10050 | 6 | 7 | 5 | 4 | 18 Smaragde sammeln, 13 Bernsteine sammeln |
| 44 | Eisiger Abgrund | 26 | 10200 | 6 | 8 | 5 | 4 | 18 Topasse sammeln, 13 Rubine sammeln |
| 45 | Drei Prüfungen | 26 | 10350 | 6 | 8 | 5 | 4 | 18 Amethyste sammeln, 13 Saphire sammeln |
| 46 | Prismenspirale | 26 | 10500 | 6 | 8 | 5 | 4 | 18 Bernsteine sammeln, 13 Smaragde sammeln |
| 47 | Sternenbruch | 25 | 10650 | 6 | 8 | 5 | 4 | 19 Rubine sammeln, 13 Topasse sammeln |
| 48 | Herz der Tiefe | 25 | 10800 | 6 | 8 | 5 | 4 | 19 Saphire sammeln, 14 Amethyste sammeln |
| 49 | Die letzte Ader | 25 | 10950 | 6 | 8 | 5 | 5 | 19 Smaragde sammeln, 14 Bernsteine sammeln |
| 50 | Krone der Kristalle | 25 | 11100 | 6 | 9 | 6 | 5 | 20 Topasse sammeln, 14 Rubine sammeln |

## Verifikation

Automatisierte Tests prüfen alle 50 Startfelder, streng steigende Punktziele, nicht steigende Zugbudgets, feste Hindernisse, Spezialeffekte und Zielzählung. Für jedes der 50 Levels liegt unter fixtures/solutions.json eine vollständige gewinnende Zugfolge innerhalb seines Budgets vor; alle werden durch dieselbe produktive Engine abgespielt. Dies ist ein Lösbarkeitsnachweis für die festgelegten Startfelder, keine Behauptung, dass ein menschlicher Spieler jeden Versuch gewinnt.

Zusätzlich wurden Level 1 und Level 50 im Browser bis zum Sieg gespielt. Level 2 wurde nach Level 1 freigeschaltet. Nach dem Finale wurde kein Level 51 angeboten. Die neue Spielansicht wurde bei 390 Pixel Breite ohne Seitenüberlauf geprüft.
