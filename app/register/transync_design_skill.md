# TRANSYNC DESIGN SKILL
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
--font-display: 'Orbitron', sans-serif;  /* headings, ETA numbers, wordmark, screen titles */
--font-body:    'DM Sans', sans-serif;   /* body text, inputs, advisory, UI labels */
```

### Exception — LoadingScreen only
LoadingScreen uses `'Syne'` inline for the compass wordmark and tagline.
This is intentional — do not apply Orbitron to LoadingScreen.

### Import (globals.css)
```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
```

### CSS utility class
```css
.font-orbitron { font-family: 'Orbitron', sans-serif; }
```

### Usage Rules
| Element | Font | Weight | Size | Special |
|---|---|---|---|---|
| ETA number | Orbitron | 800 | 42px+ | Cyan glow behind, .font-orbitron class |
| Screen titles | Orbitron | 700 | 22-28px | letter-spacing -0.02em |
| TRANSYNC wordmark (main app) | Orbitron | 800 | 18px | letter-spacing 0.35em |
| TRANSYNC wordmark (LoadingScreen) | Syne | 800 | 18px | letter-spacing 0.35em — inline only |
| Section labels (ETA, DEPART, ADVISORY) | DM Sans | 600 | 10px | UPPERCASE, letter-spacing 0.2em, color #64748b |
| Body / advisory text | DM Sans | 400 | 13-14px | line-height 1.6 |
| Input placeholders | DM Sans | 400 | 15-16px | color #475569 |
| Button text | DM Sans | 700 | 14-16px | |
| Cardinal labels N/E/S/W (LoadingScreen) | Syne | 700 | 11px | #94a3b8, N gets #38bdf8 after snap |

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
  --font-display:    'Orbitron', sans-serif;
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

### CSS utility classes (globals.css)
```css
.neu-extruded { box-shadow: -4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5); }
.neu-inset    { box-shadow: inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5); }
```

### Input focus — use focusedField state pattern (NOT CSS :focus)
```tsx
// Existing codebase uses inline styles throughout.
// CSS pseudo-selectors don't apply to inline-styled elements.
// Always use the focusedField React state pattern:
const inputWrapStyle = (field: string): CSSProperties => ({
  border: focusedField === field
    ? "1px solid rgba(56,189,248,0.6)"
    : "1px solid rgba(255,255,255,0.09)",
  boxShadow: focusedField === field
    ? "0 0 0 3px rgba(56,189,248,0.1), inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)"
    : "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
});
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
.btn-gradient:active   { transform: scale(0.97); }
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

```css
.chip-dest:hover {
  transform: translateY(-1px);
  border-color: rgba(56,189,248,0.4);
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.btn-tap:active { transform: scale(0.97); transition: transform 0.1s ease; }
.hud-handle-wrap:hover .hud-handle { width: 52px; transition: width 0.2s ease; }
.star-btn:hover { transform: scale(1.2); transition: transform 0.15s ease; }
```

---

## 9. LOADING SCREEN — COMPASS ANIMATION

### CRITICAL: LoadingScreen uses an 8-second timing chain. CSS only. No GSAP.

### Props:
```tsx
type Props = {
  onFading: () => void;   // fires at t=6500ms — triggers login crossfade
  onComplete: () => void; // fires at t=8000ms — unmounts loader
};
```

### Timing chain:
```
t=0ms:     component mounts — needle sweeps (3s/cycle, slow), pins wobble
t=400ms:   wordmark + tagline fade in (1s ease)
t=5500ms:  snapped=true → needle springs to N, pins lock, N cardinal → #38bdf8
t=6500ms:  fading=true (opacity 0 over 1.5s) + onFading() → login fades in
t=8000ms:  onComplete() → LoadingScreen unmounts
```

### SVG Coordinate Reference (viewBox="0 0 200 200", center at 100,100)
```
Outer ring:    cx=100, cy=100, r=85 — ring-pulse keyframe
Inner ring:    cx=100, cy=100, r=65
Crosshair H:   x1=35, y1=100, x2=165, y2=100
Crosshair V:   x1=100, y1=35, x2=100, y2=165

Cardinal pins: N=(100,15)  E=(185,100)  S=(100,185)  W=(15,100)
Cardinal labels: N=(100,8)  E=(196,104)  S=(100,198)  W=(4,104)

Needle:
  North (cyan):  M 100,30 L 106,100 L 100,115 L 94,100 Z
  South (slate): M 100,115 L 106,100 L 100,170 L 94,100 Z
  Transform-origin: 100px 100px

Pin wobble durations: N=1.8s, E=1.4s, S=2.2s, W=1.6s
```

### Snap Phase CSS:
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

### Login crossfade integration:
```tsx
// login/page.tsx — DO NOT add PageTransition or GSAP here
const [showLoader, setShowLoader] = useState(true);
const [loginVisible, setLoginVisible] = useState(false);
// onFading → setLoginVisible(true) — login opacity 0→1 over 1.5s
// onComplete → setShowLoader(false) — unmounts loader
```

---

## 10. AI INSIGHT CARD (Synced Insight)

