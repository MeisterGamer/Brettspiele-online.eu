# Spielgrafiken und passende Kartensets

## Aktuelle Kartensets (Version 2)

Jedes Kartenspiel verwendet eigene Vorderseiten und eine eigene PNG-Rückseite:

| Spiel | Vorderseite | Rueckseite unter `public/assets/atelier/images/` |
| --- | --- | --- |
| Rommé | Klassische weiße französische Spielkarten mit Herz, Karo, Kreuz und Pik; korrekt verteilte Farbsymbole; Bube, Dame und König mit zwölf unterschiedlichen Hofmotiven | `romme-back-v2.png`: bordeauxfarbene Kupferstichornamente und Schwäne |
| Skip-Bo | Deutliche Zahlen 1 bis 12, blau/grün/rote Zahlenbereiche, Zählpunkte und eigener orangefarbener Joker für eine freie Zahl | `sequence-back-v2.png`: blaue Kartenstapel und orangefarbene Aufwärtspfeile |
| FamCards | Rote, blaue, grüne und gelbe Farbkarten; zusätzliche Formkennzeichen; eigene Symbole für Aussetzen, Richtungswechsel, +2, Farbwahl und +4 | `family-back-v2.png`: vierfarbige Bänder auf dunklem Grund |

Die 120 Vorderseiten liegen in `romme-v2/`, `sequence-v2/` und `family-v2/`. `romme-courts-v2.png` enthält zwölf eigenständige Illustrationen in vier Spalten (Herz, Karo, Kreuz, Pik) und drei Zeilen (König, Dame, Bube). Der Rommé-Renderer wählt jede Illustration ausdrücklich passend zu Kartenfarbe und Rang. Zahlen- und Aktionskarten erhalten keine Hofmotive.

Die vier neuen PNG-Bilder wurden mit dem integrierten Imagegen-Werkzeug erzeugt und unverändert ins Projekt kopiert. Die vollständigen verwendeten Prompts stehen in `public/assets/atelier/card-prompts-v2.json`. Dafür wurde kein API-/CLI-Fallback verwendet. Die genaue Druckgrafik mit Zahlen und Symbolen wird reproduzierbar durch `scripts/generate_card_sets.py` erstellt. Die beiden Kartenspiele mit Zahlen verwenden keine Rommé-Farbsymbole oder Hofkarten.

## Weitere vorhandene Bilder

`chess-pieces.png` enthält zwölf freigestellte Schachfiguren, `game-tokens.png` vier Ludo-Figuren und vier Dame-Steine. `game-table.png` liefert die Holz-Filz-Oberfläche. Diese Bilder und ihre Einbindungen bleiben erhalten. Der separate Joker aus `card-characters.png` wird weiterhin für die Rommé-Jokerkarte verwendet.

Die erste Kartenfassung bleibt als Quelldatei erhalten, wird aber nicht mehr von den drei Kartenspielen verwendet. Ihre alten Vorderseiten und die zuvor gemeinsame Rückseite werden nicht mehr in den Offline-Cache aufgenommen. Alle aktuellen Dateien werden lokal ausgeliefert und ohne externe Bilddienste verwendet.

## Erzeugung und Prüfung

- `python scripts/generate_card_sets.py`: 120 aktuelle Vorderseiten und Asset-Manifest erzeugen; PNG-Bilder bleiben unverändert.
- `python scripts/generate_game_assets.py`: ergänzende ursprüngliche SVG-Grafiken neu erzeugen; aktuelle Karten bleiben erhalten.
- `npm test`: prüft zusätzlich drei unterschiedliche PNG-Rückseiten anhand ihres Dateiinhalts, sämtliche 120 Vorderseiten, korrekte Anzahl der Rommé-Farbsymbole und zwölf verschiedene Hofmotiv-Zuordnungen.

Die drei Kartenspiele wurden mit ihren tatsächlich geladenen Bilddateien im Browser geprüft, einschließlich 390 Pixel breiter Darstellung. Rommé-Kartenziehen wurde interaktiv getestet. Ein visueller Vergleich liegt in `artifacts/kartensets-v2.png`.

## Diamond Blast

Diamond Blast verwendet eigene, getrennte PNG-Bilder unter `public/assets/diamond-blast/`: `gems.png` für sechs unterschiedlich geformte Kristalle, `objects.png` für Spezialsteine und Hindernisse sowie `vault.png` für das Kristallhöhlen-Brett. Diese Bilder werden ausschließlich für Diamond Blast eingesetzt. Die vollständigen Imagegen-Prompts stehen in `prompts.json`, Einbindung und Leveltabelle in `DIAMOND_BLAST.md`.
