// Monopoly 2026 Board, Figures and Card Definitions

export type PropertyGroup = 
  | 'brown' 
  | 'light-blue' 
  | 'pink' 
  | 'orange' 
  | 'red' 
  | 'yellow' 
  | 'green' 
  | 'dark-blue' 
  | 'station' 
  | 'utility';

export type SpaceType = 
  | 'go' 
  | 'property' 
  | 'community' 
  | 'tax' 
  | 'station' 
  | 'chance' 
  | 'jail' 
  | 'utility' 
  | 'parking' 
  | 'go-to-jail';

export interface BoardSpace {
  index: number;
  name: string;
  type: SpaceType;
  group?: PropertyGroup;
  price?: number;
  baseRent?: number;
  houseRents?: [number, number, number, number, number]; // 1H, 2H, 3H, 4H, Hotel
  houseCost?: number;
  mortgageValue?: number;
  icon?: string;
  subtitle?: string;
}

export type MonopolyFigureId = 
  | 'hat' 
  | 'car' 
  | 'dog' 
  | 'ship' 
  | 'boot' 
  | 'cat' 
  | 'dino' 
  | 'jet';

export interface MonopolyFigure {
  id: MonopolyFigureId;
  name: string;
  germanName: string;
  emoji: string;
  material: 'silver' | 'gold' | 'bronze' | 'chrome' | 'titanium';
  colorHex: string;
}

export const MONOPOLY_FIGURES: MonopolyFigure[] = [
  { id: 'hat', name: 'Top Hat', germanName: 'Zylinder', emoji: '🎩', material: 'silver', colorHex: '#cbd5e1' },
  { id: 'car', name: 'Race Car', germanName: 'Oldtimer', emoji: '🏎️', material: 'chrome', colorHex: '#94a3b8' },
  { id: 'dog', name: 'Scottie Dog', germanName: 'Terrier-Hund', emoji: '🐕', material: 'bronze', colorHex: '#d97706' },
  { id: 'ship', name: 'Battleship', germanName: 'Schlachtschiff', emoji: '🚢', material: 'titanium', colorHex: '#64748b' },
  { id: 'boot', name: 'Classic Boot', germanName: 'Stiefel', emoji: '👢', material: 'bronze', colorHex: '#b45309' },
  { id: 'cat', name: 'Lucky Cat', germanName: 'Glückskatze', emoji: '🐱', material: 'gold', colorHex: '#fbbf24' },
  { id: 'dino', name: 'T-Rex Dino', germanName: 'T-Rex', emoji: '🦖', material: 'bronze', colorHex: '#059669' },
  { id: 'jet', name: 'Supersonic Jet', germanName: 'Privatjet 2026', emoji: '✈️', material: 'titanium', colorHex: '#38bdf8' },
];

export const PROPERTY_GROUP_COLORS: Record<PropertyGroup, { bg: string; text: string; border: string; label: string }> = {
  'brown': { bg: '#8B4513', text: '#ffffff', border: '#5c2d0c', label: 'Braun' },
  'light-blue': { bg: '#38bdf8', text: '#082f49', border: '#0284c7', label: 'Hellblau' },
  'pink': { bg: '#ec4899', text: '#ffffff', border: '#be185d', label: 'Rosa' },
  'orange': { bg: '#f97316', text: '#ffffff', border: '#c2410c', label: 'Orange' },
  'red': { bg: '#ef4444', text: '#ffffff', border: '#b91c1c', label: 'Rot' },
  'yellow': { bg: '#eab308', text: '#713f12', border: '#a16207', label: 'Gelb' },
  'green': { bg: '#22c55e', text: '#ffffff', border: '#15803d', label: 'Grün' },
  'dark-blue': { bg: '#1e40af', text: '#ffffff', border: '#1e3a8a', label: 'Dunkelblau' },
  'station': { bg: '#475569', text: '#ffffff', border: '#334155', label: 'Bahnhof' },
  'utility': { bg: '#0d9488', text: '#ffffff', border: '#0f766e', label: 'Werk' },
};

