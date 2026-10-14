# 🎲 FamPlay — Family Multi-Gaming Arcade & Social Platform

[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Web Audio](https://img.shields.io/badge/Audio-Web%20Audio%20API-green.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

> **FamPlay** is a modern, cross-platform family gaming platform offering a curated suite of genuine digital board, card, and puzzle classics. Built with bespoke wooden/felt textures, realistic tactile game pieces, opt-in family voice channels, multi-role user authentication, parental safety controls, and an administration back-office.

---

## 📋 Table of Contents

1. [Key Features](#-key-features)
2. [Games Catalog & Custom Board Visuals](#-games-catalog--custom-board-visuals)
3. [Voice Chat & Audio Architecture (Opt-in)](#-voice-chat--audio-architecture-opt-in)
4. [User Authentication & Account Management](#-user-authentication--account-management)
5. [Enterprise Admin & Moderation System](#-enterprise-admin--moderation-system)
6. [Parental Controls & Family Safety](#-parental-controls--family-safety)
7. [Tech Stack & Architecture](#-tech-stack--architecture)
8. [Directory Structure](#-directory-structure)
9. [Getting Started & Local Setup](#-getting-started--local-setup)
10. [User Roles & Permissions Matrix](#-user-roles--permissions-matrix)
11. [Audio & Sound Design Engine](#-audio--sound-design-engine)
12. [Internationalization (i18n)](#-internationalization-i18n)
13. [Android App & WebAPK Installation](#-android-app--webapk-installation)

---

## ✨ Key Features

- **🎨 Bespoke Tactile Game Boards (No 08/15 generic graphics)**:
  - Custom wooden textures, baize/felt table mats, realistic Staunton chess figures, 3D turned wooden Ludo meeples, crown-stamped checkers, and naval radar grids.
  - Interactive SVG and Canvas game renderers with turn indicators, legal move highlights, capture trays, and fluid animations.
- **🎙️ Zero Auto-Join Voice Chat (Privacy-First)**:
  - Voice channels are strictly **opt-in** by default. Users never join voice automatically.
  - Features push-to-talk, active speaker wave rings, volume controls, participant list, and mic test indicators.
- **🔐 Complete Authentication & Clean User System**:
  - Sign-in and registration with family role assignments (*Parent*, *Teen*, *Child*, *Grandparent*, *Family Champion*).
  - Clean accounts with zero mock clutter, real match histories, and genuine level progression.
  - Persistent local storage session management.
- **👤 Comprehensive User Profile Panel**:
  - Level progression, XP tracking, coin & gem wallets, and VIP multiplier indicators.
  - Lifetime statistics (games played, win rates, favorite titles), match history logs with XP rewards.
  - Interactive Avatar Studio with custom accessories, skins, hairstyles, and VIP flairs.
- **🛡️ Full-Featured Admin & Moderation Suite**:
  - Live system health metrics: active rooms, online players, latency, and open dispute reports.
  - User management: role switches (*Admin*, *Moderator*, *User*), coin/gem gifting, VIP toggles, and ban/unban with custom reasons.
  - Catalog controls: toggle game status (Active / Maintenance / Disabled) and edit game attributes.
  - Active game table inspector: live room viewing, admin broadcast into tables, and force-termination of rogue rooms.
  - Live global banner broadcast for platform-wide alerts and maintenance notices.
  - Complete, unalterable system audit logging with timestamps.
- **👨‍👩‍👧‍👦 PIN-Protected Parental Controls**:
  - Daily screen-time limits with countdown timers, bedtime lockouts, chat filters, and age-rating locks.
- **🏆 Clans, Tournaments & Rewards**:
  - Family clan leaderboards, seasonal tournament brackets, daily login streak rewards, and unlockable achievements.

---

## 🎮 Games Catalog & Custom Board Visuals

FamPlay features custom game boards rendered directly in the DOM with SVG vector graphics, realistic lighting, and drop shadows:

| Game | Board Design & Features | Players | Mechanics |
| :--- | :--- | :---: | :--- |
| **Ludo (Mensch ärgere dich nicht)** | Classic German cross board with wooden grain, felt play surface, 3D turned meeples (Red, Blue, Green, Yellow), animated 3D dice roller, safe spots, and home runways. | 2–4 | Dice rolling (roll 6 to leave base), token movement, capturing opposing meeples. |
| **Chess (Schach)** | Luxury tournament wooden board with alternating walnut & maple squares, vector Staunton pieces (King, Queen, Rook, Bishop, Knight, Pawn), legal move dots, capture trays. | 2 | Turn-based strategy, full move validation, captured piece tally, checkmate detection. |
| **Checkers (Dame)** | Mahogany checkered board with wood-grain bevel, crowned King pieces with golden crests, jump capture highlights. | 2 | Diagonal stepping, single and multi-hop piece captures, promotion to King upon reaching back rank. |
| **FamCards (Uno-Style)** | Realistic card deck with vibrant colored cards (Red, Blue, Green, Yellow), action cards (*+2*, *Skip*, *Reverse*), Wild & *+4*, smooth hand fan layout. | 2–4 | Match color or number, action card penalties, empty-hand victory. |
| **Battleship (Schiffe versenken)** | Dual tactical radar grid with metallic grid styling, ship models (Aircraft Carrier, Battleship, Cruiser, Submarine, Destroyer), red hit and white miss markers. | 2 | Strategic fleet placement, turn-by-turn missile coordinate strikes, sunken ship alerts. |
| **Connect Four (Vier gewinnt)** | Deep blue arcade grid frame with physics-styled coin slot drops, bright yellow and red coin tokens, 4-in-a-row winning line animation. | 2 | Column gravity drop, horizontal/vertical/diagonal 4-token alignment detection. |
| **Memory Match (Memo)** | 3D flip card tiles with themed icons (animals, food, gems, sports), card-back designs, move counter, match celebration. | 1–2 | Card flipping, pair detection, accuracy scoring. |
| **Tic-Tac-Toe & Dots and Boxes** | Clean minimalist chalk/neon and grid boards with quick-play instant restart. | 2 | Rapid casual play with turn timer. |
| **Yatzy (Kniffel)** | Wooden dice cup shaker with 5 physical 3D dice, roll reroll hold toggles, full scoring ledger (Three of a Kind, Full House, Yahtzee). | 1–4 | 3-roll turn phase, strategic scorecard filling. |

---

## 🎙️ Voice Chat & Audio Architecture (Opt-in)

Privacy and comfort are paramount for family gaming. FamPlay enforces a strict **Opt-In** voice communication protocol:

1. **No Auto-Connect**:
   - Entering a game room or table **never** activates the microphone or connects to audio automatically.
   - The player must explicitly click the **"Voice beitreten" (Join Voice)** toggle button.
2. **Audio Controls (`VoiceChatPanel`)**:
   - **Mute / Unmute**: Instant toggle with status badge (`Stumm` / `Aktiv`).
   - **Push-to-Talk (PTT)**: Optional mode with spacebar / click-and-hold trigger.
   - **Active Speaker Ring**: Pulse animation around the speaker's avatar when sound is detected.
   - **Master & Per-Room Volume**: Individual slider to balance voice against in-game sound effects.
   - **Microphone Permission Handling**: Graceful fallback with clear visual guidance when microphone permissions are denied or disabled by parental controls.

---

## 🔐 User Authentication & Account Management

FamPlay includes an end-to-end authentication workflow in `src/components/auth/LoginModal.tsx` and `src/services/authService.ts`:

### Authentication Tabs
- **Anmelden (Sign In)**:
  - Login using Email or Username + Password.
  - Password visibility toggle (`Show / Hide`).
  - "Angemeldet bleiben" (Remember me) persistent session option.
- **Registrieren (Sign Up)**:
  - Account creation with Username, Email, Password, and Family Role (*Kind*, *Teenager*, *Eltern*, *Großeltern*, *Familien-Champion*).
  - Clan membership selection and instant welcome bonus (+500 Coins, +20 Gems).
- **Demo-Profile (Quick Switcher)**:
  - One-click account switching for demonstration and testing:
    - **Alex Gamer** (`Admin`, Family Champion, Level 14, VIP)
    - **Markus Miller** (`Moderator`, Parent, Level 11)
    - **Emma Miller** (`User`, Child / Junior, Level 7)
    - **Renate Miller** (`User`, Grandparent, Level 5)
    - **Gast-Spieler** (`User`, Guest, Level 1)

### User Profile Hub (`src/components/user/UserPanelModal.tsx`)
- **Übersicht (Overview)**: Level badge, XP progress bar with remaining XP to next level, Coin & Gem balances, VIP status indicator, active daily streak.
- **Statistiken (Stats)**: Total games played, games won, win percentage, favorite game title, tournaments won.
- **Match-Historie (Match History)**: Recent game records with outcome badges (*Sieg*, *Niederlage*, *Unentschieden*), opponent names, timestamps, and XP earned.
- **Einstellungen & Sicherheit (Settings)**: Parental PIN settings, password change simulator, language preferences, notification toggles, and logout action.

---

## 🛡️ Enterprise Admin & Moderation System

Accessible via the navbar shield icon or the toolbar button (restricted to users with the `admin` role, with moderation access for `moderator` role):

```
┌─────────────────────────────────────────────────────────────┐
│ FamPlay Enterprise Administration & Security Console        │
├─────────────────┬───────────────────────────────────────────┤
│ 📊 System-Status │ Active Rooms, Online Users, Latency, Load │
│ 👥 Benutzer      │ Role switch, Grant Coins/Gems, Ban/Unban  │
│ 🎮 Spielekatalog │ Enable/Disable games, Maintenance toggle  │
│ 🚨 Moderation    │ Chat/conduct reports, Warn/Mute/Dismiss   │
│ 🏢 Live-Tische   │ Inspect active tables, Send announcement │
│ 📢 Durchsagen    │ Broadcast global banners to all players   │
│ 📜 Audit-Log     │ Full chronological admin action log       │
└─────────────────┴───────────────────────────────────────────┘
```

### Admin Modules Breakdown

1. **System Health & Metrics**:
   - Total registered users, active rooms, estimated online players, server latency (ms), and pending moderation tickets.
2. **User Management**:
   - Filter and search users by name, email, or clan.
   - Change user role (`admin`, `moderator`, `user`).
   - Grant currency (+500 Coins, +50 Gems).
   - Toggle VIP status.
   - Ban and Unban accounts with explicit justification notes (`Ban Reason`).
3. **Game Catalog Management**:
   - Enable or Disable individual game titles in real-time.
   - Put games into Maintenance mode (`Wartungsmodus`) to prevent new room creation.
   - Adjust displayed play count and ratings.
4. **Dispute & Moderation Center**:
   - Review incoming player reports with reason, reporter name, and reported user.
   - Take immediate actions: **Verwarnen (Warn)**, **24h Stummschalten (Mute)**, or **Meldung verwerfen (Dismiss)**.
5. **Live Room Inspector**:
   - Live monitor of all active multiplayer game tables (e.g. `FAM-777`, `LUDO-401`).
   - View player counts, host ID, and voice chat activity.
   - Broadcast admin messages into individual rooms or terminate tables.
6. **Global Broadcast System**:
   - Create system-wide announcement banners displayed across the top of all player viewports.
   - Quick presets for *Server-Wartung* (maintenance), *Doppel-XP Wochenende* (double XP), and *Neues Turnier* (new tournament).
7. **Audit & Compliance Log**:
   - Detailed event log capturing every administrative action with actor, target, timestamp, and details.
   - Option to clear or export log records.

---

## 👨‍👩‍👧‍👦 Parental Controls & Family Safety

FamPlay includes comprehensive parental controls to ensure safe gaming for younger family members:

- **4-Digit Master PIN**: Secures parental control settings against unauthorized modifications.
- **Daily Screen-Time Budget**: Configurable limits (e.g., 60, 90, 120 minutes per day) with live usage tracking and automatic lockouts.
- **Bedtime Enforcer**: Restricts gaming during quiet hours (e.g., 20:30 to 07:00).
- **Age Rating Filter**: Restricts access to titles above the child's allowed age threshold.
- **Chat & Voice Restrictions**: Disables voice chat or enforces family-filtered text messaging.
- **Session History Log**: Detailed log of games played, start times, and durations.

---

## 💻 Tech Stack & Architecture

FamPlay is built with modern web technologies:

- **Framework**: [React 19](https://react.dev/) (Functional components, custom hooks, context-free state management).
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, shared data contracts in `/src/types`).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Modern CSS engine with dark arcade color palette: slate/slate-900, indigo, violet, amber, emerald).
- **Bundler & Server**: [Vite 8](https://vitejs.dev/) with fast HMR and optimized production bundles.
- **Icons**: [Lucide React](https://lucide.dev/) (Consistent, clean iconography).
- **Effects**: [canvas-confetti](https://github.com/catdad/canvas-confetti) for tournament and game victory animations.
- **Audio**: Web Audio API Procedural Synthesizer (Zero-latency sound effects without external audio file loading).

---

## 📁 Directory Structure

```
famplay/
├── index.html                   # HTML5 entry point & viewport meta
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite build & Tailwind configuration
├── src/
│   ├── main.tsx                 # React DOM root entry point
│   ├── App.tsx                  # Core application shell, modals & navigation
│   ├── index.css                # Global Tailwind CSS imports & custom styles
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces (User, Games, Admin, etc.)
│   ├── services/
│   │   ├── authService.ts       # Auth state, demo accounts, persistence, audit logs
│   │   ├── gameImages.ts        # High-res photography & custom SVG board fallbacks
│   │   ├── sound.ts             # Web Audio API sound synthesizer (Click, Dice, Win, etc.)
│   │   └── i18n.ts              # Multi-language translation dictionaries (DE/EN)
│   ├── data/
│   │   └── mockData.ts          # Default mock profiles, rooms, catalog & tournaments
│   └── components/
│       ├── achievements/        # AchievementsModal component
│       ├── admin/
│       │   ├── AdminDashboardModal.tsx  # Quick moderation modal
│       │   └── AdminSystemModal.tsx     # Full enterprise admin suite
│       ├── auth/
│       │   └── LoginModal.tsx           # Login, registration & demo account switcher
│       ├── avatar/
│       │   ├── AvatarDisplay.tsx        # Dynamic SVG avatar renderer
│       │   └── AvatarStudioModal.tsx    # Interactive avatar & cosmetic editor
│       ├── games/
│       │   ├── BattleshipGame.tsx       # Naval radar battleship game
│       │   ├── CatalogQuickPlay.tsx     # Quick play modal & catalog browser
│       │   ├── CheckersGame.tsx         # Realistic wooden checkers / Dame
│       │   ├── ChessGame.tsx            # Classic Staunton chess game
│       │   ├── ConnectFour.tsx          # 3D gravity-drop 4-in-a-row
│       │   ├── DotsAndBoxesGame.tsx     # Classic grid territory game
│       │   ├── FamCardsUno.tsx          # Uno-style family card game
│       │   ├── LudoGame.tsx             # Mensch ärgere dich nicht 3D cross board
│       │   ├── MemoryMatchGame.tsx      # Card-flipping memory puzzle
│       │   ├── TicTacToeGame.tsx        # Fast-paced Tic-Tac-Toe
│       │   └── YatzyGame.tsx            # Kniffel 5-dice shaker game
│       ├── leaderboards/        # LeaderboardsModal component
│       ├── notifications/       # NotificationCenter component
│       ├── parental/            # ParentalControlsModal component
│       ├── rewards/             # DailyRewardsModal & streak claiming
│       ├── rooms/               # CreateRoomModal & JoinRoomModal
│       ├── tournaments/         # TournamentsModal & bracket view
│       ├── user/
│       │   └── UserPanelModal.tsx       # User profile, history, stats & settings
│       ├── vip/                 # VipClubModal & subscription tiers
│       └── voice/
│           └── VoiceChatPanel.tsx       # Opt-in voice chat bar & participant list
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.0 or newer)
- npm, yarn, or [bun](https://bun.sh/)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/famplay.git
cd famplay
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```
Creates an optimized static production bundle in `/dist`.

### 4. Run Lint & Type Check
```bash
npm run lint
```
Executes `tsc --noEmit` to verify type safety across all components and services.

---

## 👥 User Roles & Permissions Matrix

FamPlay features role-based access control with distinct permission boundaries:

| Permission / Action | Super Admin | Moderator | Parent / Champion | Teenager / Child | Guest |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Play All Games | ✅ | ✅ | ✅ | ✅ (Age-filtered) | ✅ |
| Access Voice Chat | ✅ | ✅ | ✅ | ✅ (If parental approval) | ❌ |
| Create Game Rooms | ✅ | ✅ | ✅ | ✅ | ❌ |
| Access User Panel | ✅ | ✅ | ✅ | ✅ | ❌ |
| Access Admin Console | ✅ | ❌ | ❌ | ❌ | ❌ |
| Access Moderation Queue | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change User Roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ban / Unban Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Grant Coins / Gems | ✅ | ❌ | ❌ | ❌ | ❌ |
| Toggle Game Maintenance | ✅ | ❌ | ❌ | ❌ | ❌ |
| Send Global Broadcasts | ✅ | ❌ | ❌ | ❌ | ❌ |
| View System Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Parental Controls | ✅ | ✅ | ✅ (with PIN) | ❌ | ❌ |

---

## 🔊 Audio & Sound Design Engine

Rather than relying on external MP3/WAV assets that might fail or add network latency, FamPlay features a dedicated Web Audio API synthesizer (`src/services/sound.ts`):

- **Click / Tap**: Crisp short sine click for button interactions.
- **Dice Roll**: Frequency-modulated rattle effect mimicking tumbling wooden dice.
- **Card Deal**: Soft swoosh effect mimicking sliding cardstock.
- **Game Move / Token Place**: Pleasant marimba harmonic for placing tokens or chess pieces.
- **Victory Fanfare**: Ascending tri-tone arpeggio in C Major with confetti celebration.
- **Defeat Chime**: Descending soft minor chime.
- **Coin Chime**: High-frequency bell chime on claiming coins or rewards.
- **Level Up**: Brass-style triumphant synth chord.
- **Global Sound Mute**: Toggleable anytime from the top navigation bar.

---

## 🌍 Internationalization (i18n)

FamPlay supports instant language switching between:
- 🇩🇪 **Deutsch (German)** (Default)
- 🇬🇧 **English (US/UK)**

Language toggling is accessible directly from the top navigation bar and affects all games, rules, administration panels, and system notifications without page reload.

---

## 🤖 Android App & WebAPK Installation

FamPlay is fully architected as an **Android WebAPK & Progressive Web App (PWA)**, allowing seamless installation on any Android smartphone, tablet, or Chromebook:

### Android Highlights
- **Vollbild (Standalone Mode)**: Runs without browser address bar or chrome navigation, delivering 100% of the screen for game boards.
- **Haptic Vibration Feedback**: Integrates subtle Android vibration cues on moves, dice rolls, token placement, and victories via `navigator.vibrate`.
- **Offline Caching**: Automatically precaches the application bundle, game logic, and fonts for smooth offline gameplay on flights, road trips, or areas with poor reception.
- **App Drawer & Home Screen Icon**: Installs with high-resolution adaptive/maskable icons (`192x192` and `512x512`).

### Installation Methods on Android
1. **In-App 1-Click Install**: Click the green **„Android App“** button in the header or user profile panel to trigger the native installation prompt.
2. **Google Chrome on Android**: Tap `⋮` (menu) in the upper right corner → **„App installieren“** or **„Zum Startbildschirm hinzufügen“**.
3. **Samsung Internet**: Tap `≡` (menu) in the bottom right corner → **„Seite hinzufügen zu“** → **„Startbildschirm“**.
4. **Mozilla Firefox on Android**: Tap `⋮` → **„Installieren“**.

### Packaging as Standalone APK / Google Play Store (TWA)
FamPlay's Web App Manifest and Service Worker are 100% compatible with Google Trusted Web Activities (TWA):
```bash
# 1. Install Google Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize Android Studio Project from FamPlay manifest
bubblewrap init --manifest https://<your-famplay-domain>/manifest.webmanifest

# 3. Build signed APK or Android App Bundle (.aab) for Google Play
bubblewrap build
```
Alternatively, upload your manifest directly to [PWABuilder.com](https://www.pwabuilder.com/) to download a ready-to-publish Android package.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for families and casual game lovers worldwide.
