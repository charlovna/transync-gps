# TRANSYNC DESIGN SKILL
*Reference this in Claude Code sessions when working on any UI component.*
*Companion to TRANSYNC_HANDOFF.md — design-specific context only.*

---

## 1. AESTHETIC IDENTITY

Transync is a **dark neumorphism × futurism × bold typography** navigation instrument.

The single design question to ask before every UI decision:
> "Does this feel like it belongs in a premium vehicle HUD or a high-end maritime chart system?"

If the answer is no — redesign it.

**What Transync is NOT:**
- A generic SaaS dashboard
- A student project with flat cards
- A map app with a form slapped on top
- Anything that uses Inter, Roboto, or system-ui as a font

---

## 2. TYPOGRAPHY SYSTEM

### Font Stack
```css
--font-display: 'Syne', sans-serif;   /* headings, ETA, wordmark, labels */
--font-body:    'DM Sans', sans-serif; /* body text, inputs, advisory, UI labels */
```

### Import (globals.css)
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
```

### Usage Rules
| Element | Font | Weight | Size | Special |
|---|---|---|---|---|
| ETA number | Syne | 800 | 42px+ | Cyan glow behind |
| Screen titles | Syne | 700 | 22-28px | letter-spacing -0.02em |
| TRANSYNC wordmark | Syne | 800 | 18px | letter-spacing 0.35em |
| Section labels (ETA, DEPART, ADVISORY) | DM Sans | 600 | 10px | UPPERCASE, letter-spacing 0.2em, color #64748b |
| Body / advisory text | DM Sans | 400 | 13-14px | line-height 1.6 |
| Input placeholders | DM Sans | 400 | 15-16px | color #475569 |
| Button text | DM Sans | 700 | 14-16px | |
| Cardinal labels (N/E/S/W) | Syne | 700 | 11px | #94a3b8, N gets #38bdf8 after compass snap |

**Never use Arial, Inter, Roboto, system-ui, or sans-serif as a primary font.**

---

## 3. COLOR SYSTEM

### Core Palette
```
Background base:   #020617  ← never change this
Card surface:      rgba(15,23,42,0.82) to rgba(2,6,23,0.92)
Border default:    rgba(255,255,255,0.08)
Border active:     rgba(56,189,248,0.2)

Text primary:      #f8fafc
Text secondary:    #94a3b8
Text muted:        #64748b / #475569

Cyan (primary):    #38bdf8 / #06b6d4 / #22d3ee
Orange (accent):   #fb923c / #f97316
Indigo (AI):       #6366f1 / #a78bfa / #c4b5fd
Emerald (success): #10b981
Red (danger):      #ef4444
Yellow (warning):  #eab308
```

### CSS Variables (define in :root)
```css
:root {
  --color-bg:        #020617;
  --color-surface:   rgba(15,23,42,0.82);
  --color-border:    rgba(255,255,255,0.08);
  --color-cyan:      #38bdf8;
  --color-orange:    #fb923c;
  --color-indigo:    #6366f1;
  --color-emerald:   #10b981;
  --color-text-1:    #f8fafc;
  --color-text-2:    #94a3b8;
  --color-text-3:    #64748b;
  --font-display:    'Syne', sans-serif;
  --font-body:       'DM Sans', sans-serif;
}
```

---

## 4. DARK NEUMORPHISM SYSTEM

Neumorphism on dark backgrounds uses TWO shadows simultaneously.
**Never use just one shadow — it looks like a basic drop shadow, not neumorphism.**

### Shadow Tokens
```css
/* Extruded — cards, chips, buttons, avatar */
--neu-extruded: -4px -4px 8px rgba(255,255,255,0.05),
                 4px  4px 12px rgba(0,0,0,0.5);

/* Inset / pressed — inputs, textareas, search fields */
--neu-inset: inset -2px -2px 6px rgba(255,255,255,0.04),
             inset  2px  2px 8px rgba(0,0,0,0.5);

/* ETA tile — extruded + cyan ambient glow */
--neu-eta: -4px -4px 8px rgba(255,255,255,0.05),
            4px  4px 12px rgba(0,0,0,0.5),
            0 0 20px rgba(56,189,248,0.15);

/* Toggle thumb */
--neu-toggle: -2px -2px 4px rgba(255,255,255,0.08),
               2px  2px 6px rgba(0,0,0,0.6);

/* Input focused state — inset + focus ring */
--neu-focus: inset -2px -2px 6px rgba(255,255,255,0.04),
             inset  2px  2px 8px rgba(0,0,0,0.5),
             0 0 0 3px rgba(56,189,248,0.1);
