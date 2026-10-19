# Vollbild für alle 16 Spiele

Der gemeinsame Spielrahmen bietet immer „Vollbild“ und „Vollbild beenden“, auch auf Mobilgeräten und in eingebetteten Browsern. Die native Fullscreen-API wird nach Möglichkeit verwendet. Fehlt sie oder wird die Anfrage abgewiesen, füllt derselbe Spielrahmen den verfügbaren Browserbereich per CSS aus. Browserleisten können bei diesem Ersatzmodus sichtbar bleiben; eine installierte PWA nutzt ihren eigenen Anzeigemodus.

Der Spielbereich bleibt beim Umschalten gemountet: Partie, Züge, Auswahl und laufende Timer werden nicht zurückgesetzt. Die Ansicht nutzt dynamische Viewport-Höhen und berücksichtigt Displayaussparungen. Die Vollbildleiste bleibt erreichbar; große Bretter lassen sich innerhalb des Spielbereichs scrollen. Die Hintergrundseite ist gesperrt. Button, ESC und ein natives Verlassen des Browser-Vollbilds stellen die normale Ansicht wieder her. Die vorherige Scrollposition und der Fokus werden wiederhergestellt; die Tab-Taste bleibt während des Vollbilds im Spiel.

Browserprüfung am 18.10.2026:

- Alle 16 tatsächlichen Spielkomponenten bei 390 × 844 CSS-Pixeln: Vollbild öffnen/schließen, vollständige Viewport-Abdeckung und Erhalt des Zustands eines mitgemounteten Testelements.
- Schach: ausgeführter Zug bleibt beim Öffnen, Drehen auf 844 × 390 und Schließen erhalten.
- Fehlende sowie absichtlich abgewiesene native Fullscreen-API: CSS-Vollbild funktioniert.
- ESC schließt; Fokus bleibt bei Tastaturbedienung im Spiel.
- Nachweis: `artifacts/vollbild-handy.png`; Messprotokoll: `artifacts/vollbild-pruefung.json`.

Die Prüfung erfolgte mit mobilen Browsergrößen; sie ersetzt keinen Hardwaretest auf jedem iPhone-/Android-Modell. Alle Spiele verwenden denselben Rahmen in `GameArena.tsx` und denselben Hook `useGameFullscreen.ts`.
