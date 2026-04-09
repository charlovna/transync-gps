# TRANSYNC — CLAUDE CODE HANDOFF BRIEF
*Generated from full build conversation. Paste this at the start of any new Claude Code session.*
*Companion design reference: `app/register/transync_design_skill.md` — paste alongside this for UI work.*

---

## 1. PROJECT OVERVIEW

**App name:** Transync
**Type:** Prototype commuter navigation and advisory web app
**Target users:** Up to 5 test users
**Context:** Capstone / thesis project — Lipa City, Batangas, Philippines
**Stack:** Next.js (frontend) + Node.js/Express (backend) + SQLite (database)
**Primary API:** Google Maps (Maps JS, Directions, Geocoding, Distance Matrix, Places) + Open-Meteo (weather, free)

Transync is a navigation app that works and feels like Google Maps / Waze, with an added AI-driven advisory layer on top of standard routing — providing traffic-aware ETAs, weather-informed advisories, and commuter guidance specific to Lipa City.

---

## 2. FOLDER STRUCTURE

```
transync/
  .claude/
    launch.json               ← Dev server configs (backend port 8000, frontend port 3000)
  transync-backend/         ← Express backend
    server.js               ← Main backend file (auth + routing + geocoding + weather + searches + trips)
    transync.db             ← SQLite database (auto-created on first run)
    .env                    ← Contains API keys + JWT_SECRET
    package.json
  transync-gps/             ← Next.js frontend
    app/
      api/
        advisory/
          route.ts          ← Server-side Claude AI streaming endpoint
      components/
        LoadingScreen.tsx   ← Compass loading animation (8s, chaos → snap → crossfade into login)
        MapView.tsx         ← Google Maps component (receives isLoaded + userPos + zoomRequest as props)
        PlannerPanel.tsx    ← Step 1: search form, waypoint stops, weather, popular destinations, recent searches, trip history
        AdvisoryPanel.tsx   ← Step 2: back arrow, multi-stop badge, ETA/traffic tiles, advisory text, AI insight card, gyro toggle, Start Trip
        NavigationHUD.tsx   ← Step 3: bottom HUD (minimize/expand) + Recenter/Zoom/Gyro FABs (ResizeObserver-driven placement)
        ArrivalOverlay.tsx  ← Arrival screen: checkmark, stats, star rating, Plan New Route
        ProfileSheet.tsx    ← Full-screen profile overlay: avatar, stats, change password, sign out
        EnvTest.tsx
      lib/
        types.ts            ← Shared TypeScript types: LatLng, RiskLevel, RouteData, WaypointStop, WeatherData, RecentSearch, TripRecord, ProfileData, RiskBadge
      login/
        page.tsx            ← Login page (renders LoadingScreen first, then crossfades into login card)
      register/
        page.tsx            ← Registration page
        TRANSYNC_HANDOOF.md ← This file
        transync_design_skill.md ← Design reference (fonts, colors, shadows, animations)
      page.tsx              ← Orchestrator only: all state, all useEffects, all handlers
      layout.tsx            ← PWA meta tags + manifest link
      globals.css           ← Global styles: fonts, btn-gradient, neumorphism classes, HUD handle, animations
    public/
      manifest.json         ← PWA manifest
      icons/
        icon.svg            ← App icon (SVG — works on Chrome/Android)
        icon-192.png        ← ⚠ NOT YET CREATED — needed for iOS PWA install
        icon-512.png        ← ⚠ NOT YET CREATED — needed for iOS PWA install
    .env.local              ← Frontend env vars
    next.config.ts
    package.json
```

---

## 3. ENVIRONMENT VARIABLES

### `transync-backend/.env`
```
GOOGLE_MAPS_SERVER_API_KEY=your_server_key_here
FRONTEND_URL=http://localhost:3000
PORT=8000
JWT_SECRET=transync_super_secret_key_change_this
```

