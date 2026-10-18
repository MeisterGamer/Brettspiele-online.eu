# FamPlay Atelier

Eigene Spielgrafiken in `public/assets/atelier/`. Alle Dateien werden lokal ausgeliefert; die Spiele benötigen dafür keine externen Bilddienste.

## Bilder

Mit der integrierten Imagegen-Funktion wurden fünf originale PNG-Bilder erstellt und unverändert ins Projekt kopiert:

| Datei unter `images/` | Verwendung |
| --- | --- |
| `card-back.png` | Illustrierte Kartenrückseite für Rommé, Skip-Bo und FamCards |
| `card-characters.png` | Freigestellte Illustrationen für König, Dame, Bube und Joker; 2 × 2 Bildatlas |
| `chess-pieces.png` | Zwölf freigestellte Schachfiguren; sechs Spalten, Weiß oben und Dunkelblau unten |
| `game-tokens.png` | Vier Ludo-Figuren und vier Dame-Steine; vier Spalten, Figuren oben, Steine unten |
| `game-table.png` | Holzrahmen mit goldenen Ornamenten und petrolfarbener Filzoberfläche |

Die transparenten Bildatlanten werden mit CSS positioniert, ohne zusätzliche Einzeldateien zu laden. In `AtelierPiece.tsx` und `AtelierCard.tsx` bleiben Alternativtexte, Auswahl, Tastaturbedienung und Zugregeln getrennt von der Illustration. Die vier Ludo-Farben besitzen zusätzlich Kreis-, Quadrat-, Dreieck- und Rautensymbole.

## Prompt-Set und Gestaltung

Verwendet wurde der integrierte Bildgenerator, kein API-/CLI-Fallback. Motivvorgaben der fünf Generierungen:

1. **Kartenrücken:** Hochformat 2:3, tatsächliches flaches Kartenbild ohne Produkt-Mockup. Symmetrische originale Art-Nouveau-Ranken in Gold, Petrol und Nachtblau, elfenbeinfarbene Kompassblume in einer Raute, fein gravierte Oberfläche und doppelter Ornamentrand. Keine Schrift, Marken oder Wasserzeichen.
2. **Schachfiguren:** Transparenter 6 × 2 Atlas mit quadratischen Zellen. Oben König, Dame, Turm, Läufer, Springer und Bauer in Elfenbein, unten dieselbe Reihenfolge in Nachtblau. Aufrechte Vorderansicht, geschnitztes Holz, feine Goldeinlagen, erkennbare Staunton-Silhouetten und getrennte Figuren.
3. **Spielbrettoberfläche:** Quadratische, streng senkrechte Draufsicht. Dunkler Walnussholzrahmen mit goldenen botanischen Eckornamenten, durchgehende petrolfarbene Filzeinlage und dezente Kompassprägung. Keine Spielfelder, Figuren oder Beschriftungen; mathematisch korrekte Felder werden durch die Spieloberfläche darübergelegt.
4. **Spielsteine:** Transparenter 4 × 2 Atlas. Oben rote, blaue, grüne und gelbe Holzfiguren mit unterschiedlichen elfenbeinfarbenen Symbolen. Unten roter und dunkelblauer Dame-Stein sowie beide Farben mit goldener Krone. Gedrechselte Formen, Holzmaserung und goldene Ränder.
5. **Kartencharaktere:** Transparenter 2 × 2 Atlas mit freundlichem König, Dame, jungem Buben und verspieltem Hofnarren. Aufwendige märchenhafte Miniaturillustrationen, bestickte Kleidung, Kronen und kleine Requisiten in Nachtblau, Petrol, Elfenbein und Gold. Keine Kartenrahmen, Zahlen oder Schrift.

## Ergänzende Grafiken

151 eigene SVG-Dateien liefern klare Zahlen und Kartenfarben, vier französische Kartenfarben mit 52 Werten plus Joker, Aktionskarten, Zahlenkarten, alternative Figuren und präzise 8 × 8 Bretter. Die Kartenwerte bleiben dadurch auch in kleiner Darstellung lesbar. `scripts/generate_game_assets.py` erzeugt diese Dateien reproduzierbar und aktualisiert das Manifest, ohne die PNG-Bilder zu verändern.

Die gemeinsame Brettoberfläche wird in Schach, Dame, Ludo, FamCards und den weiteren Spielen mit den entsprechenden Tischhintergründen verwendet. Rommé und Skip-Bo verwenden die neuen Kartenrenderer. Bestehende individuelle Catan-, Monopoly-, Mahjong- und Diamond-Blast-Illustrationen bleiben zusätzlich erhalten.

## Offline und Prüfung

Der Service Worker nimmt die SVG- und PNG-Dateien in den Offline-Cache auf. Das Dateilimit beträgt 4 MiB, damit auch die illustrierten PNG-Bilder vollständig gecacht werden. Die fünf PNG-Dateien belegen zusammen etwa 11 MiB; sie werden zwischen den Spielen wiederverwendet.

Alle Manifestdateien wurden auf Existenz, die SVG-Dateien auf gültiges XML und die PNG-Dateien auf gültige Header und Cachegröße geprüft. Schach- und Dame-Züge sowie die sechs betroffenen Figuren-/Kartenspiele wurden im Browser geprüft, einschließlich einer 390 Pixel breiten Ansicht.
