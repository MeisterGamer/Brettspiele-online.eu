import React, { useState } from 'react';
import { GameEngineType } from '../../types';
import { sound } from '../../services/sound';
import {
  X,
  BookOpen,
  MousePointerClick,
  Sparkles,
  Trophy,
  CheckCircle2,
  ChevronRight,
  Shield,
  Zap,
  Info,
  Swords,
  Layers,
  HelpCircle,
  Eye,
  RotateCcw
} from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine?: GameEngineType;
  gameTitle?: string;
}

interface GameEngineGuide {
  engine: GameEngineType;
  title: string;
  tagline: string;
  category: string;
  players: string;
  duration: string;
  minAge: string;
  difficulty: string;
  objective: string;
  quickSteps: { step: number; title: string; desc: string; icon: string }[];
  boardControls: { label: string; action: string; keyHint?: string }[];
  specialRules: { title: string; desc: string }[];
  proTips: string[];
  visualPreviewType: 'chess' | 'connect-four' | 'ludo' | 'fam-cards' | 'checkers' | 'battleship' | 'yatzy' | 'memory-match' | 'dots-boxes' | 'tictactoe' | 'diamond-blast';
}

const ENGINE_GUIDES: Record<string, GameEngineGuide> = {
  'ludo': {
    engine: 'ludo',
    title: 'Mensch ärgere Dich nicht',
    tagline: 'Der beliebteste deutsche Brettspielklassiker für die ganze Familie',
    category: 'Brettspiel · Familie',
    players: '2–4 Spieler',
    duration: '15–25 Min',
    minAge: 'Ab 5 Jahren',
    difficulty: 'Einfach',
    objective: 'Bringe als erster Spieler alle 4 eigenen Spielfiguren einmal komplett um den Parcours sicher ins farbgleiche Zielfeld.',
    quickSteps: [
      { step: 1, title: 'Würfeln', desc: 'Klicke auf den zentralen Holzwürfel oder die Schaltfläche "Würfeln", wenn du am Zug bist.', icon: '🎲' },
      { step: 2, title: 'Die magische 6', desc: 'Bei einer 6 holst du eine Figur aus dem Hof aufs Startfeld – und darfst sofort noch einmal würfeln!', icon: '✨' },
      { step: 3, title: 'Figur wählen', desc: 'Klicke auf eine deiner blinkend hervorgehobenen Spielfiguren, um sie um die gewürfelte Augenzahl vorzurücken.', icon: '♟️' },
      { step: 4, title: 'Schlagen & Siegen', desc: 'Landest du auf einem gegnerischen Feld, schickst du die Figur gnadenlos zurück in ihren Vorhof!', icon: '🏆' },
    ],
    boardControls: [
      { label: 'Würfelklick', action: 'Löst die realistische Roll-Physik aus und bestimmt deine Schrittweite.' },
      { label: 'Spielfigur anklicken', action: 'Zieht die gewünschte Figur vorwärts. Gültige Figuren leuchten bei Zugrecht auf.' },
      { label: 'Zielfelder 100–103', action: 'Figuren müssen mit passender Augenzahl in die 4 Zielfächer gezogen werden.' },
    ],
    specialRules: [
      { title: 'Herauszieh-Pflicht bei 6', desc: 'Hast du noch Figuren im Hof, musst du bei einer 6 eine Figur auf das Startfeld setzen.' },
      { title: 'Zusatzwurf bei 6', desc: 'Jede gewürfelte 6 schenkt dir sofort einen weiteren Würfelwurf.' },
      { title: 'Schlagzwang auf der Strecke', desc: 'Gegnerische Steine können geschlagen werden, eigene Figuren blockieren sich nie.' },
    ],
    proTips: [
      'Bringe zügig mehrere Figuren ins Spiel, um flexibel auf Würfelergebnisse reagieren zu können.',
      'Achte auf gegnerische Figuren, die 1 bis 6 Felder hinter dir lauern.',
      'Gegen die KI: Der Computer zieht bei Bedenkzeit selbstständig, wenn du nicht am Zug bist.',
    ],
    visualPreviewType: 'ludo',
  },
  'chess': {
    engine: 'chess',
    title: 'Klassisches Schach',
    tagline: 'Königliches Strategiespiel mit meisterhaften Staunton-Holzfiguren',
    category: 'Strategie · Meister',
    players: '2 Spieler',
    duration: '15–30 Min',
    minAge: 'Ab 8 Jahren',
    difficulty: 'Strategisch',
    objective: 'Setze den gegnerischen König schachmatt oder schlage ihn durch überlegene Taktik.',
    quickSteps: [
      { step: 1, title: 'Figur auswählen', desc: 'Klicke auf eine deiner Figuren (Weiß oder Schwarz). Sie wird golden umrahmt.', icon: '♟️' },
      { step: 2, title: 'Zielfeld anvisieren', desc: 'Grüne Punkte markieren alle regelkonformen Zugfelder. Rote Ringe signalisieren Schläge.', icon: '🎯' },
      { step: 3, title: 'Zug vollenden', desc: 'Klicke auf das markierte Zielfeld. Der Zug wird ausgeführt und die Runde wechselt.', icon: '⚡' },
      { step: 4, title: 'Damenumwandlung', desc: 'Erreicht dein Bauer die gegnerische Grundlinie, verwandelt er sich direkt in eine mächtige Dame!', icon: '👑' },
    ],
    boardControls: [
      { label: 'Figur anklicken', action: 'Aktiviert die Figur und blendet Zugindikatoren ein. Erneuter Klick deselektiert.' },
      { label: 'Grüner Punkt', action: 'Klickbares, freies Feld für einen legalen Zug.' },
      { label: 'Roter Zielring', action: 'Gegnerische Figur kann geschlagen und vom Brett genommen werden.' },
    ],
    specialRules: [
      { title: 'Bauernerstzug', desc: 'Bauern können von ihrer Startreihe wahlweise 1 oder 2 Felder vorrücken.' },
      { title: 'Bauern schlagen diagonal', desc: 'Bauern bewegen sich gerade vorwärts, schlagen aber nur ein Feld schräg.' },
      { title: 'Damenumwandlung (Promotion)', desc: 'Erreicht ein Bauer Reihe 8 (bzw. Reihe 1 für Schwarz), wird er sofort zur Dame.' },
    ],
    proTips: [
      'Kontrolliere frühzeitig die 4 zentralen Felder (D4, E4, D5, E5) mit deinen Bauern und Springern.',
      'Bringe Springer und Läufer früh ins Spiel, bevor du mit der Dame angreifst.',
      'Schütze deinen König und plane immer 1–2 Züge des Gegners voraus.',
    ],
    visualPreviewType: 'chess',
  },
  'connect-four': {
    engine: 'connect-four',
    title: 'Vier Gewinnt',
    tagline: 'Das vertikale Taktik-Duell mit physikalischen Arcade-Chips',
    category: 'Arcade · Taktik',
    players: '2 Spieler',
    duration: '5–10 Min',
    minAge: 'Ab 6 Jahren',
    difficulty: 'Einfach',
    objective: 'Bilde als Erster eine ununterbrochene Viererreihe aus deinen Chips – waagerecht, senkrecht oder diagonal.',
    quickSteps: [
      { step: 1, title: 'Spalte wählen', desc: 'Bewege den Cursor oder tippe über die 7 Spalten. Ein Pfeil zeigt die Einwurfposition.', icon: '👇' },
      { step: 2, title: 'Chip einwerfen', desc: 'Ein Klick wirft deinen Chip ein. Er gleitet physikalisch auf das unterste freie Fach herab.', icon: '🔴' },
      { step: 3, title: 'Linien kombinieren', desc: 'Achte auf waagerechte, senkrechte oder schräge Viererreihen.', icon: '📐' },
      { step: 4, title: 'Doppelfallen bauen', desc: 'Erzeuge sogenannte Gabeln (Zweifach-Drohungen), die der Gegner nicht gleichzeitig blockieren kann.', icon: '⭐' },
    ],
    boardControls: [
      { label: 'Spalten-Hover / Tippen', action: 'Zeigt den schwebenden Vorschau-Chip über dem Einwurfschlitz.' },
      { label: 'Klick in die Spalte', action: 'Lässt den Chip mit Klack-Sound ins Raster fallen.' },
      { label: 'Volle Spalten', action: 'Sobald eine Spalte 6 Chips enthält, ist sie gesperrt.' },
    ],
    specialRules: [
      { title: 'Schwerkraft-Prinzip', desc: 'Chips können nicht frei platziert werden, sondern fallen immer auf den tiefsten freien Platz.' },
      { title: 'Vierer-Diagonale', desc: 'Diagonale Linien werden von vielen Spielern übersehen – nutze dies zu deinem Vorteil!' },
      { title: 'Patt / Unentschieden', desc: 'Sind alle 42 Fächer gefüllt ohne 4er-Reihe, endet die Partie unentschieden.' },
    ],
    proTips: [
      'Die mittlere Spalte (Spalte 4) ist strategisch am wertvollsten – sichere sie dir früh!',
      'Blockiere sofort, wenn der Gegner 3 Chips in einer offenen Reihe hat.',
      'Baue horizontale Dreierreihen auf, die an beiden Enden noch frei sind.',
    ],
    visualPreviewType: 'connect-four',
  },
  'fam-cards': {
    engine: 'fam-cards',
    title: 'FamCards (Uno-Familie)',
    tagline: 'Das rasante Kartenspiel mit Farbwahl, Aussetzen und Aktionskarten',
    category: 'Kartenspiel · Party',
    players: '2–4 Spieler',
    duration: '10–15 Min',
    minAge: 'Ab 6 Jahren',
    difficulty: 'Einfach',
    objective: 'Werde als erster Spieler alle Karten auf deiner Hand los, indem du passende Farben oder Ziffern ablegst.',
    quickSteps: [
      { step: 1, title: 'Ablagestapel prüfen', desc: 'Sieh dir die oberste Karte und die aktuelle Farbe in der Mitte des Tisches an.', icon: '🃏' },
      { step: 2, title: 'Karte legen', desc: 'Klicke auf eine Karte aus deiner Hand, die in Farbe oder Zahl/Symbol übereinstimmt.', icon: '🖐️' },
      { step: 3, title: 'Ziehstapel nutzen', desc: 'Hast du keine passende Karte? Klicke auf den Ziehstapel links, um 1 Karte zu ziehen.', icon: '📥' },
      { step: 4, title: 'UNO rufen!', desc: 'Sobald du nur noch 1 Karte auf der Hand hast, klicke blitzschnell auf den "UNO!"-Button!', icon: '🔥' },
    ],
    boardControls: [
      { label: 'Handkarten-Klick', action: 'Legt die gewählte Karte auf den Ablagestapel, wenn sie regelkonform ist.' },
      { label: 'Ziehstapel (Deck)', action: 'Nimmt eine verdeckte Karte auf die Hand.' },
      { label: 'Farbrad bei Wild / +4', action: 'Öffnet 4 Farbfelder (Rot, Blau, Grün, Gelb) zur freien Farbauswahl.' },
      { label: 'UNO-Button', action: 'Meldet den letzten Spielzug vor dem Gesamtsieg an.' },
    ],
    specialRules: [
      { title: '+2 Karten', desc: 'Der nächste Spieler muss 2 Strafkarten ziehen und wird übersprungen.' },
      { title: 'Aussetzen (Skip)', desc: 'Überspringt den Zug des nachfolgenden Mitspielers komplett.' },
      { title: '+4 Farbwahl', desc: 'Bestimme die Wunschfarbe und zwinge den Gegner, 4 Karten vom Stapel zu ziehen.' },
    ],
    proTips: [
      'Hebe dir Farbwahl- und +4-Karten für brenzlige Spielsituationen auf.',
      'Behalte im Blick, wie viele Karten der Gegner noch auf der Hand hält.',
      'Wechsle die Spielfarbe geschickt auf Farben, die der Gegner bisher nicht bedienen konnte.',
    ],
    visualPreviewType: 'fam-cards',
  },
  'checkers': {
    engine: 'checkers',
    title: 'Klassische Dame',
    tagline: 'Traditionelles Brettspiel mit diagonalen Zügen und Königskrönung',
    category: 'Brettspiel · Strategie',
    players: '2 Spieler',
    duration: '10–20 Min',
    minAge: 'Ab 6 Jahren',
    difficulty: 'Mittel',
    objective: 'Schlage alle gegnerischen Steine oder blockiere sie so, dass kein weiterer Zug möglich ist.',
    quickSteps: [
      { step: 1, title: 'Stein wählen', desc: 'Klicke auf einen deiner Steine (Rot oder Schwarz). Grüne Ringe zeigen freie Felder an.', icon: '⚪' },
      { step: 2, title: 'Diagonal ziehen', desc: 'Einfache Steine ziehen stets 1 Feld schräg vorwärts auf dunklen Feldern.', icon: '↗️' },
      { step: 3, title: 'Sprung & Schlagen', desc: 'Überspringe gegnerische Steine auf ein freies Folgefeld, um sie zu schlagen.', icon: '💥' },
      { step: 4, title: 'Dame-Krönung', desc: 'Erreicht dein Stein die gegnerische Grundlinie, wird er zur Dame gekrönt und zieht vor & zurück!', icon: '👑' },
    ],
    boardControls: [
      { label: 'Stein anklicken', action: 'Wählt die Spielfigur aus und visualisiert erlaubte Zielfelder.' },
      { label: 'Zielfeld anklicken', action: 'Führt den Zug oder Sprungschlag aus.' },
      { label: 'Gekrönte Dame', action: 'Erkennbar an der goldenen Krone; bewegt sich diagonal in alle 4 Richtungen.' },
    ],
    specialRules: [
      { title: 'Diagonale Bindung', desc: 'Gespielt wird ausschließlich auf den dunklen Feldern des 8x8-Schachbretts.' },
      { title: 'Sprungschläge bevorzugen', desc: 'Steht ein gegnerischer Stein schräg vor dir und das Feld dahinter ist frei, springst du darüber.' },
      { title: 'Dame-Freiheit', desc: 'Die gekrönte Dame kann sich vorwärts und rückwärts diagonal über das Brett bewegen.' },
    ],
    proTips: [
      'Halte deine hintere Grundreihe möglichst lange geschlossen, damit der Gegner keine Damen krönen kann.',
      'Ziehe bevorzugt an den Spielfeldrändern entlang, da Steine am Rand nicht geschlagen werden können.',
      'Opfere gelegentlich einen Stein, um danach im Gegenzug zwei gegnerische Steine zu schlagen.',
    ],
    visualPreviewType: 'checkers',
  },
  'battleship': {
    engine: 'battleship',
    title: 'Flottenmanöver (Schiffe versenken)',
    tagline: 'Maritimes Taktik-Radar mit Torpedos, Trefferwarnungen und Flottenschilden',
    category: 'Strategie · Taktik',
    players: '2 Spieler',
    duration: '10–15 Min',
    minAge: 'Ab 7 Jahren',
    difficulty: 'Mittel',
    objective: 'Entdecke und versenke alle 5 Schiffe der gegnerischen Flotte vor deinen eigenen Schiffen.',
    quickSteps: [
      { step: 1, title: 'Gefechtsradar anvisieren', desc: 'Nutze das rechte Radar-Raster für deinen Angriff auf die feindlichen Gewässer.', icon: '🎯' },
      { step: 2, title: 'Torpedo abfeuern', desc: 'Klicke auf eine Koordinate (z.B. B4 oder F7). Die Rakete schlägt mit Soundeffekt ein.', icon: '🚀' },
      { step: 3, title: 'Treffer analysieren', desc: 'Feuer 🔥 signalisiert einen Schiffstreffer. Wellen 🌊 bedeuten Wasser/Fehlschuss.', icon: '🔥' },
      { step: 4, title: 'Schiff versenken', desc: 'Feuere nach einem Treffer auf die Nachbarfelder, bis das Schiff komplett zerstört ist!', icon: '💥' },
    ],
    boardControls: [
      { label: 'Heimat-Radar (links)', action: 'Zeigt deine eigene Flotte und feindliche Einschlagsorte an.' },
      { label: 'Gefechts-Radar (rechts)', action: 'Interaktive Zielscheibe zum Abfeuern deiner Torpedos auf den Gegner.' },
      { label: 'Schiffsstatus-Leiste', action: 'Visualisiert die 5 Schiffsklassen (Schlachtschiff, Kreuzer, Zerstörer, U-Boot, Boot).' },
    ],
    specialRules: [
      { title: '5 Schiffsklassen', desc: 'Schlachtschiff (4 Felder), Kreuzer (3), Zerstörer (3), U-Boot (2), Patrouillenboot (2).' },
      { title: 'Streng geheim', desc: 'Die Position der Schiffe ist für den Gegner unsichtbar bis zum ersten Einschlag.' },
      { title: 'Abwechselndes Feuern', desc: 'Nach jedem Schuss wechselt das Feuerrecht zum Gegenspieler oder zur KI.' },
    ],
    proTips: [
      'Feuere zu Beginn in einem Schachbrett-Muster (jedes 2. Feld), um Schiffe am schnellsten aufzuspüren.',
      'Sobald du einen Treffer landest, suche sofort kreuzförmig nach den restlichen Schiffssegmenten.',
      'Große Schiffe (4 Felder) verraten sich schneller als das wendige Patrouillenboot.',
    ],
    visualPreviewType: 'battleship',
  },
  'yatzy': {
    engine: 'yatzy',
    title: 'Kniffel / Yatzy',
    tagline: 'Das legendäre Würfel-Pokerspiel mit Elfenbein-3D-Würfeln und Wertungsblock',
    category: 'Würfelspiel · Glück & Taktik',
    players: '1–4 Spieler',
    duration: '10–20 Min',
    minAge: 'Ab 6 Jahren',
    difficulty: 'Einfach',
    objective: 'Erziele über 13 Runden die höchste Gesamtpunktzahl durch geschicktes Kombinieren von Paschs, Straßen und Kniffel.',
    quickSteps: [
      { step: 1, title: 'Würfeln', desc: 'Klicke auf den Würfeln-Knopf. Die 5 Elfenbeinwürfel rollen mit 3D-Animation.', icon: '🎲' },
      { step: 2, title: 'Würfel halten', desc: 'Klicke auf gute Würfel, um sie einzufrieren (goldene Umrandung). Sie rollen beim nächsten Wurf nicht mit.', icon: '🔒' },
      { step: 3, title: 'Bis zu 3 Versuche', desc: 'Du hast pro Spielrunde bis zu 3 Würfe Zeit, um dein Wunschergebnis zu formen.', icon: '🔄' },
      { step: 4, title: 'Feld eintragen', desc: 'Wähle ein freies Feld auf dem Wertungsblock rechts aus, um deine Punkte einzutragen.', icon: '📝' },
    ],
    boardControls: [
      { label: 'Würfelklick', action: 'Hält den Würfel fest bzw. gibt ihn wieder für den nächsten Wurf frei.' },
      { label: 'Würfeln-Button', action: 'Startet den Wurf für alle nicht-gehaltenen Würfel (3 Versuche pro Runde).' },
      { label: 'Kategorie in Tabelle', action: 'Trägt das aktuelle Würfelergebnis fest in den Spielblock ein.' },
    ],
    specialRules: [
      { title: 'Oberer Bonus (+35 Punkte)', desc: 'Erreichst du im oberen Teil (Einer bis Sechser) mindestens 63 Punkte, erhältst du 35 Bonuspunkte!' },
      { title: 'Kniffel (50 Punkte)', desc: '5 identische Würfel ergeben einen Kniffel – die höchste Punktzahl im Spiel.' },
      { title: 'Streichen erlaubt', desc: 'Passt kein Wurf, kannst du eine ungeliebte Kategorie mit 0 Punkten streichen.' },
    ],
    proTips: [
      'Versuche stets, im oberen Block im Schnitt 3 gleiche Zahlen zu erzielen, um den 35er-Bonus zu sichern.',
      'Kleine Straße (30 Punkte) benötigt 4 aufeinanderfolgende Zahlen (1-2-3-4, 2-3-4-5 oder 3-4-5-6).',
      'Nutze die "Chance" als Rettungsanker für verunglückte Würfe mit vielen hohen Augen.',
    ],
    visualPreviewType: 'yatzy',
  },
  'memory-match': {
    engine: 'memory-match',
    title: 'Tier-Duell (Memory Match)',
    tagline: 'Konzentrations- und Gedächtnisspiel mit liebenswerten Tier-Paaren',
    category: 'Gedächtnis · Kinder & Familie',
    players: '1–2 Spieler',
    duration: '5–10 Min',
    minAge: 'Ab 3 Jahren',
    difficulty: 'Einfach',
    objective: 'Finde durch geschicktes Aufdecken mehr zusammengehörige Tier-Paare als dein Mitspieler oder die KI.',
    quickSteps: [
      { step: 1, title: 'Erste Karte aufdecken', desc: 'Klicke auf eine beliebige verdeckte Karte, um das Tier zu enthüllen.', icon: '🦊' },
      { step: 2, title: 'Zweite Karte wählen', desc: 'Klicke auf eine zweite Karte und versuche, das passende Zwillingstier zu finden.', icon: '🦁' },
      { step: 3, title: 'Treffer = Weiterspielen!', desc: 'Stimmen beide Tiere überein, erhältst du 1 Punkt und darfst sofort noch ein Paar suchen!', icon: '⭐' },
      { step: 4, title: 'Fehlschlag = Zugwechsel', desc: 'Sind die Karten verschieden, drehen sie sich nach kurzer Bedenkzeit um und der Zug wechselt.', icon: '🔄' },
    ],
    boardControls: [
      { label: 'Kartenklick', action: 'Dreht die Karte mit Flip-Animation auf. Bereits gefundene Paare bleiben offen liegen.' },
      { label: '2P Duell / Solo', action: 'Schalte oben zwischen alleinigem Konzentrationstraining und 2-Spieler-Wettkampf um.' },
    ],
    specialRules: [
      { title: 'Bonus-Zug bei Treffer', desc: 'Wer ein Paar findet, behält die Initiative und deckt direkt erneut auf.' },
      { title: 'Gleiche Chancen', desc: 'Beide Spieler sehen die aufgedeckten Karten des Gegners – Aufmerksamkeit zahlt sich aus!' },
      { title: '16 Karten (8 Paare)', desc: 'Kompakte Spieldauer, perfekt für schnelle Runden zwischendurch.' },
    ],
    proTips: [
      'Präge dir die Positionen auch ein, wenn dein Mitspieler oder die KI am Zug ist.',
      'Decke Karten in geordneten Zonen auf (z.B. obere Reihe zuerst), um das Brett besser im Kopf zu kartieren.',
      'Für Kids: Perfekt im Kids-Modus zur Förderung der visuellen Merkfähigkeit geeignet.',
    ],
    visualPreviewType: 'memory-match',
  },
  'dots-boxes': {
    engine: 'dots-boxes',
    title: 'Käsekästchen (Dots and Boxes)',
    tagline: 'Das taktische Gitter-Duell um jeden einzelnen Quadrat-Punkt',
    category: 'Gitterspiel · Taktik',
    players: '2 Spieler',
    duration: '5–10 Min',
    minAge: 'Ab 6 Jahren',
    difficulty: 'Mittel',
    objective: 'Schließe durch das Setzen von Linien mehr 1x1-Kästchen ab als dein Gegner.',
    quickSteps: [
      { step: 1, title: 'Linie anvisieren', desc: 'Fahre über eine der gestrichelten horizontalen oder vertikalen Linien zwischen zwei Punkten.', icon: '✏️' },
      { step: 2, title: 'Klick zum Setzen', desc: 'Ein Klick färbt die Linie dauerhaft in deiner Spielerfarbe ein.', icon: '📍' },
      { step: 3, title: 'Kästchen erobern', desc: 'Wer die 4. und letzte Seite eines Kästchens schließt, erhält den Punkt und die Flagge!', icon: '🟩' },
      { step: 4, title: 'Bonus-Zug nutzen', desc: 'Jedes geschlossene Kästchen schenkt dir sofort einen weiteren Linienzug!', icon: '🎁' },
    ],
    boardControls: [
      { label: 'Horizontale Linien', action: 'Klick auf den Balken zwischen zwei waagerechten Nachbarpunkten.' },
      { label: 'Vertikale Linien', action: 'Klick auf den Balken zwischen zwei senkrechten Nachbarpunkten.' },
      { label: 'Eroberte Quadrate', action: 'Färben sich automatisch in deiner Spielerfarbe mit Avatar-Markierung.' },
    ],
    specialRules: [
      { title: 'Schließ-Zwang zum Weiterspielen', desc: 'Schließt du ein Kästchen, MUSST du sofort eine weitere Linie ziehen.' },
      { title: 'Kettenreaktionen', desc: 'Oft lassen sich in einem einzigen Zug 3, 4 oder mehr Kästchen hintereinander abräumen!' },
      { title: 'Gittergröße 4x4', desc: 'Bietet genau 9 umkämpfte Kästchen für schnelle, intensive Duelle.' },
    ],
    proTips: [
      'Setze niemals die 3. Linie eines Kästchens, wenn du es vermeiden kannst – du schenkst es sonst dem Gegner!',
      'Versuche "Ketten" zu erzwingen, bei denen der Gegner dir eine ganze Reihe Kästchen öffnen muss.',
      'Zähle vor deinem Zug die Linien an allen vier Seiten benachbarter Quadrate ab.',
    ],
    visualPreviewType: 'dots-boxes',
  },
  'tictactoe': {
    engine: 'tictactoe',
    title: 'Tic Tac Toe (Drei gewinnt)',
    tagline: 'Das zeitlose 3x3 Zen-Duell mit Naturstein- & Holz-Design',
    category: 'Logik · Klassiker',
    players: '2 Spieler',
    duration: '2–5 Min',
    minAge: 'Ab 4 Jahren',
    difficulty: 'Einfach',
    objective: 'Setze 3 eigene Symbole (X oder O) in eine waagerechte, senkrechte oder diagonale Reihe.',
    quickSteps: [
      { step: 1, title: 'Feld auswählen', desc: 'Klicke auf ein beliebiges freies Feld im 3x3-Raster.', icon: '⭕' },
      { step: 2, title: 'Symbol platzieren', desc: 'Dein Symbol (Blaues X oder Goldenes O) erscheint mit Soundeffekt.', icon: '❌' },
      { step: 3, title: 'Gegner blockieren', desc: 'Verhindere sofort, dass der Gegenspieler 2 Steine zu einer Dreierreihe ergänzt.', icon: '🛡️' },
      { step: 4, title: 'Dreierreihe vollenden', desc: 'Vollende deine Reihe für den Sieg. Die Gewinnlinie wird mit Laserstrahl hervorgehoben!', icon: '⚡' },
    ],
    boardControls: [
      { label: 'Feldklick', action: 'Platziert dein Symbol und übergibt die Initiative an den Gegner.' },
      { label: 'Themen-Umschalter', action: 'Wähle oben zwischen glatten Flusskieseln oder rustikalem Eichenholz.' },
    ],
    specialRules: [
      { title: 'Startrecht', desc: 'Spieler 1 (X) beginnt die Partie, Spieler 2 (O) zieht als Zweiter.' },
      { title: 'Unentschieden (Patt)', desc: 'Sind alle 9 Felder belegt ohne 3er-Reihe, endet das Duell friedlich unentschieden.' },
      { title: 'Punkteserie', desc: 'Der Rundenzähler oben zählt Siege für X, O und Unentschieden fortlaufend mit.' },
    ],
    proTips: [
      'Das zentrale Mittelfeld ist die stärkste Position – sichere es dir im ersten Zug!',
      'Besetze Ecken, um Doppelbedrohungen (Zwei Gewinnwege auf einmal) aufzubauen.',
      'Gegen die KI: Jeder Fehler wird bestraft – spiele konzentriert und blockiere frühzeitig.',
    ],
    visualPreviewType: 'tictactoe',
  },
  'diamond-blast': {
    engine: 'diamond-blast',
    title: 'Diamond Blast',
    tagline: 'Match-3 Juwelen-Action mit Dynamit, Lasern & Regenbogen-Wipeouts über 100 Levels',
    category: 'Match-3 · Arcade',
    players: '1 Spieler (Arcade)',
    duration: '5–15 Min',
    minAge: 'Ab 5 Jahren',
    difficulty: 'Mittel',
    objective: 'Bringe 3 oder mehr gleiche Diamanten in eine Reihe, sprenge Eis und Felsen und meistere alle 100 Levels!',
    quickSteps: [
      { step: 1, title: 'Tauschen', desc: 'Klicke zwei direkt benachbarte Diamanten an oder wische sie, um sie zu vertauschen.', icon: '💎' },
      { step: 2, title: '3er-Reihe', desc: 'Bilde eine Reihe aus 3 gleichen Kristallen – sie lösen sich auf und neue Edelsteine fallen nach!', icon: '✨' },
      { step: 3, title: 'Spezialsteine', desc: '4er erzeugen Laserblitz-Reihen, T/L-Formen Dynamitbomben, 5er Regenbogen-Hypercubes!', icon: '💥' },
      { step: 4, title: 'Levelziele', desc: 'Erreiche die Zielpunkte, schmelze Eisblöcke und sprenge Felsen innerhalb der verfügbaren Züge.', icon: '🏆' },
    ],
    boardControls: [
      { label: 'Diamant anklicken / Wischen', action: 'Wähle den ersten Diamanten und danach einen Nachbarn zum Tauschen.' },
      { label: 'Tipp-Button (Glühbirne)', action: 'Zeigt bei Bedarf sofort einen gültigen Zug mit goldenem Glühen an.' },
      { label: 'Spezial-Tausch', action: 'Tausche Spezialdiamanten untereinander für gigantische Mega-Explosionen!' },
    ],
    specialRules: [
      { title: 'Dynamit-Bombe (T/L-Form)', desc: 'Explodiert im 3×3-Radius mit Feuerpartikeln und Bildschirmerschütterung.' },
      { title: 'Regenbogen-Diamant (5er)', desc: 'Zerstört beim Tauschen alle Diamanten der gewählten Farbe auf dem ganzen Spielfeld.' },
      { title: 'Mega-Kombos', desc: 'Zwei Bomben = 5×5 Mega-Explosion! Zwei Regenbögen räumen das komplette Feld ab!' },
      { title: 'Automatisches Mischen', desc: 'Gibt es keine gültigen Züge mehr, mischt sich das Brett automatisch neu.' },
    ],
    proTips: [
      'Plane Kettenreaktionen im unteren Bereich des Bretts, damit möglichst viele Steine nachrutschen.',
      'Kombiniere Spezialsteine direkt miteinander – Bombe + Laser erzeugt ein gewaltiges Kreuzfeuer!',
      'Nutze den Zeitmodus für rasante Action: Spezialkombinationen schenken wertvolle Bonussekunden.',
    ],
    visualPreviewType: 'diamond-blast',
  },
};

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  engine = 'ludo',
  gameTitle,
}) => {
  const [selectedEngine, setSelectedEngine] = useState<GameEngineType>(engine);
  const [activeTab, setActiveTab] = useState<'visual' | 'rules' | 'tips'>('visual');

  // Keep selectedEngine synced when opened with a new engine
  React.useEffect(() => {
    if (engine) {
      setSelectedEngine(engine);
    }
  }, [engine]);

  if (!isOpen) return null;

  const guide = ENGINE_GUIDES[selectedEngine] || ENGINE_GUIDES['ludo'];

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  const renderVisualBoardPreview = () => {
    switch (guide.visualPreviewType) {
      case 'chess':
        return (
          <div className="relative p-4 rounded-2xl bg-amber-950/40 border border-amber-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: Schachbrett & Zugmarkierungen
            </div>
            {/* 4x4 mini preview */}
            <div className="grid grid-cols-4 w-52 h-52 rounded-xl overflow-hidden border-2 border-amber-800 shadow-2xl relative">
              {Array.from({ length: 16 }).map((_, idx) => {
                const r = Math.floor(idx / 4);
                const c = idx % 4;
                const isLight = (r + c) % 2 === 0;
                const isSelectedPiece = r === 2 && c === 1;
                const isMoveTarget = (r === 1 && c === 1) || (r === 0 && c === 1);
                const isCaptureTarget = r === 1 && c === 2;

                return (
                  <div
                    key={idx}
                    className={`relative flex items-center justify-center font-bold text-lg select-none transition ${
                      isLight ? 'bg-amber-100 text-amber-950' : 'bg-amber-900 text-amber-100'
                    }`}
                  >
                    {/* Selected Queen */}
                    {isSelectedPiece && (
                      <div className="relative flex items-center justify-center animate-pulse">
                        <span className="text-3xl text-amber-950 drop-shadow">♛</span>
                        <div className="absolute inset-0 ring-4 ring-amber-400 rounded-lg animate-ping opacity-60" />
                      </div>
                    )}

                    {/* Enemy Piece at Capture Target */}
                    {isCaptureTarget && (
                      <div className="relative flex items-center justify-center">
                        <span className="text-2xl text-slate-900">♞</span>
                        <div className="absolute -inset-1 rounded-full border-2 border-rose-500 bg-rose-500/20 animate-pulse flex items-center justify-center">
                          <span className="text-[9px] text-rose-300 font-black">X</span>
                        </div>
                      </div>
                    )}

                    {/* Legal Move Green Dots */}
                    {isMoveTarget && (
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-400/40 animate-pulse shadow-lg" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanatory callouts */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-300 w-full max-w-sm text-center">
              <div className="p-1.5 rounded-xl bg-amber-900/40 border border-amber-600/30 flex flex-col items-center">
                <span className="text-amber-400 font-bold">1. Klick auf Figur</span>
                <span className="text-[10px] text-slate-400">Goldener Fokus</span>
              </div>
              <div className="p-1.5 rounded-xl bg-emerald-950/40 border border-emerald-600/30 flex flex-col items-center">
                <span className="text-emerald-400 font-bold">2. Grüner Punkt</span>
                <span className="text-[10px] text-slate-400">Erlaubter Zug</span>
              </div>
              <div className="p-1.5 rounded-xl bg-rose-950/40 border border-rose-600/30 flex flex-col items-center">
                <span className="text-rose-400 font-bold">3. Roter Ring</span>
                <span className="text-[10px] text-slate-400">Gegner schlagen</span>
              </div>
            </div>
          </div>
        );

      case 'connect-four':
        return (
          <div className="relative p-4 rounded-2xl bg-indigo-950/40 border border-indigo-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: Einwurfspalte & 4er-Linie
            </div>
            {/* 5 columns x 4 rows vertical grid */}
            <div className="w-56 bg-blue-700 p-2.5 rounded-2xl shadow-2xl border-2 border-blue-500 relative">
              {/* Top drop arrow indicator */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-amber-400 font-black text-xs">
                <span>Spalte anklicken</span>
                <span className="text-base">▼</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 20 }).map((_, idx) => {
                  const r = Math.floor(idx / 5);
                  const c = idx % 5;
                  const isWinningLine = r === 3 && (c >= 1 && c <= 4);
                  const isDroppingChip = r === 0 && c === 2;
                  const hasRed = (r === 3 && c === 1) || (r === 3 && c === 2) || (r === 3 && c === 3) || (r === 3 && c === 4);
                  const hasYellow = (r === 2 && c === 0) || (r === 3 && c === 0) || (r === 2 && c === 2);

                  return (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-slate-950/90 shadow-inner flex items-center justify-center relative overflow-hidden"
                    >
                      {hasRed && (
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-tr from-rose-700 to-rose-500 shadow-md ${
                          isWinningLine ? 'ring-2 ring-amber-300 animate-pulse' : ''
                        }`} />
                      )}
                      {hasYellow && !hasRed && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 shadow-md" />
                      )}
                      {isDroppingChip && !hasRed && !hasYellow && (
                        <div className="w-5 h-5 rounded-full border border-dashed border-rose-400 opacity-60 animate-ping" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Spieler 1 (Rot)
              </span>
              <span>vs.</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Spieler 2 / KI (Gelb)
              </span>
            </div>
          </div>
        );

      case 'ludo':
        return (
          <div className="relative p-4 rounded-2xl bg-amber-950/40 border border-amber-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: Würfelwurf, Hof & Zielfeld
            </div>
            <div className="w-56 h-48 bg-slate-900 border-2 border-amber-700/60 rounded-2xl p-3 flex flex-col justify-between shadow-2xl relative">
              {/* Corner Yards */}
              <div className="flex justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/60 p-1 grid grid-cols-2 gap-0.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/60 p-1 grid grid-cols-2 gap-0.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow" />
                </div>
              </div>

              {/* Center Dice */}
              <div className="absolute inset-0 m-auto w-14 h-14 rounded-2xl bg-amber-100 text-slate-950 border-2 border-amber-400 shadow-2xl flex flex-col items-center justify-center animate-pulse">
                <span className="text-2xl font-black">6</span>
                <span className="text-[8px] font-bold text-amber-900 uppercase">Zusatzwurf</span>
              </div>

              {/* Bottom Corners */}
              <div className="flex justify-between w-full">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/60 p-1 grid grid-cols-2 gap-0.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow" />
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow" />
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow" />
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/60 p-1 grid grid-cols-2 gap-0.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-amber-300 mt-2 font-medium">
              Tipp: Klicke bei Zugrecht auf den Würfel, dann auf deine leuchtende Figur!
            </p>
          </div>
        );

      case 'fam-cards':
        return (
          <div className="relative p-4 rounded-2xl bg-rose-950/40 border border-rose-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: Ablage, Bedienen & Farbwahl
            </div>
            <div className="flex items-center gap-3">
              {/* Draw Deck */}
              <div className="w-14 h-20 rounded-xl bg-slate-800 border-2 border-slate-600 shadow-xl flex flex-col items-center justify-center text-center p-1 cursor-pointer hover:border-amber-400 transition">
                <span className="text-xs font-bold text-slate-300">Stapel</span>
                <span className="text-[9px] text-amber-400">Ziehen</span>
              </div>

              {/* Center Discard Card */}
              <div className="w-16 h-24 rounded-xl bg-rose-600 border-2 border-white shadow-2xl flex flex-col items-center justify-between p-1 text-white relative scale-105">
                <span className="text-xs font-black self-start">7</span>
                <span className="text-2xl font-black">7</span>
                <span className="text-xs font-black self-end">7</span>
              </div>

              {/* Color Wheel preview */}
              <div className="w-16 h-16 rounded-full border-2 border-slate-700 overflow-hidden grid grid-cols-2 shadow-lg">
                <div className="bg-rose-600" />
                <div className="bg-blue-600" />
                <div className="bg-amber-400" />
                <div className="bg-emerald-600" />
              </div>
            </div>

            <p className="text-[11px] text-slate-300 mt-2">
              Lege gleiche Farbe <strong className="text-rose-400">(Rot)</strong> oder Zahl <strong className="text-white">(7)</strong> ab!
            </p>
          </div>
        );

      case 'checkers':
        return (
          <div className="relative p-4 rounded-2xl bg-amber-950/40 border border-amber-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: Diagonalsprung & Dame-Krone
            </div>
            <div className="grid grid-cols-4 w-48 h-48 rounded-xl overflow-hidden border-2 border-amber-800 shadow-2xl">
              {Array.from({ length: 16 }).map((_, idx) => {
                const r = Math.floor(idx / 4);
                const c = idx % 4;
                const isDark = (r + c) % 2 === 1;
                const hasRedPiece = r === 3 && c === 0;
                const hasBlackPiece = r === 2 && c === 1;
                const jumpLanding = r === 1 && c === 2;

                return (
                  <div
                    key={idx}
                    className={`relative flex items-center justify-center ${
                      isDark ? 'bg-amber-950' : 'bg-amber-200'
                    }`}
                  >
                    {hasRedPiece && (
                      <div className="w-8 h-8 rounded-full bg-rose-600 ring-2 ring-rose-300 shadow-md flex items-center justify-center text-white font-black text-xs animate-pulse">
                        R
                      </div>
                    )}
                    {hasBlackPiece && (
                      <div className="w-8 h-8 rounded-full bg-slate-900 ring-2 ring-slate-600 shadow-md flex items-center justify-center text-slate-300 font-black text-xs">
                        B
                      </div>
                    )}
                    {jumpLanding && (
                      <div className="w-7 h-7 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-300 font-bold animate-ping">
                        Sprung
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-amber-300 mt-2">
              Springe über gegnerische Steine, um sie vom Brett zu schlagen!
            </p>
          </div>
        );

      case 'battleship':
        return (
          <div className="relative p-4 rounded-2xl bg-cyan-950/40 border border-cyan-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: Radar-Gitter & Trefferfeuer
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-3 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-2xl">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-[10px] font-mono text-cyan-400">A1</div>
              <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-500 flex items-center justify-center text-base shadow-lg animate-pulse">🔥</div>
              <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-500 flex items-center justify-center text-base">🌊</div>
              <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-[10px] font-mono text-cyan-400">A4</div>
            </div>
            <div className="flex gap-4 mt-2 text-[11px]">
              <span className="text-rose-400 font-bold">🔥 Treffer (Schiff!)</span>
              <span className="text-blue-400 font-bold">🌊 Wasser (Fehlschuss)</span>
            </div>
          </div>
        );

      case 'yatzy':
        return (
          <div className="relative p-4 rounded-2xl bg-amber-950/40 border border-amber-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: 3D-Würfel & Halte-Funktion
            </div>
            <div className="flex gap-2">
              {[5, 5, 5, 2, 6].map((val, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black shadow-lg transition ${
                    i < 3
                      ? 'bg-amber-100 text-slate-950 ring-2 ring-amber-400 scale-105 shadow-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-600'
                  }`}
                >
                  {val}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-amber-300 font-bold">
              <span>🔒 3x Fünf gehalten (Dreierpasch)</span>
              <span>•</span>
              <span>2 Würfe verbleibend</span>
            </div>
          </div>
        );

      case 'dots-boxes':
        return (
          <div className="relative p-4 rounded-2xl bg-sky-950/40 border border-sky-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: Linien ziehen & Kästchen schließen
            </div>
            <div className="w-40 h-32 p-3 bg-slate-900 border border-sky-700/50 rounded-xl relative flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="w-3 h-3 rounded-full bg-sky-400" />
                <div className="h-1 flex-1 mx-1 bg-sky-400 rounded" />
                <div className="w-3 h-3 rounded-full bg-sky-400" />
              </div>
              <div className="flex justify-between items-center h-16">
                <div className="w-1 h-full bg-sky-400 rounded" />
                <div className="flex-1 m-1 bg-sky-500/20 border border-sky-400/40 rounded flex items-center justify-center font-black text-sky-300 text-xs animate-pulse">
                  P1 (+1)
                </div>
                <div className="w-1 h-full bg-sky-400 rounded" />
              </div>
              <div className="flex justify-between items-center">
                <div className="w-3 h-3 rounded-full bg-sky-400" />
                <div className="h-1 flex-1 mx-1 bg-sky-400 rounded" />
                <div className="w-3 h-3 rounded-full bg-sky-400" />
              </div>
            </div>
            <p className="text-[11px] text-sky-300 mt-2 font-medium">
              Die vierte geschlossene Linie erobert das Feld und gibt einen Extrazug!
            </p>
          </div>
        );

      case 'tictactoe':
        return (
          <div className="relative p-4 rounded-2xl bg-indigo-950/40 border border-indigo-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: 3-in-einer-Reihe
            </div>
            <div className="grid grid-cols-3 gap-2 w-36 h-36 p-2 bg-slate-950 border border-indigo-500/40 rounded-2xl shadow-xl relative">
              {['X', 'O', '', 'X', 'O', '', 'X', '', ''].map((sym, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg ${
                    sym === 'X'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-400/60 shadow'
                      : sym === 'O'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-400/60'
                      : 'bg-slate-900/60 border border-slate-800'
                  }`}
                >
                  {sym}
                </div>
              ))}
              {/* Winning Line Overlay */}
              <div className="absolute left-6 top-3 bottom-3 w-1 bg-amber-400 shadow-lg shadow-amber-400/50 rounded-full animate-pulse" />
            </div>
            <p className="text-[11px] text-indigo-300 mt-2 font-semibold">
              3 gleiche Symbole in einer Reihe (horizontal, vertikal, diagonal) gewinnen!
            </p>
          </div>
        );

      case 'diamond-blast':
        return (
          <div className="relative p-4 rounded-2xl bg-indigo-950/40 border border-indigo-600/30 flex flex-col items-center">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Interaktiver Board-Guide: Match-3, Dynamit & Regenbogen
            </div>
            {/* 4x4 Mini Diamond Grid Preview */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-950 border border-indigo-500/50 rounded-2xl shadow-2xl relative">
              {/* Row with a 3-match highlight */}
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-xl animate-pulse">💎</div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-xl animate-pulse">💎</div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-xl animate-pulse">💎</div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-xl">💣</div>

              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xl">🔷</div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl">🟩</div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-xl">💜</div>
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/30 border-2 border-fuchsia-400 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(236,72,153,0.8)]">🌈</div>
            </div>

            {/* Feature callouts */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] text-slate-300 w-full max-w-sm text-center">
              <div className="p-1.5 rounded-xl bg-rose-950/40 border border-rose-600/30">
                <span className="text-rose-400 font-bold block">3er-Reihe</span>
                <span className="text-[10px] text-slate-400">+100 Pkt.</span>
              </div>
              <div className="p-1.5 rounded-xl bg-amber-950/40 border border-amber-600/30">
                <span className="text-amber-400 font-bold block">Dynamit (T/L)</span>
                <span className="text-[10px] text-slate-400">3×3 Explosion</span>
              </div>
              <div className="p-1.5 rounded-xl bg-fuchsia-950/40 border border-fuchsia-600/30">
                <span className="text-fuchsia-400 font-bold block">Regenbogen (5er)</span>
                <span className="text-[10px] text-slate-400">Farb-Wipeout</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-indigo-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-display text-white">
                  {guide.title}
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {guide.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400">{guide.tagline}</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Quick Switcher Bar (Switch guides for all 10 games) */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> Spiel wählen:
          </span>
          {Object.values(ENGINE_GUIDES).map((g) => {
            const isCur = g.engine === selectedEngine;
            return (
              <button
                key={g.engine}
                onClick={() => {
                  sound.playClick();
                  setSelectedEngine(g.engine);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  isCur
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                }`}
              >
                <span>{g.title}</span>
              </button>
            );
          })}
        </div>

        {/* Tab switcher: Visual / Rules / Tips */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
          <button
            onClick={() => { sound.playClick(); setActiveTab('visual'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'visual'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointerClick className="w-4 h-4" /> Spielfeld & Steuerung
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('rules'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> Spielregeln & Ziel
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('tips'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'tips'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" /> Taktik & KI-Tipps
          </button>
        </div>

        {/* Content Body with smooth scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm flex-1">
          
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Spieler</span>
              <span className="font-bold text-slate-100">{guide.players}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Spieldauer</span>
              <span className="font-bold text-slate-100">{guide.duration}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Altersempfehlung</span>
              <span className="font-bold text-slate-100">{guide.minAge}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Kategorie</span>
              <span className="font-bold text-amber-400">{guide.category}</span>
            </div>
          </div>

          {/* TAB 1: VISUAL BOARD & CONTROLS */}
          {activeTab === 'visual' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Visual interactive diagram */}
              {renderVisualBoardPreview()}

              {/* Step-by-Step interaction cards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5" /> Wie führe ich einen Spielzug aus?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {guide.quickSteps.map((s) => (
                    <div
                      key={s.step}
                      className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-start gap-3 shadow-md"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                        {s.icon}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1">
                          <span className="text-amber-400 font-mono">#{s.step}</span> {s.title}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specific interactive board controls summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> Klickzonen & Interaktionen
                </h4>
                <div className="space-y-1.5 text-xs">
                  {guide.boardControls.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
                      <strong className="text-amber-300 shrink-0">{c.label}</strong>
                      <span className="text-slate-300 text-right text-[11px]">{c.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RULES & OBJECTIVE */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Objective Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 flex items-start gap-3">
                <Trophy className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Spielziel</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {guide.objective}
                  </p>
                </div>
              </div>

              {/* Special Rules */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Wichtige Spielregeln & Besonderheiten
                </h4>
                <div className="space-y-2">
                  {guide.specialRules.map((r, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60">
                      <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {r.title}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {r.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRO-TIPS & STRATEGY */}
          {activeTab === 'tips' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 flex items-start gap-3">
                <Zap className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Strategische Tipps für mehr Siege</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Mit diesen taktischen Empfehlungen spielst du auf Meister-Niveau gegen Freunde und die KI!
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {guide.proTips.map((tip, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed pt-0.5">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bot & Family Tips Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-1">
                <strong className="text-slate-200">🤖 Spielen gegen die KI:</strong>
                <p>
                  Wenn du alleine oder mit virtuellen Mitspielern am Familientisch sitzt, zieht der Computer nach einer kurzen Denkpause automatisch. Du kannst jederzeit über den Tisch oben menschliche Mitspieler per Tisch-Code einladen!
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer with Close Button */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            FamPlay Arcade · Alle Anleitungen sind jederzeit am Spieltisch abrufbar.
          </div>
          <button
            onClick={() => {
              sound.playReward();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Alles klar, weiterspielen!
          </button>
        </div>

      </div>
    </div>
  );
};