### `transync-gps/.env.local`
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key_here
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
ANTHROPIC_API_KEY=sk-ant-...        ← server-side only, NOT NEXT_PUBLIC_
```

---

## 4. TWO-KEY API ARCHITECTURE (CRITICAL)

Two separate Google Cloud API keys are used. Do not merge them.

### Browser key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Enable only:** Maps JavaScript API
- **Restriction:** HTTP referrers (`localhost:3000/*`, production domain)
- **Used for:** Loading the map UI and Places Autocomplete widget

### Server key → `GOOGLE_MAPS_SERVER_API_KEY`
- **Enable:** Directions API, Geocoding API, Distance Matrix API
- **Restriction:** IP address of server
- **Used for:** All backend API calls — route generation, reverse geocoding, ETA
- Never sent to the browser

---

## 5. RUNNING THE PROJECT

**Backend:**
```bash
cd transync-backend
node server.js
# Expected: "SQLite database ready → transync.db"
# Expected: "Transync backend running on http://localhost:8000"
```

**Frontend:**
```bash
cd transync-gps
npm run dev
# Runs on http://localhost:3000
```

If port 8000 is already in use:
```bash
npx kill-port 8000
```

---

## 6. BACKEND — server.js

### All API endpoints:
- `GET /` — health check
- `POST /route` — main route advisory. Takes `{ origin, destination, mode, waypoints? }`. Returns polyline, ETA, risk level, weather-aware advisory text, departure recommendation, steps, origin/destination positions, `distance_km`, and `waypoints[]` positions.
- `GET /geocode/reverse?lat=&lng=` — reverse geocodes GPS coords via server key. Returns `{ address }`.
- `GET /weather?lat=&lng=` — fetches current weather from Open-Meteo (no API key needed). Returns `{ temperature, feels_like, weather_code, condition: { label, icon }, precipitation, wind_speed }`.
- `POST /auth/register` — creates user. Fields: `username`, `email`, `password`. Returns JWT + user.
- `POST /auth/login` — login by username or email + password. Returns JWT + user.
- `GET /auth/me` — requires Bearer token. Returns user + `trip_count` + `search_count`.
- `POST /auth/change-password` — requires Bearer token. Fields: `current_password`, `new_password`.
- `POST /searches` — save a search (auth required). Fields: `destination`, `sub_address`. Auto-dedupes and keeps last 10.
- `GET /searches` — returns last 5 searches for user (auth required).
- `DELETE /searches/:id` — delete a search (auth required).
- `POST /trips/start` — record trip start (auth required). Fields: `origin_label`, `destination_label`, `eta_minutes`, `risk_level`, `distance_km`. Returns `{ trip_id }`.
- `PATCH /trips/:id/end` — record trip end (auth required). Sets `ended_at`.
- `GET /trips` — returns last 10 trips for user (auth required).

### Database tables:
```sql
users    (id, username, email, password, created_at)
searches (id, user_id, destination, sub_address, searched_at)
trips    (id, user_id, origin_label, destination_label, eta_minutes, risk_level, distance_km, started_at, ended_at)
```

### Weather integration:
- `/route` fetches weather from Open-Meteo if origin is GPS coords (`lat,lng` format)
- Weather adjusts risk level: thunderstorm → always High; rain + Low → elevates to Medium
- Weather note appended to `advisory_text` automatically
- Frontend fetches weather separately for the weather card via `GET /weather`

### Route geometry fix (do not revert):
`origin_position` / `destination_position` use `leg.start_location` / `leg.end_location` — NOT geocoding API positions.

### Multi-stop routing:
- `getDirections()` accepts optional `waypoints[]` string array — passed as `waypoints=addr1|addr2` to Google Directions API
- For single-leg routes: Distance Matrix API used for accurate traffic duration
- For multi-leg routes: leg durations aggregated directly from Directions API response
- Waypoint positions returned as `waypoints[]` in response — each entry: `{ address, coords: null, position: LatLng }`

### Packages installed in backend:
```
express, cors, dotenv, better-sqlite3, bcryptjs, jsonwebtoken
```

---

## 7. FRONTEND — KEY BEHAVIORS

### Auth flow:
1. App opens → `app/page.tsx` checks localStorage / sessionStorage for `transync_token`
2. No token → redirect to `/login`
3. Login success → token + user stored, redirect to `/`
4. Main page calls `GET /auth/me` to verify token and get real username
5. "Stay Signed In" checked → `localStorage`; unchecked → `sessionStorage`
6. Sign out button clears both storages and redirects to `/login`

### Token storage keys:
- `transync_token` — JWT string
- `transync_user` — JSON stringified `{ id, username, email }`

### Helper — `getToken()`:
```tsx
function getToken(): string {
  return localStorage.getItem("transync_token") || sessionStorage.getItem("transync_token") || "";
}
```

### Main page flow (3-step sequential):
1. **Step 1 — Search screen** (default): PlannerPanel shown.
2. **Step 2 — Advisory screen**: After Get Route Info succeeds → `showAdvisory = true`. AdvisoryPanel replaces PlannerPanel.
3. **Step 3 — Navigation**: After Start Trip → `showPlanner = false`. Full-screen map + NavigationHUD.

### `showAdvisory` state — sequential flow contract:
```
showAdvisory = false  →  PlannerPanel rendered  (Step 1)
showAdvisory = true   →  AdvisoryPanel rendered (Step 2) — set by handleGetRoute on success
Start Trip            →  showPlanner = false    (Step 3) — both panels hidden, HUD visible
End Trip / Arrival    →  showPlanner = true, showAdvisory = false  (back to Step 1)
```

---

## 8. MULTI-STOP ROUTING

### Types (`lib/types.ts`):
```ts
export type WaypointStop = {
  address: string;
  coords: LatLng | null;   // set when user picks from Places Autocomplete
  position?: LatLng;       // set by backend from Directions API leg end_location
};

// RouteData now includes:
waypoints?: WaypointStop[];
distance_km?: number;
```

### State in `page.tsx`:
```tsx
const [waypointInputs, setWaypointInputs] = useState<WaypointStop[]>([]);
```

Handlers: `handleWaypointAdd`, `handleWaypointRemove(idx)`, `handleWaypointChange(idx, address, coords)`

### Route request:
```tsx
const waypointValues = waypointInputs
  .filter((w) => w.address.trim().length > 0)
  .map((w) => w.coords ? `${w.coords.lat},${w.coords.lng}` : w.address.trim());

body: JSON.stringify({ origin, destination, mode: "driving", waypoints: waypointValues })
```

### Waypoints reset on:
- `onSearchDifferent` → `setWaypointInputs([])`

### PlannerPanel waypoint UI:
- Max 3 stops (`MAX_WAYPOINTS = 3`)
- "Add Stop" button appears next to Destination label (hidden when at max)
- Each stop uses a self-contained `WaypointRow` component with its own Places Autocomplete instance
- Left connector rail dynamically renders intermediate cyan dots for each stop
- Stop count badge below route inputs when stops are active: "2 stops added · 3 legs total"
- Remove button (×) on each row with red tint

### AdvisoryPanel multi-stop badge:
- Shown when `routeData.waypoints?.length > 0`
- Displays stop count and short `→` preview: "Stop1 → Stop2 → Destination"
- Styled with cyan border, same card pattern as other advisory cards

### MapView waypoint markers:
- Waypoint markers labeled B, C, D… (origin=A, destination shifts letter up)
- Camera `fitBounds()` includes all waypoint positions alongside origin/destination

---

## 9. MAPVIEW.tsx — KEY DETAILS

### Props:
```tsx
type MapViewProps = {
  routeData?: RouteData | null;
  loading?: boolean;
  tripStarted?: boolean;
  gyroEnabled?: boolean;
  recenterRequest?: number;
  isLoaded?: boolean;
  userPos?: LatLng | null;
  zoomRequest?: { delta: number; seq: number };
};
```

### Critical: `useJsApiLoader` lives in `page.tsx`, NOT MapView
```tsx
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing")[] = ["places"];
const { isLoaded } = useJsApiLoader({
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  libraries: GOOGLE_MAPS_LIBRARIES,
});
```

### Map options:
```tsx
options={{
  styles: midnightIndigoMapStyle,
  disableDefaultUI: true,
  gestureHandling: "greedy",  // single-finger pan + pinch-zoom on mobile
  scrollwheel: true,          // desktop scroll-to-zoom
  zoomControl: false,         // custom FABs used instead
  minZoom: 3,
  maxZoom: 21,
}}
```

### Zoom via `zoomRequest`:
- `page.tsx` holds `zoomRequest: { delta: number, seq: number }` state
- FABs call `setZoomRequest((p) => ({ delta: ±1, seq: p.seq + 1 }))` 
- MapView `useEffect` fires on `seq` change, applies `map.setZoom(current + delta)`

### Heading smoothing:
- Factor `0.10` (was 0.22) — slower, eliminates jitter
- Minimum movement threshold: `8m` (was 4m) — ignores GPS noise

---

## 10. AUTOCOMPLETE INIT

```tsx
useEffect(() => {
  if (!isLoaded || !authChecked || !destinationInputRef.current) return;
  const ac = new google.maps.places.Autocomplete(destinationInputRef.current, {
    bounds: ...,
    strictBounds: false,
    componentRestrictions: { country: "ph" },
    fields: ["formatted_address", "geometry", "name"],
  });
  ac.addListener("place_changed", () => {
    const place = ac.getPlace();
    onDestinationChange(place.formatted_address || place.name || "");
    const loc = place.geometry?.location;
    onDestinationCoordsChange(loc ? { lat: loc.lat(), lng: loc.lng() } : null);
  });
}, [isLoaded, authChecked]);
```

`destinationCoords` state: when set, `handleGetRoute` sends `lat,lng` as destination — bypasses backend geocoding, eliminates ZERO_RESULTS.

Each `WaypointRow` in PlannerPanel has its own identical Autocomplete instance, initialized in its own `useEffect`.

---

## 11. WEATHER

- **Source:** Open-Meteo API — free, no API key, PH-accurate
- **Backend endpoint:** `GET /weather?lat=&lng=`
- **Frontend:** fetched once on first GPS fix via `weatherFetchedRef`

---

## 12. AI ADVISORY LAYER

### Architecture:
- **Next.js API route:** `app/api/advisory/route.ts` — server-side, keeps `ANTHROPIC_API_KEY` secret
- **Model:** `claude-sonnet-4-6` via `@anthropic-ai/sdk`
- **Trigger:** Called non-blocking immediately after `setRouteData(data)` in `handleGetRoute`
- **Transport:** Streams plain text → smooth typewriter effect in the browser

### API route:
- POST — accepts `{ destination, eta_minutes, risk_level, advisory_text, weather }`
- Uses `client.messages.stream()` → pipes `text_delta` chunks into a `ReadableStream`
- Returns `Content-Type: text/plain; charset=utf-8`
- `max_tokens: 160`, 2-sentence constraint

### Double-invoke guard (React StrictMode):
```tsx
const aiInsightFetchedRef = useRef(false);

const fetchAiInsight = async (data: RouteData) => {
  if (aiInsightFetchedRef.current) return;
  aiInsightFetchedRef.current = true;
  // ... stream ...
};
// Reset in handleGetRoute and onSearchDifferent:
aiInsightFetchedRef.current = false;
```

### Smooth typewriter implementation:
```tsx
// streamBufferRef — raw text received from stream
// displayLenRef   — chars currently shown in UI
// typewriterRef   — setInterval handle

const startTypewriter = () => {
  typewriterRef.current = window.setInterval(() => {
    const buf = streamBufferRef.current;
    const cur = displayLenRef.current;
    if (cur >= buf.length) return;
    const step = buf[cur] === " " ? 2 : 1; // slightly faster on spaces = natural pacing
    const next = Math.min(cur + step, buf.length);
    displayLenRef.current = next;
    setAiInsight(buf.slice(0, next));
  }, 18); // 18ms per tick ≈ smooth character reveal
};
// On stream end: flush interval checks displayLen >= bufLen, then clears typewriter
```
Buffer fills from network stream; typewriter interval reads it. Decoupled — typewriter always catches up even on fast connections.

### Cursor (AdvisoryPanel):
```tsx
<span style={{ display: "inline-block", width: 2, height: "1em", background: "#818cf8",
  marginLeft: 3, verticalAlign: "text-bottom", borderRadius: 1,
  animation: "blink 0.9s ease-in-out infinite" }} />
```
`blink` keyframe uses `ease-in-out` (not `step-end`) for soft professional fade — disappears when `aiInsightLoading` is false.

### UI (AdvisoryPanel):
- Card: `border: 1px solid rgba(99,102,241,0.28)`, indigo/violet gradient background
- Header: `✦ Synced Insight` label (not "Transync AI") in `#a78bfa`
- `.synced-star` class on ✦ icon — `violet-pulse` keyframe animation

### Env var:
```
# transync-gps/.env.local (server-side only — NOT NEXT_PUBLIC_)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 13. DYNAMIC ETA

ETA updates every 15 seconds while a trip is active — mirrors Google Maps behavior.

### Implementation (page.tsx):
```tsx
// At handleStartTrip: record avg speed from original route
if (routeData?.eta_minutes && routeData?.distance_km) {
  originalEtaMpsRef.current = (routeData.distance_km * 1000) / (routeData.eta_minutes * 60);
}

// useEffect — runs every 15s during trip
useEffect(() => {
  if (!tripStarted || !routeData) return;
  const tick = () => {
    if (originalEtaMpsRef.current > 0 && currentPosition && routeData.destination_position) {
      // Primary: distance-to-destination / avg speed
      const remaining = getDistanceMeters(currentPosition, routeData.destination_position);
      const etaMin = Math.max(1, Math.round(remaining / originalEtaMpsRef.current / 60));
      setRouteData((prev) => prev ? { ...prev, eta_minutes: etaMin } : prev);
    } else {
      // Fallback: count down from original ETA by elapsed time
      const elapsedMin = (Date.now() - tripStartTimeRef.current) / 60000;
      const remaining = Math.max(1, Math.round((routeData.eta_minutes ?? 0) - elapsedMin));
      setRouteData((prev) => prev ? { ...prev, eta_minutes: remaining } : prev);
    }
  };
  tick(); // immediate on trip start
  const id = window.setInterval(tick, 15000);
  return () => window.clearInterval(id);
}, [tripStarted]); // intentionally minimal deps
```

ETA displayed in NavigationHUD (expanded + minimized rows) and updates live.

---

## 14. ARRIVAL DETECTION

- `useEffect` watches `[currentPosition, tripStarted]`
- Within 150m of `routeData.destination_position` → arrival fires
- `arrivalTriggeredRef` prevents double-firing
- `tripStartTimeRef` records `Date.now()` at `handleStartTrip`

### Computed metrics:
- **Duration** — `Math.round((Date.now() - tripStartTimeRef.current) / 60000)` min, min 1
- **AI Accuracy** — base 88% + 5% if weather loaded + 3% for Low risk − 6% for High risk, clamped 75–99%

---

## 15. LOADING SCREEN

### File: `app/components/LoadingScreen.tsx`

### Props:
```tsx
type Props = {
  onFading: () => void;   // fires at t=6500ms — triggers login fade-in beneath
  onComplete: () => void; // fires at t=8000ms — unmounts loader
};
```

### Timing chain:
```
t=0ms:     compass mounts, needle sweeps (3s/cycle, slow), cardinal pins wobble
t=400ms:   wordmark + tagline fade in (1s ease)
t=5500ms:  snapped=true → needle springs to N, pins lock, N cardinal → #38bdf8, outer ring brightens
t=6500ms:  fading=true (opacity: 0 over 1.5s) + onFading() → login fades in simultaneously
t=8000ms:  onComplete() → LoadingScreen unmounts
```

### SVG compass (viewBox 0 0 200 200, all coords from design skill §9):
- Outer ring: cx=100, cy=100, r=85 — pulses via `ring-pulse` keyframe
- Inner ring: cx=100, cy=100, r=65
- Crosshair: H (35,100)→(165,100), V (100,35)→(100,165)
- Cardinal pins: N=(100,15), E=(185,100), S=(100,185), W=(15,100)
- Cardinal labels: N=(100,8), E=(196,104), S=(100,198), W=(4,104)
- Needle paths: North `M 100,30 L 106,100 L 100,115 L 94,100 Z` (cyan), South `M 100,115 L 106,100 L 100,170 L 94,100 Z` (slate)
- Transform origin: 100px 100px
- Pin wobble durations: N=1.8s, E=1.4s, S=2.2s, W=1.6s

### Crossfade integration in `login/page.tsx`:
```tsx
const [showLoader, setShowLoader] = useState(true);
const [loginVisible, setLoginVisible] = useState(false);

<>
  {showLoader && (
    <LoadingScreen
      onFading={() => setLoginVisible(true)}
      onComplete={() => setShowLoader(false)}
    />
  )}
  <div style={{ opacity: loginVisible ? 1 : 0, transition: "opacity 1.5s ease",
    pointerEvents: loginVisible ? "auto" : "none", willChange: "opacity" }}>
    {/* login page JSX */}
  </div>