// 40 Classic & Modernized Board Spaces
export const BOARD_SPACES: BoardSpace[] = [
  // Bottom Row (0 to 10)
  { index: 0, name: 'LOS', type: 'go', subtitle: 'Ziehe 200 € ein', icon: '🏁' },
  { index: 1, name: 'Badstraße', type: 'property', group: 'brown', price: 60, baseRent: 2, houseRents: [10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30 },
  { index: 2, name: 'Gemeinschaftsfeld', type: 'community', subtitle: 'Zieh eine Karte', icon: '📦' },
  { index: 3, name: 'Turmstraße', type: 'property', group: 'brown', price: 60, baseRent: 4, houseRents: [20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30 },
  { index: 4, name: 'Einkommensteuer', type: 'tax', subtitle: 'Zahle 200 €', price: 200, icon: '💎' },
  { index: 5, name: 'Südbahnhof', type: 'station', group: 'station', price: 200, baseRent: 25, mortgageValue: 100, icon: '🚂' },
  { index: 6, name: 'Chausseestraße', type: 'property', group: 'light-blue', price: 100, baseRent: 6, houseRents: [30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  { index: 7, name: 'Ereignisfeld', type: 'chance', subtitle: 'Zieh eine Karte', icon: '❓' },
  { index: 8, name: 'Elisenstraße', type: 'property', group: 'light-blue', price: 100, baseRent: 6, houseRents: [30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  { index: 9, name: 'Poststraße', type: 'property', group: 'light-blue', price: 120, baseRent: 8, houseRents: [40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 60 },
  { index: 10, name: 'Gefängnis', type: 'jail', subtitle: 'Nur zu Besuch', icon: '⛓️' },

  // Left Column (11 to 20)
  { index: 11, name: 'Seestraße', type: 'property', group: 'pink', price: 140, baseRent: 10, houseRents: [50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  { index: 12, name: 'Elektrizitätswerk', type: 'utility', group: 'utility', price: 150, subtitle: 'Augenzahl x 4 / x 10', mortgageValue: 75, icon: '⚡' },
  { index: 13, name: 'Hafenstraße', type: 'property', group: 'pink', price: 140, baseRent: 10, houseRents: [50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  { index: 14, name: 'Neue Straße', type: 'property', group: 'pink', price: 160, baseRent: 12, houseRents: [60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80 },
  { index: 15, name: 'Westbahnhof', type: 'station', group: 'station', price: 200, baseRent: 25, mortgageValue: 100, icon: '🚂' },
  { index: 16, name: 'Münchner Straße', type: 'property', group: 'orange', price: 180, baseRent: 14, houseRents: [70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  { index: 17, name: 'Gemeinschaftsfeld', type: 'community', subtitle: 'Zieh eine Karte', icon: '📦' },
  { index: 18, name: 'Wiener Straße', type: 'property', group: 'orange', price: 180, baseRent: 14, houseRents: [70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  { index: 19, name: 'Berliner Straße', type: 'property', group: 'orange', price: 200, baseRent: 16, houseRents: [80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100 },
  { index: 20, name: 'Frei Parken', type: 'parking', subtitle: 'Jackpot & Pause', icon: '🚗' },

  // Top Row (21 to 30)
  { index: 21, name: 'Theaterstraße', type: 'property', group: 'red', price: 220, baseRent: 18, houseRents: [90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { index: 22, name: 'Ereignisfeld', type: 'chance', subtitle: 'Zieh eine Karte', icon: '❓' },
  { index: 23, name: 'Museumstraße', type: 'property', group: 'red', price: 220, baseRent: 18, houseRents: [90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { index: 24, name: 'Opernplatz', type: 'property', group: 'red', price: 240, baseRent: 20, houseRents: [100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 },
  { index: 25, name: 'Nordbahnhof', type: 'station', group: 'station', price: 200, baseRent: 25, mortgageValue: 100, icon: '🚂' },
  { index: 26, name: 'Lessingstraße', type: 'property', group: 'yellow', price: 260, baseRent: 22, houseRents: [110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { index: 27, name: 'Schillerstraße', type: 'property', group: 'yellow', price: 260, baseRent: 22, houseRents: [110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { index: 28, name: 'Wasserwerk', type: 'utility', group: 'utility', price: 150, subtitle: 'Augenzahl x 4 / x 10', mortgageValue: 75, icon: '💧' },
  { index: 29, name: 'Goethestraße', type: 'property', group: 'yellow', price: 280, baseRent: 24, houseRents: [120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 },
  { index: 30, name: 'Gehe in das Gefängnis', type: 'go-to-jail', subtitle: 'Direkt ins Loch!', icon: '👮' },

  // Right Column (31 to 39)
  { index: 31, name: 'Rathausplatz', type: 'property', group: 'green', price: 300, baseRent: 26, houseRents: [130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { index: 32, name: 'Hauptstraße', type: 'property', group: 'green', price: 300, baseRent: 26, houseRents: [130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { index: 33, name: 'Gemeinschaftsfeld', type: 'community', subtitle: 'Zieh eine Karte', icon: '📦' },
  { index: 34, name: 'Bahnhofstraße', type: 'property', group: 'green', price: 320, baseRent: 28, houseRents: [150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 },
  { index: 35, name: 'Hauptbahnhof', type: 'station', group: 'station', price: 200, baseRent: 25, mortgageValue: 100, icon: '🚂' },
  { index: 36, name: 'Ereignisfeld', type: 'chance', subtitle: 'Zieh eine Karte', icon: '❓' },
  { index: 37, name: 'Parkstraße', type: 'property', group: 'dark-blue', price: 350, baseRent: 35, houseRents: [175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 },
  { index: 38, name: 'Luxussteuer', type: 'tax', subtitle: 'Zahle 100 €', price: 100, icon: '💍' },
  { index: 39, name: 'Schlossallee', type: 'property', group: 'dark-blue', price: 400, baseRent: 50, houseRents: [200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200 },
];

export interface CardAction {
  id: string;
  deck: 'chance' | 'community';
  title: string;
  text: string;
  type: 'money' | 'move' | 'jail' | 'jail-free' | 'repairs' | 'collect-from-players';
  amount?: number;
  targetIndex?: number;
  repairHouse?: number;
  repairHotel?: number;
}

export const CHANCE_CARDS: CardAction[] = [
  { id: 'ch1', deck: 'chance', title: 'Vorwärts nach Schlossallee', text: 'Ziehe deine Figur direkt auf die Schlossallee. Wenn du über LOS kommst, ziehe 200 € ein.', type: 'move', targetIndex: 39 },
  { id: 'ch2', deck: 'chance', title: 'Vor bis auf LOS', text: 'Rücke vor bis auf LOS! Ziehe 200 € ein.', type: 'move', targetIndex: 0 },
  { id: 'ch3', deck: 'chance', title: 'Gehe in das Gefängnis', text: 'Begib dich direkt in das Gefängnis. Gehe nicht über LOS. Ziehe nicht 200 € ein.', type: 'jail' },
  { id: 'ch4', deck: 'chance', title: 'Dividende erhalten', text: 'Die Bank zahlt dir eine Dividende von 150 € aus!', type: 'money', amount: 150 },
  { id: 'ch5', deck: 'chance', title: 'Renovierungsarbeiten', text: 'Zahle für jedes Haus 25 € und für jedes Hotel 100 € Straßenreparatur.', type: 'repairs', repairHouse: 25, repairHotel: 100 },
  { id: 'ch6', deck: 'chance', title: 'Gefängnis-Freikarte', text: 'Du kommst aus dem Gefängnis frei. Behalte diese Karte bis zum Gebrauch oder verkaufe sie.', type: 'jail-free' },
  { id: 'ch7', deck: 'chance', title: 'Geschwindigkeitsüberschreitung', text: 'Strafe wegen zu schnellem Fahren: Zahle 50 €.', type: 'money', amount: -50 },
  { id: 'ch8', deck: 'chance', title: 'Reise zum Südbahnhof', text: 'Rücke vor zum Südbahnhof. Wenn du über LOS kommst, ziehe 200 € ein.', type: 'move', targetIndex: 5 },
  { id: 'ch9', deck: 'chance', title: 'Kreditverzinsung', text: 'Deine Bauanleihe wird fällig: Erhalte 100 €.', type: 'money', amount: 100 },
  { id: 'ch10', deck: 'chance', title: 'Schulgeld bezahlen', text: 'Zahle das Schulgeld in Höhe von 150 €.', type: 'money', amount: -150 },
];

export const COMMUNITY_CARDS: CardAction[] = [
  { id: 'co1', deck: 'community', title: 'Bankirrtum zu deinen Gunsten', text: 'Ein Bankirrtum zu deinen Gunsten! Ziehe 200 € ein.', type: 'money', amount: 200 },
  { id: 'co2', deck: 'community', title: 'Arztrechnung', text: 'Zahle die Arztrechnung in Höhe von 50 €.', type: 'money', amount: -50 },
  { id: 'co3', deck: 'community', title: 'Aus dem Verkauf von Aktien', text: 'Aus dem Verkauf von Aktien erhältst du 50 €.', type: 'money', amount: 50 },
  { id: 'co4', deck: 'community', title: 'Gefängnis-Freikarte', text: 'Du kommst aus dem Gefängnis frei. Diese Karte kann behalten werden.', type: 'jail-free' },
  { id: 'co5', deck: 'community', title: 'Gehe in das Gefängnis', text: 'Begib dich sofort ins Gefängnis! Nicht über LOS gehen.', type: 'jail' },
  { id: 'co6', deck: 'community', title: 'Du hast Geburtstag!', text: 'Es ist dein Geburtstag! Ziehe von jedem Mitspieler 10 € ein.', type: 'collect-from-players', amount: 10 },
  { id: 'co7', deck: 'community', title: 'Lebensversicherung wird fällig', text: 'Deine Lebensversicherung wird fällig: Ziehe 100 € ein.', type: 'money', amount: 100 },
  { id: 'co8', deck: 'community', title: 'Krankenhauskosten', text: 'Zahle die Krankenhauskosten in Höhe von 100 €.', type: 'money', amount: -100 },
  { id: 'co9', deck: 'community', title: 'Steuerrückzahlung', text: 'Erhalte eine Einkommensteuer-Rückzahlung von 20 €.', type: 'money', amount: 20 },
  { id: 'co10', deck: 'community', title: 'Zweiter Preis im Schönheitswettbewerb', text: 'Du gewinnst den 2. Preis im Schönheitswettbewerb: Ziehe 50 € ein.', type: 'money', amount: 50 },
];
