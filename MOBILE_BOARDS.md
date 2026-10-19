# Größere Bretter und Handybedienung

Stand: 19.10.2026.

- Der Spielbereich erhält auf Handys fast die gesamte Breite und auf größeren Bildschirmen bis zu 1600 Pixel. Die alten Begrenzungen auf 384/448 Pixel sind bei den eigentlichen Brettern entfernt.
- Schach, Dame, Ludo, Vier gewinnt, Memory, Käsekästchen, Tic Tac Toe, Catan, Monopoly und die beiden Schiffe-versenken-Raster besitzen eigene Brettgrößen-Regler. Vergrößern betrifft das Brett, nicht die gesamte Benutzeroberfläche. Große Flächen lassen sich im eigenen Bereich verschieben; „Einpassen“ zeigt die Übersicht. Partie und Züge bleiben erhalten.
- Ludo, Monopoly, Catan und die Radar-Raster starten mit größeren Feldern statt einer unlesbar verkleinerten Gesamtansicht. Auf sehr schmalen Displays gilt das auch für Schach und Dame. Die gesamte Seite wird dabei nicht horizontal verschoben.
- Mahjong startet mit großen Steinen; die Gesamtübersicht bleibt über den vorhandenen Umschalter erreichbar.
- Käsekästchen verwendet ein responsives Raster. Alle 24 Linien haben mindestens 44 × 44 Pixel große Trefferflächen und eindeutige Beschriftungen für Tastatur/Screenreader.
- Karten sind größer. Rommé-Karten überdecken sich in der eigenen Hand nicht mehr; Kartenhände scrollen innerhalb ihrer eigenen Leiste. Skip-Bo-Handkarten verbreitern die Seite nicht mehr.
- Diamond Blast nutzt ein größeres Brett mit schmaleren Innenrändern. Memory, Schach, Dame, Ludo, Vier gewinnt und Tic Tac Toe erhalten ebenfalls mehr Fläche.
- Auf Handys stehen Vollbild, Optionen und neue Partie kompakt oben. Tipps und KI-Stärke sind unter „Optionen“ erreichbar. Spielerleisten und Mahjong-Aufbauwahl brechen passend um. Bei Catan steht das Brett auf kleinen Bildschirmen vor den längeren Seitenleisten.

## Prüfung

32 Browserprüfungen: alle 16 tatsächlichen Spielkomponenten bei jeweils 320 und 390 CSS-Pixeln Breite, ohne horizontalen Überlauf des Spielrahmens. Beabsichtigte Brett- und Karten-Scrollbereiche bleiben innerhalb ihres Rahmens.

Zusätzlich: Schachbrett auf Desktop 960 Pixel breit, mit Vergrößerung 1200 Pixel. Ein ausgeführter Zug blieb beim Vergrößern/Einpassen erhalten. Tastaturverschiebung des Bretts wurde gemessen. Bei Käsekästchen wurden vier Linien gesetzt, ein Kästchen geschlossen und 44-Pixel-Trefferflächen bestätigt.

Messungen: `artifacts/mobile-bretter-pruefung.json`. Handyaufnahme: `artifacts/grosse-bretter-handy.png`. Die Ansichten wurden im Browser geprüft, nicht auf jedem physischen Handy-Modell.