</>
```

---

## 16. NAVIGATIONHUD.tsx — FAB PLACEMENT

### Problem solved: FABs overlapping HUD
FAB `bottom` was hardcoded to `228px` — broke when HUD had advisory text (taller). Fixed with `ResizeObserver`:

```tsx
const hudRef = useRef<HTMLDivElement>(null);
const [hudHeight, setHudHeight] = useState(72);

useEffect(() => {
  const ro = new ResizeObserver((entries) => {
    const h = entries[0]?.contentRect.height;
    if (h) setHudHeight(h);
  });
  ro.observe(hudRef.current!);
  return () => ro.disconnect();
}, []);

const fabBottom = `calc(${hudHeight}px + 12px + env(safe-area-inset-bottom, 0px))`;
```

### FAB layout (right → left, all `minWidth/Height: 48px`):
| FAB | Right offset | Function |
|---|---|---|
| Zoom In | 16px | `onZoomIn` |
| Zoom Out | 72px | `onZoomOut` |
| Recenter | 128px | `onRecenter` |
| Gyro | 184px | `onGyroToggle` |

### Props added to NavigationHUD:
```tsx
onZoomIn: () => void;
onZoomOut: () => void;
```

### Wired in page.tsx:
```tsx
const [zoomRequest, setZoomRequest] = useState<{ delta: number; seq: number }>({ delta: 0, seq: 0 });

