# ⚔️ Epic RPG Battlemap VTT

[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![IndexedDB](https://img.shields.io/badge/Database-IndexedDB-007ACC?style=for-the-badge&logo=database&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

An ultra-sleek, responsive, and lightweight **Virtual Tabletop (VTT)** designed for DMs and players to run tactical RPG encounters in real-time. Built with a modern, glassmorphic dark theme, it is optimized for both desktop browsers and mobile touchscreens (like iPads and Android tablets).

---

## ✨ Features

- 🗺️ **IndexedDB Layout Persistence:** Load and manage multiple floorplans. Images and asset placements are stored locally in your browser's database so your campaign state is never lost.
- 📐 **Dynamic Grid Alignment:** Align map squares perfectly with your tokens using a real-time scale slider.
- 🛡️ **Interactive Creature Tokens:**
  - Distinct faction colors & glowing rings (Players/Allies, Hostiles, Neutrals).
  - Size configurations from Medium (1x1) up to Behemoth (12x12).
  - Contextual status marker badging (Dead, Poisoned, Blinded, Blessed, and more).
- 🔮 **Spell AoE Templates:** Spawn circles, cubes, cones, and lines with custom evocation element themes (Fire, Cold, Acid, Lightning).
- 📱 **Touchscreen Ready:** Optimized touch interactions (single-finger panning, two-finger pinch-to-zoom, tap-to-rotate spells, and long-press for status menus).
- 🎛️ **Collapsible DM Workspace:** Hide or show the control sidebar with a smooth slide transition that keeps the map canvas perfectly aligned.

---

## 🎮 Controls & Shortcuts

| Action | 🖥️ Desktop (Mouse & Keyboard) | 📱 Touchscreen (iPad / Tablet) |
| :--- | :--- | :--- |
| **Pan View** | Hold `Spacebar` + Drag background | Drag background |
| **Zoom Map** | Scroll mouse wheel | Two-finger Pinch |
| **Token Menu** | Right-click token | Touch & Hold |
| **Rotate Spells** | Hover + `Shift` + Scroll or press `R` | Tap spell template |
| **Delete Items** | Double-click item | Double-tap item |

---

## 🚀 Quick Start

Get the VTT running locally in seconds.

### 1. Clone & Install
```bash
git clone https://github.com/gregryork/EpicRpgBattleMap.git
cd EpicRpgBattleMap
npm install
```

### 2. Run Dev Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🛠️ Technology Stack

- **Framework:** [React 19](https://react.dev) + [Vite](https://vite.dev) (HMR enabled)
- **Styling:** Custom Vanilla CSS (featuring glassmorphism, responsive grid layouts, and hardware-accelerated transitions)
- **Database:** IndexedDB (for zero-latency offline map image and layout storage)
- **Icons:** Standard Emoji character glyphs (for cross-platform rendering without heavy asset loading)

---

## 📄 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.