```

### Risk Badge Glows
```css
.badge-low    { box-shadow: 0 0 8px rgba(16,185,129,0.45); }
.badge-medium { box-shadow: 0 0 8px rgba(234,179,8,0.45); }
.badge-high   { box-shadow: 0 0 8px rgba(239,68,68,0.45); }
```

### When to Apply
| Element | Shadow Type |
|---|---|
| Cards (route advisory, weather, AI insight) | extruded |
| Input fields (destination, password, username) | inset |
| ETA number tile | eta (extruded + cyan glow) |
| Popular destination chips | extruded |
| Avatar / profile button | extruded |
| Gyroscopic toggle thumb | toggle |
| Focused input | focus (replaces inset) |
| Flat text areas (advisory text body) | none |

---

## 5. CARD HIERARCHY

Not all cards are equal. Apply this visual hierarchy:

| Card | Border | Left Accent | Backdrop Blur | Border Radius |
|---|---|---|---|---|
| Route Advisory (hero) | rgba(56,189,248,0.2) | 3px solid rgba(56,189,248,0.6) | 32px | 28px |
| Weather | rgba(16,185,129,0.15) | 3px solid rgba(16,185,129,0.5) | 24px | 24px |
| Synced Insight (AI) | rgba(99,102,241,0.28) | 3px solid rgba(99,102,241,0.6) | 24px | 20px |
| Standard (searches, popular) | rgba(255,255,255,0.08) | none | 20px | 20-24px |
| Bottom HUD | rgba(56,189,248,0.3) top only | none | 28px | 24px 24px 0 0 |

---

## 6. FUTURISM ACCENTS

### Scanline Texture (login page only)
```css
.scanline-overlay {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.08) 2px,
    rgba(0,0,0,0.08) 4px
  );
  pointer-events: none;
}
```

### Bottom HUD Top Edge Glow
```css
border-top: 1px solid rgba(56,189,248,0.3);
box-shadow: 0 -1px 16px rgba(56,189,248,0.12);
```

### Background Atmosphere (login, register, loading screen)
```css
/* Layer these in order — all position: absolute, inset: 0 */
/* 1. Base */ background: #020617;
/* 2. Top radial */ background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.13) 0%, transparent 70%);
/* 3. Bottom right */ background: radial-gradient(ellipse 60% 50% at 80% 100%, rgba(99,102,241,0.1) 0%, transparent 65%);
/* 4. Bottom left */ background: radial-gradient(ellipse 50% 40% at 10% 90%, rgba(16,185,129,0.07) 0%, transparent 60%);
/* 5. Grid */ background: linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px) 0 0 / 48px 48px,
              linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px) 0 0 / 48px 48px;
/* 6. Scanline (login/loading only) */ /* scanline-overlay class above */
```

---

## 7. ANIMATED GRADIENT BUTTONS

All primary CTAs use the `btn-gradient` class.

```css
/* globals.css */
.btn-gradient {
  background: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6, #f97316, #06b6d4);
  background-size: 300% 100%;
  animation: gradient-flow 5s ease infinite;
  border: none;
  color: #fff;
  font-family: var(--font-body);
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s ease, opacity 0.2s ease;
}

.btn-gradient:active {
  transform: scale(0.97);
}