onZoomIn={() => setZoomRequest((p) => ({ delta: 1, seq: p.seq + 1 }))}
onZoomOut={() => setZoomRequest((p) => ({ delta: -1, seq: p.seq + 1 }))}
```

---

## 17. UI POLISH — DESIGN SYSTEM

Full aesthetic: dark neumorphism × futurism × bold typography. Reference `transync_design_skill.md` for exact values.

### Typography:
- **Display / numbers / wordmark:** `'Orbitron'` (all components except LoadingScreen which uses `'Syne'`)
- **Body / UI:** `'DM Sans'`
- CSS class: `.font-orbitron` for Orbitron; `fontFamily: "'Syne'..."` inline for LoadingScreen

### Font import in `globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
```

### Dark Neumorphism (in `globals.css`):
```css
.neu-extruded { box-shadow: -4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5); }
.neu-inset    { box-shadow: inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5); }
```

### Input focus state (inline, via `focusedField` state — NOT CSS `:focus`):
```tsx
const inputWrapStyle = (field): CSSProperties => ({
  border: focusedField === field ? "1px solid rgba(56,189,248,0.6)" : "1px solid rgba(255,255,255,0.09)",
  boxShadow: focusedField === field
    ? "0 0 0 3px rgba(56,189,248,0.1), inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)"
    : "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
});
```
**Why inline state instead of CSS `:focus`:** existing codebase uses inline styles throughout; CSS pseudo-selectors don't apply to inline-styled elements.

### CSS utility classes in `globals.css`:
| Class | Use |
|---|---|
| `.btn-gradient` | All primary CTAs — animated color sweep left→right |
| `.btn-tap` | Active scale(0.97) on any tappable element |
| `.neu-extruded` | Cards, chips, avatar, FABs |
| `.neu-inset` | Input wrappers (static) |
| `.chip-dest` | Popular destination chips — hover lift + cyan border |
| `.hud-handle-wrap` / `.hud-handle` | Drag handle — expands 36→52px on hover |
| `.synced-star` | ✦ icon — `violet-pulse` keyframe |
| `.font-orbitron` | Orbitron font utility |
| `.star-btn` | Star rating buttons — scale(1.2) on hover |

### z-index stack:
| Layer | z-index |
|---|---|
| LoadingScreen | 100 |
| ProfileSheet | 60 |
| ArrivalOverlay | 55 |
| NavigationHUD FABs | 40 |
| NavigationHUD panel | 30 |
| Planner overlay | 20 |

### Accessibility fixes applied (fixing-accessibility skill):
- All form inputs have `id` + `htmlFor` linking labels
- Icon-only buttons have `aria-label`
- Error divs have `role="alert"` + `aria-live="assertive"`
- Success divs have `role="status"` + `aria-live="polite"`
- Confirm password field has `aria-invalid` when mismatched
- HUD drag handle has `aria-expanded` + `aria-label`
- Decorative SVG icons have `aria-hidden="true"`

### Motion performance fixes (fixing-motion-performance skill):
- `willChange: "transform, opacity"` on all animated elements during motion
- Logo box animates via `transform: scale()` — not `width/height` (layout props)
- `scrollwheel: true` + `gestureHandling: "greedy"` for map zoom
- `prefers-reduced-motion` respected in `globals.css`

---

## 18. GPS / NAVIGATION BEHAVIOR

- **Single GPS watcher** in `page.tsx` only — starts on mount, NOT gated by `authChecked`
- `currentPosition` passed to `MapView` as `userPos` prop
- Always routes from actual `currentPosition` — no city fallback
- Navigation pan throttled to 800ms
- Gyro mode: `map.setHeading(heading)` + `map.setTilt(45)`
- GPS options: `{ enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }`
- Heading smoothing factor: `0.10` — lower = smoother arrow rotation
- Movement threshold: `8m` — ignores GPS jitter under 8m
- Desktop testing: mock GPS in DevTools → Sensors → Lat 13.9411, Lng 121.1631

---

## 19. MOBILE CONSIDERATIONS

- All pages use `height: 100dvh`
- `WebkitOverflowScrolling: "touch"` on scrollable containers
- `gestureHandling: "greedy"` on map — single-finger pan + pinch-zoom
- Bottom HUD: `position: fixed`, `borderRadius: "24px 24px 0 0"`, `paddingBottom: env(safe-area-inset-bottom)`
- FABs use `env(safe-area-inset-bottom)` in their `bottom` calculation
- Minimum touch target: `48×48px` on all FABs and interactive buttons
- No desktop-only layouts — single-column, mobile-first

---

## 20. PWA MANIFEST

- `public/manifest.json` — name, theme/bg `#020617`, display `standalone`
- `layout.tsx` — `<meta name="theme-color">`, manifest link, apple-web-app meta
- **⚠ PNG icons not yet created** — `icon-192.png` and `icon-512.png` needed for iOS PWA install

