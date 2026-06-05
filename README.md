# DivergeOS — Web Desktop OS

A fully functional desktop operating system simulation built in the browser with React and TypeScript. Features a complete window manager, multiple applications, faction-based theming, a lock screen, and a chess engine with four AI difficulty levels.

**Live Demo:** [ryanlew02.github.io/DivergeOS](https://ryanlew02.github.io/DivergeOS/)

---

## Features

### Desktop Environment
- **Window manager** — drag, resize (8 directions), minimize, maximize, close, and z-index stacking
- **App icons** — draggable, grid-snapping (96px), renameable via double-click or right-click
- **Desktop items** — right-click the desktop to create files and folders; drag them anywhere
- **Multi-select** — marquee-select multiple icons and drag them as a group
- **Taskbar** — running window list, start menu, faction picker, live clock
- **Lock screen** — password-protected with animated unlock, default code: `insurgent`

### Applications

| App | Icon | Description |
|-----|------|-------------|
| Notepad | 📝 | Text editor for notes |
| Calculator | 🧮 | Arithmetic, percentage, sign toggle |
| Files | 📁 | Virtual file system with folders, files, rename, delete |
| Aptitude Test | 🎯 | In-universe faction aptitude assessment |
| Manifesto | 📜 | Faction manifesto viewer |
| Settings | ⚙️ | Change password, switch appearance/faction |
| Fear Simulation | 😨 | Divergent-style fear landscape simulation |
| Chess | ♞ | Full chess game with 4 AI difficulty levels |

### Faction Theming

Six complete color themes inspired by the Divergent universe. Switch between them from the taskbar at any time.

| Faction | Symbol | Accent |
|---------|--------|--------|
| Dauntless | 🔥 | Red `#e84830` |
| Erudite | 👁 | Blue `#89b4fa` |
| Amity | 🌿 | Gold `#d4821a` |
| Abnegation | 🤲 | Gray `#909090` |
| Candor | ⚖️ | White `#e0e0e0` |
| Divergent | ✦ | Yellow `#ffc300` |

Each faction changes the desktop wallpaper, accent colors, backgrounds, borders, and all UI surfaces via CSS custom properties.

### Chess App

A fully rules-compliant chess implementation with AI opponent.

**Rules implemented:**
- All standard piece movement
- Castling (kingside and queenside)
- En passant
- Pawn promotion (Queen, Rook, Bishop, Knight)
- Check, checkmate, and stalemate detection
- Threefold repetition draw

**AI difficulty levels:**

| Level | Behavior |
|-------|----------|
| Beginner | Random legal moves |
| Intermediate | Minimax depth 2, positional evaluation |
| Expert | Minimax depth 3, alpha-beta pruning |
| Impossible | Minimax depth 4, MVV-LVA move ordering |

**Material advantage display** — captured pieces shown above/below the board with a `+N` point indicator for the leading side.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| State Management | Zustand 5 |
| Styling | CSS Modules + CSS custom properties |
| Deployment | GitHub Pages (`gh-pages`) |

---

## Project Structure

```
src/
├── apps/
│   ├── Chess/          # Chess game, engine, and logic
│   ├── Calculator/
│   ├── FileExplorer/
│   ├── FearSimulation/
│   ├── Manifesto/
│   ├── Notepad/
│   ├── Settings/
│   └── AptitudeTest/
├── components/
│   ├── Desktop/        # Desktop, icons, context menus
│   ├── Window/         # Window chrome and resize handles
│   ├── Taskbar/        # Taskbar, start menu, clock
│   ├── LockScreen/     # Auth overlay
│   ├── AppIcon/        # App icon component
│   └── FactionPicker/  # Theme switcher
├── store/              # Zustand stores (windows, theme, fs, lock, icons)
├── themes/             # Faction definitions and CSS variables
├── hooks/              # useDraggable, useResizable
├── assets/             # Faction wallpapers
└── types/              # Shared TypeScript types
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install and run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

---

## Lock Screen

The default access code is **`insurgent`**.

To change the password: open **Settings → Security** while logged in.

To reset a forgotten password, open the browser console (F12) and run:
```js
localStorage.removeItem('os-password')
```
Then refresh the page. The password resets to `insurgent`.

---

## Adding a New App

1. Create `src/apps/MyApp/MyApp.tsx` exporting a React component
2. Add a CSS module at `src/apps/MyApp/MyApp.module.css`
3. Register it in `src/store/useAppStore.ts`:

```ts
{ id: 'my-app', title: 'My App', icon: '🚀', component: MyApp }
```

The app will appear in the start menu and as a desktop icon automatically.