.btn-gradient:disabled {
  animation-play-state: paused;
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes gradient-flow {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

Applied to: Get Route Info, Start Trip, Update Password, Plan New Route (arrival).

---

## 8. MICRO-INTERACTIONS

Apply these consistently — never skip them:

```css
/* Input focus */
input:focus, textarea:focus {
  border-color: rgba(56,189,248,0.6);
  box-shadow: var(--neu-focus);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Chip / button hover lift */
.chip:hover {
  transform: translateY(-1px);
  border-color: rgba(56,189,248,0.4);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

/* Button press */
button:active:not(:disabled) {
  transform: scale(0.97);
  transition: transform 0.1s ease;
}

/* HUD drag handle expand on hover */
.hud-handle:hover {
  width: 52px;
  transition: width 0.2s ease;
}
```

---

## 9. LOADING SCREEN — COMPASS ANIMATION

### SVG Coordinate Reference (viewBox="0 0 200 200", center at 100,100)
```
Outer ring:    cx=100, cy=100, r=85
Inner ring:    cx=100, cy=100, r=65
Crosshair H:   x1=35, y1=100, x2=165, y2=100
Crosshair V:   x1=100, y1=35, x2=100, y2=165

Cardinal pin positions (on outer ring edge):
N: cx=100, cy=15   (100, 100-85)
E: cx=185, cy=100  (100+85, 100)
S: cx=100, cy=185  (100, 100+85)
W: cx=15,  cy=100  (100-85, 100)

Cardinal label positions (outside ring):
N label: x=100, y=8
E label: x=196, y=104
S label: x=100, y=198
W label: x=4,   y=104

Needle path (elongated diamond, origin 100,100):
North tip: M 100,30
Body:      L 106,100 L 100,115 L 94,100 Z
South tip: M 100,115 L 106,100 L 100,170 L 94,100 Z
Transform origin: 100px 100px (center)
```

### Chaos Phase Keyframes
```css
@keyframes needle-chaos {
  0%   { transform: rotate(0deg); }
  8%   { transform: rotate(127deg); }
  17%  { transform: rotate(43deg); }
  26%  { transform: rotate(251deg); }
  35%  { transform: rotate(88deg); }
  44%  { transform: rotate(310deg); }
  53%  { transform: rotate(155deg); }
  62%  { transform: rotate(67deg); }
  71%  { transform: rotate(290deg); }
  80%  { transform: rotate(112deg); }
  90%  { transform: rotate(205deg); }
  100% { transform: rotate(348deg); }
}

@keyframes pin-wobble-n {
  0%,100% { transform: translateY(0) rotate(0deg); }
  25%     { transform: translateY(-4px) rotate(-12deg); }
  75%     { transform: translateY(2px) rotate(8deg); }
}
@keyframes pin-wobble-e {
  0%,100% { transform: translateX(0) rotate(0deg); }
  30%     { transform: translateX(3px) rotate(15deg); }
  70%     { transform: translateX(-2px) rotate(-9deg); }
}
@keyframes pin-wobble-s {
  0%,100% { transform: translateY(0) rotate(0deg); }
  40%     { transform: translateY(4px) rotate(10deg); }
  60%     { transform: translateY(-3px) rotate(-14deg); }
}
@keyframes pin-wobble-w {
  0%,100% { transform: translateX(0) rotate(0deg); }
  20%     { transform: translateX(-4px) rotate(-11deg); }
  80%     { transform: translateX(3px) rotate(13deg); }
}

/* Pin animation durations: N=0.7s, E=0.5s, S=0.9s, W=0.6s */
/* All infinite during chaos, stopped on snap via class toggle */
```

### Snap Phase
```css
.compass-needle.snapped {
  transform: rotate(0deg) !important;
  animation: none !important;
  transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
}
.compass-pin.snapped {
  transform: translate(0,0) rotate(0deg) !important;
  animation: none !important;
  transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
}
.cardinal-n.snapped { fill: #38bdf8; }
```

### Timing (via useEffect setTimeout chain)
```
t=0ms:    component mounts, chaos animations start
t=400ms:  wordmark + tagline fade in
t=2000ms: add class 'snapped' to needle + pins
t=2500ms: add class 'fading' to LoadingScreen root
t=3000ms: call onComplete() prop
```

### Fadeout
```css
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  opacity: 1;
  transition: opacity 0.35s ease;
}
.loading-screen.fading {
  opacity: 0;
  pointer-events: none;
}
```

---

## 10. AI INSIGHT CARD (Synced Insight)

```
Header label:   "✦ Synced Insight"
Font:           DM Sans 600, 11px, UPPERCASE, letter-spacing 0.15em
Color:          #a78bfa
Left border:    3px solid rgba(99,102,241,0.6)
Background:     linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))
Border:         1px solid rgba(99,102,241,0.28)
Border radius:  16px

Loading state:  Pulsing "thinking..." text via ai-pulse keyframe
Streaming:      Text appears progressively + blinking cursor
Final state:    Cursor disappears, text stable

✦ icon:        Soft violet pulse on first appearance
```

```css
@keyframes blink    { 0%,100% { opacity:1; } 50% { opacity:0; } }
@keyframes ai-pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
@keyframes violet-pulse {
  0%   { filter: drop-shadow(0 0 0px rgba(139,92,246,0)); }
  50%  { filter: drop-shadow(0 0 6px rgba(139,92,246,0.7)); }
  100% { filter: drop-shadow(0 0 0px rgba(139,92,246,0)); }
}
```

---

## 11. WHAT NOT TO DO

Never do any of these in Transync:
- Use `font-family: Arial` or `font-family: sans-serif` as primary font
- Use a single `box-shadow` and call it neumorphism
- Make all cards the same size, padding, and opacity
- Use `background: white` or light backgrounds anywhere
- Add borders without also considering the backdrop-blur
- Animate everything — only animate what earns it
- Use `border-radius: 8px` — minimum is 14px for chips, 20px for cards
- Skip the left-border accent on hero cards
- Forget `pointer-events: none` on overlay decorative elements
- Use `z-index` values below 10 for overlays (LoadingScreen=100, ProfileSheet=60, ArrivalOverlay=55, NavigationHUD=30, Planner=20)

---

*End of Transync Design Skill. Use alongside TRANSYNC_HANDOFF.md.*