---

## 21. KNOWN ISSUES FIXED

| Issue | Fix Applied |
|---|---|
| "Google API already presented" error | `useJsApiLoader` moved to `page.tsx`, passed as `isLoaded` prop to MapView |
| Route markers A/B not aligned with polyline | Use `leg.start_location` / `leg.end_location` |
| Reverse geocoding using browser key | Moved to backend `GET /geocode/reverse` |
| Autocomplete not loading on slow mobile | Replaced `setInterval` polling with `useEffect` on `isLoaded` |
| Duplicate GPS watchers (battery drain) | Removed `watchPosition` from MapView — single watcher in `page.tsx` |
| Hardcoded username | Now fetches real username from `/auth/me` |
| Autocomplete ZERO_RESULTS | `formatted_address` used + `destinationCoords` sends lat,lng directly to backend |
| Starting point wrong city (IP-based GPS) | Removed city fallback — always routes from real `currentPosition` |
| Browser not prompting for location | GPS watcher starts on mount, independent of `authChecked` |
| Gradient buttons static/flat | Animated `gradient-flow` keyframe via `btn-gradient` class |
| No arrival notification | Arrival detection useEffect + full-screen overlay |
| AI insight card disappearing (StrictMode) | `aiInsightFetchedRef` guard prevents double-invoke |
| Advisory card + search form shown together | `showAdvisory` state — PlannerPanel and AdvisoryPanel render exclusively |
| page.tsx too large (1100+ lines) | Split into 5 component files + shared types |
| `openai` package unused | Removed; replaced with `@anthropic-ai/sdk` |
| ETA static during navigation | Dynamic ETA: `getDistanceMeters()` / avg speed, updates every 15s |
| AI typewriter clunky / flickering | Decoupled buffer+typewriter: 18ms interval, step-end → ease-in-out cursor |
| Vehicle heading jittery | Smoothing factor 0.22→0.10, threshold 4m→8m |
| FABs overlap HUD when advisory text present | `ResizeObserver` on HUD ref drives `fabBottom` dynamically |
| Map not zoomable with buttons | Zoom FABs added; `zoomRequest` prop fires `map.setZoom()` in MapView |
| Pinch-zoom broken on mobile | `gestureHandling: "greedy"` + `scrollwheel: true` — both confirmed active |
| Form inputs not keyboard accessible | `id`/`htmlFor` linked, `aria-label` on icon buttons, `role="alert"` on errors |
| Logo box animating width/height (layout) | Replaced with `transform: scale()` — compositor-only |

