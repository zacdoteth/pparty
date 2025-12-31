# PREDICTION PARTY

**The Turntable.fm for Crypto Prediction Markets**

A mobile-first web view for the rektgang Telegram Prediction Market bot. Step into the smoky, neon-lit underground of Neo-Tokyo where crowds gather to bet on the future.

---

## The Vision

Prediction Party transforms cold, sterile trading interfaces into a living, breathing social experience. Inspired by the golden era of Turntable.fm, users don't just place bets—they *join the crowd*. They see others. They vibe together. They become part of something.

**The Vibe:** A high-end underground nightclub in Neo-Tokyo. Dark. Neon. Exclusive.

**The Core Loop:**
1. Enter a room (a Market)
2. See the crowd
3. Vote YES or NO
4. Join the crowd

---

## Design Philosophy

### Shokunin (職人) — The Artisan Spirit

Every pixel is intentional. Every animation has weight. We obsess over details invisible to the average eye.

### Digital Tactility

Screen elements should feel like they have weight, friction, and "juice." When you press a button, you should *feel* it. When heads bob, they should bounce with Nintendo-level polish.

---

## Technical Stack

**Zero Dependencies. Pure Craft.**

- Raw HTML5
- Vanilla CSS3 (Grid, Flexbox, Custom Properties, Animations)
- Vanilla JavaScript (ES6+)
- No frameworks. No build tools. No compromise.

---

## Core Features

### The "Head" Physics Engine
- Circular avatar containers with generated blocky bodies
- Color-coded by bet position (Short/Long)
- 128 BPM synchronized bobbing animation
- Organic crowd feel via staggered animation delays
- Bouncy easing: `cubic-bezier(0.25, 1.5, 0.5, 1)`

### The Environment
- **Background:** Deep purple gradient (`#0f0c29` → `#302b63` → `#24243e`)
- **Perspective:** CSS 3D tilted floor for stage depth
- **Lighting:** Dynamic stage lights via CSS box-shadows
  - Left (NO/Short): Red glow
  - Right (YES/Long): Cyan glow

### The UI Layout

```
┌─────────────────────────┐
│      DJ BOOTH           │  ← Market Info + LED Ticker
│   "Will BTC hit $100k?" │
├─────────────────────────┤
│                         │
│   [NO]     👤     [YES] │  ← The Floor (Crowd)
│    ●●●    YOU     ●●●   │
│                         │
├─────────────────────────┤
│  ┌─────┐  ◉  ┌─────┐   │  ← Control Deck
│  │SHORT│     │LONG │   │
│  └─────┘     └─────┘   │
└─────────────────────────┘
```

### The Control Deck
- Industrial high-fidelity aesthetic
- Brushed metal textures (CSS gradients)
- Central jog wheel for bet amounts
- Tactile button feedback (`transform: scale(0.95)`)

### The "Juice"
- Glassmorphism via `backdrop-filter: blur(10px)`
- Floating Telegram-style chat messages
- Haptic-feeling button interactions
- Organic crowd animations

---

## File Structure

```
predictionparty/
├── README.md           # You are here
├── prototype.html      # Single-file prototype (375x812 mobile)
└── assets/             # Future: Sound files, custom fonts
```

---

## Running the Prototype

Simply open `prototype.html` in any modern browser. For the authentic experience:

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set dimensions to 375 x 812 (iPhone X)
4. Refresh and vibe

---

## Design Tokens

```css
/* Colors */
--bg-dark: #0f0c29;
--bg-mid: #302b63;
--bg-light: #24243e;
--neon-cyan: #00f5ff;
--neon-pink: #ff0080;
--neon-red: #ff3366;

/* Typography */
--font-mono: 'SF Mono', 'Fira Code', monospace;

/* Animation */
--bounce: cubic-bezier(0.25, 1.5, 0.5, 1);
--bpm: 128;
--beat: calc(60s / var(--bpm));
```

---

## Browser Support

- Chrome 88+
- Safari 14+
- Firefox 78+
- Edge 88+

Requires support for:
- CSS Grid & Flexbox
- CSS Custom Properties
- `backdrop-filter`
- CSS Animations with `cubic-bezier`

---

## Credits

**Design & Development:** Toshiro

**Inspiration:**
- Turntable.fm (RIP, legend)
- Teenage Engineering OP-1
- Nintendo UI/UX philosophy
- Neo-Tokyo aesthetic

---

## License

MIT — Build something beautiful.

---

*"The details are not the details. They make the design."* — Charles Eames