```
Header:     "✦ Synced Insight" — DM Sans 600, 11px, UPPERCASE, #a78bfa
Icon class: .synced-star — violet-pulse keyframe
Border:     1px solid rgba(99,102,241,0.28)
Left accent: 3px solid rgba(99,102,241,0.6)
Background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))
Radius:     16px
Cursor:     ease-in-out 0.9s blink, border-radius:1, hidden when aiInsightLoading=false
```

```css
@keyframes blink       { 0%,100% { opacity:1; } 50% { opacity:0; } }
@keyframes ai-pulse    { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
@keyframes violet-pulse {
  0%   { filter: drop-shadow(0 0 0px rgba(139,92,246,0)); }
  50%  { filter: drop-shadow(0 0 6px rgba(139,92,246,0.7)); }
  100% { filter: drop-shadow(0 0 0px rgba(139,92,246,0)); }
}
```

---

## 11. Z-INDEX STACK

| Layer | z-index |
|---|---|
| LoadingScreen | 100 |
| ProfileSheet | 60 |
| ArrivalOverlay | 55 |
| NavigationHUD FABs | 40 |
| NavigationHUD panel | 30 |
| Planner overlay | 20 |

---

## 12. ANIMATION STACK (GSAP + LENIS)

### Libraries in use
- **GSAP + @gsap/react** — component enter/exit, page transitions
- **Lenis** — smooth scroll
- **CSS keyframes** — compass, btn-gradient, blink, ai-pulse, violet-pulse
  CSS animations are off-limits to GSAP — never replace them.

### GSAP Rules
- Always use `useGSAP()` hook — never raw `useEffect`
- Import: `import { useGSAP } from "@gsap/react"`
- Never mix GSAP and CSS transitions on the same property
- Set `willChange: "transform"` before animating, reset to `"auto"` in `onComplete`
- Kill all GSAP instances on component unmount

### GSAP Easing Reference
```
Page enter:            power2.out
Page exit:             power2.in
Component entrance:    back.out(1.4)
Spring snaps:          back.out(1.7)
Fade only:             power1.inOut
HUD slide up:          power3.out
Arrival overlay:       back.out(1.6) + scale
```

### GSAP Duration Standards
```
Page exit:             0.3s
Page enter:            0.4–0.45s
Component entrance:    0.35–0.45s
Micro-interactions:    0.15–0.2s
```

### Component Animation Targets
| Component | Animation | Constraint |
|---|---|---|
| AdvisoryPanel | opacity 0→1, y 20→0, back.out(1.4) on mount | — |
| NavigationHUD panel div only | y "100%"→0, power3.out | NOT the FABs — ResizeObserver drives FAB bottom |
| ArrivalOverlay | scale 0.92→1 + opacity 0→1, back.out(1.6) on mount | — |
| PageTransition wrapper | directional enter on mount | See directions below |
| TransitionRouter (layout.tsx) | opacity 0, y -20, power2.in on leave | — |

### NavigationHUD — ResizeObserver conflict rule
FABs are positioned dynamically via `ResizeObserver` watching `hudHeight`.
Animating the FABs with GSAP will cause them to jump during motion.
Only animate the HUD panel div. Always set `willChange: "transform"` before
animating and reset to `"auto"` in `onComplete`.

### PageTransition directions
```
app/page.tsx (main map):   direction="up"    → gsap.from y:30→0
app/register/page.tsx:     direction="right"  → gsap.from x:40→0
app/verify/page.tsx:       direction="right"  → gsap.from x:40→0
app/login/page.tsx:        ← EXCLUDED — has its own crossfade system
```

### Pages excluded from GSAP entirely
- `app/login/page.tsx` — crossfade driven by `loginVisible` state + 1.5s CSS opacity.
  Adding PageTransition creates two competing opacity animations. Off-limits.
- `app/components/LoadingScreen.tsx` — CSS-only compass animation. Off-limits.

### Lenis Config
```tsx
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
```

### Lenis — apply / exclude
| Container | Action | Reason |
|---|---|---|
| Planner overlay scrollable div | ✅ Apply | Main scroll content |
| Trip history panel | ✅ Apply | Nested scroll |
| Map container div | ❌ data-lenis-prevent | Google Maps owns gestures |
| ProfileSheet root div | ❌ data-lenis-prevent | position:fixed, own scroll context |

---

## 13. WHAT NOT TO DO

- Use Arial, Inter, Roboto, system-ui as primary font
- Use Syne outside of LoadingScreen — Orbitron everywhere else
- Use a single box-shadow and call it neumorphism
- Make all cards the same size, padding, opacity
- Use white or light backgrounds anywhere
- Animate everything — only animate what earns it
- Use border-radius: 8px — minimum 14px chips, 20px cards
- Skip left-border accent on hero cards
- Forget pointer-events: none on decorative overlays
- Mix GSAP and CSS transitions on the same property
- Apply GSAP to LoadingScreen — CSS only
- Apply PageTransition to login/page.tsx — it has its own crossfade
- Animate NavigationHUD FABs with GSAP — ResizeObserver drives position
- Use raw useEffect for GSAP — always useGSAP() hook

---

*End of Transync Design Skill. Use alongside TRANSYNC_HANDOFF.md.*