---

## 22. DEPLOYMENT — NEXT STEPS (planned)

**Frontend → Vercel**
- Push `transync-gps` to GitHub
- Connect repo to Vercel
- Set environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - `NEXT_PUBLIC_BACKEND_API_URL` (point to Railway backend URL)
  - `ANTHROPIC_API_KEY`
- Update Google Maps browser key HTTP referrer restriction to include Vercel domain

**Backend → Railway**
- Push `transync-backend` to GitHub (separate repo or monorepo)
- Create new Railway project → deploy from repo
- Set environment variables in Railway:
  - `GOOGLE_MAPS_SERVER_API_KEY`
  - `JWT_SECRET`
  - `FRONTEND_URL` (point to Vercel domain)
  - `PORT` (Railway sets this automatically — use `process.env.PORT`)
- Update Google Maps server key IP restriction to Railway's static IP (or remove for prototype)
- SQLite: works on Railway but data resets on redeploy — acceptable for 5-user prototype
- Update `CORS` origin in `server.js` to allow Vercel domain

**Pre-deploy checklist:**
- [ ] All `localhost` references replaced with env vars
- [ ] `NEXT_PUBLIC_BACKEND_API_URL` set to Railway URL (not localhost)
- [ ] Google Maps browser key allows Vercel domain
- [ ] Google Maps server key allows Railway IP
- [ ] `ANTHROPIC_API_KEY` set in Vercel (not exposed to client)
- [ ] `JWT_SECRET` set in Railway (not default value)
- [ ] Test GPS on mobile after deploy (desktop will still mock)

---

## 23. WHAT IS NOT YET BUILT

- PWA PNG icons (192×192, 512×512) — needed for iOS install prompt
- Distinct ETAs for private vs public transport (jeepney mode)
- Local delay weights (rain, festivals, accidents) — weather partially done
- Real-time alerts / push notifications
- User profile photo upload
- Persistent trip route replay
- PWA service worker / offline support
- Arrival feedback persistence (currently local state only — not saved to backend)
- Manual starting point override for desktop testing
- Light mode (deliberately deferred — inline styles throughout require CSS variable refactor)

---

## 24. THESIS / RESEARCH FRAMING

- **Problem:** Existing navigation tools don't provide separate ETAs for private vs public vehicles, no localized delay formulas for Lipa City conditions, no unified commuter advisory platform
- **Solution framing:** Hybrid navigation architecture — deterministic geospatial APIs (Google Maps) + AI-driven interpretive advisory layer (Claude) + real-time weather integration
- **Geographic context:** Lipa City, Batangas; students and daily commuters; De La Salle Lipa area
- **Key differentiators over standard Google Maps:** traffic + weather synthesis, AI-generated commuter advisories, dynamic ETA updates, multi-stop routing, transport-mode-specific ETAs (planned)

---

## 25. CODING PREFERENCES

- **Always provide full updated files** — never partial snippets that require manual merging
- **Mobile-first** — all UI decisions default to mobile viewport
- **Inline styles preferred** for component-level styling (matches existing codebase pattern)
- **No breaking changes to `/route` endpoint** — it's working and connected to the thesis demo
- **Prototype-grade robustness** — stable for 5-user demo, not enterprise-scale
- **TypeScript** throughout the frontend
- **Non-fatal failures** — weather, searches, trips, AI all fail silently; core navigation never breaks
- **focusedField pattern** — use React state for input focus rings, not CSS `:focus` (inline styles don't support pseudo-selectors)
- **aiInsightFetchedRef pattern** — use a ref guard identical to `weatherFetchedRef` whenever preventing double-invoke in StrictMode
- **WaypointRow pattern** — each repeating input with its own Autocomplete uses a self-contained sub-component with its own `useEffect` and `useRef`
- **ResizeObserver pattern** — use ResizeObserver (not hardcoded px) whenever a fixed element's position depends on another element's dynamic height

---

*End of handoff brief. Paste this entire document + `transync_design_skill.md` at the start of a new Claude Code session.*
