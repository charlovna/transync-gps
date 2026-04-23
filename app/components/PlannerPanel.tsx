"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng, WeatherData, RecentSearch, TripRecord, RiskLevel, WaypointStop, LocalEvent } from "../lib/types";
import EventsCarousel from "./EventsCarousel";

const POPULAR_DESTINATIONS = ["BigBen Complex", "Sico", "Balete", "SM City Lipa"];
const LIPA_CITY_BOUNDS = { north: 14.0, south: 13.88, east: 121.23, west: 121.09 };
const MAX_WAYPOINTS = 3;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr.replace(" ", "T") + "Z").getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function tripRiskBadge(level: RiskLevel): { bg: string; text: string } {
  switch (level) {
    case "Low":    return { bg: "#10b981", text: "#fff" };
    case "Medium": return { bg: "#eab308", text: "#0f172a" };
    case "High":   return { bg: "#ef4444", text: "#fff" };
  }
}

// ── Waypoint input row with its own autocomplete instance ──────────────────
type WaypointRowProps = {
  index: number;
  value: string;
  onChange: (address: string, coords: LatLng | null) => void;
  onRemove: () => void;
  isLoaded: boolean;
  authChecked: boolean;
};

function WaypointRow({ index, value, onChange, onRemove, isLoaded, authChecked }: WaypointRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!isLoaded || !authChecked || !inputRef.current) return;
    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      bounds: new google.maps.LatLngBounds(
        new google.maps.LatLng(LIPA_CITY_BOUNDS.south, LIPA_CITY_BOUNDS.west),
        new google.maps.LatLng(LIPA_CITY_BOUNDS.north, LIPA_CITY_BOUNDS.east)
      ),
      strictBounds: false,
      fields: ["formatted_address", "geometry", "name"],
      componentRestrictions: { country: "ph" },
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const label = place.formatted_address || place.name || inputRef.current?.value || "";
      onChange(label, place.geometry?.location
        ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        : null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, authChecked]);

  const wrapStyle: React.CSSProperties = focused
    ? { borderRadius: 14, padding: "10px 12px", border: "1px solid rgba(56,189,248,0.6)", background: "rgba(15,23,42,0.9)", boxShadow: "0 0 0 3px rgba(56,189,248,0.1), inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)", transition: "border-color 0.2s ease, box-shadow 0.2s ease", display: "flex", alignItems: "center", gap: 8 }
    : { borderRadius: 14, padding: "10px 12px", border: "1px solid rgba(125,211,252,0.2)", background: "rgba(15,23,42,0.9)", boxShadow: "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)", transition: "border-color 0.2s ease, box-shadow 0.2s ease", display: "flex", alignItems: "center", gap: 8 };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em" }}>
          Stop {index + 1}
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ ...wrapStyle, flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value, null); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={`Waypoint ${index + 1}`}
            autoComplete="off"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#f8fafc", fontFamily: "inherit" }}
          />
        </div>
        <button
          onClick={onRemove}
          className="btn-tap"
          title="Remove stop"
          style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f87171" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
type Props = {
  currentUsername: string;
  onOpenProfile: () => void;
  onSignOut: () => void;
  locationAddress: string;
  locationCoords: string;
  gpsLoading: boolean;
  gpsError: string;
  destination: string;
  onDestinationChange: (val: string) => void;
  onDestinationCoordsChange: (coords: LatLng | null) => void;
  waypointInputs: WaypointStop[];
  onWaypointAdd: () => void;
  onWaypointRemove: (idx: number) => void;
  onWaypointChange: (idx: number, address: string, coords: LatLng | null) => void;
  loading: boolean;
  error: string;
  isValid: boolean;
  onGetRoute: () => void;
  travelMode: "driving" | "bicycling" | "walking";
  onTravelModeChange: (mode: "driving" | "bicycling" | "walking") => void;
  weatherData: WeatherData | null;
  weatherLoading: boolean;
  currentPosition: LatLng | null;
  recentSearches: RecentSearch[];
  tripHistory: TripRecord[];
  showTripHistory: boolean;
  onToggleTripHistory: () => void;
  onQuickDestination: (place: string) => void;
  isLoaded: boolean;
  authChecked: boolean;
  // Passes the nearest event up to the orchestrator, which forwards it into
  // the Synced Insight (AI advisory) request when within 7 days.
  onNearestEventChange?: (ev: LocalEvent | null) => void;
};

export default function PlannerPanel({
  currentUsername, onOpenProfile, onSignOut,
  locationAddress, locationCoords, gpsLoading, gpsError,
  destination, onDestinationChange, onDestinationCoordsChange,
  waypointInputs, onWaypointAdd, onWaypointRemove, onWaypointChange,
  loading, error, isValid, onGetRoute,
  travelMode, onTravelModeChange,
  weatherData, weatherLoading, currentPosition,
  recentSearches, tripHistory, showTripHistory, onToggleTripHistory,
  onQuickDestination, isLoaded, authChecked,
  onNearestEventChange,
}: Props) {
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [destFocused, setDestFocused] = useState(false);

  // ── Local events — fetched once on mount, no auth, fail silently ───────
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [nearest, setNearest] = useState<LocalEvent | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!backendUrl) return;
    const ctrl = new AbortController();
    fetch(`${backendUrl}/events`, { signal: ctrl.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setEvents(data.events || []);
        setNearest(data.nearest || null);
        onNearestEventChange?.(data.nearest || null);
      })
      .catch(() => { /* silent — carousel simply won't render */ });
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEventSelect = (ev: LocalEvent) => {
    // Per spec: populate destination only — do NOT trigger Get Route Info.
    onDestinationChange(ev.location);
    onDestinationCoordsChange(ev.location_coords);
  };

  useEffect(() => {
    if (!isLoaded || !authChecked || !destinationInputRef.current) return;
    const ac = new google.maps.places.Autocomplete(destinationInputRef.current, {
      bounds: new google.maps.LatLngBounds(
        new google.maps.LatLng(LIPA_CITY_BOUNDS.south, LIPA_CITY_BOUNDS.west),
        new google.maps.LatLng(LIPA_CITY_BOUNDS.north, LIPA_CITY_BOUNDS.east)
      ),
      strictBounds: false,
      fields: ["formatted_address", "geometry", "name"],
      componentRestrictions: { country: "ph" },
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const label = place.formatted_address || place.name || destinationInputRef.current?.value || "";
      onDestinationChange(label);
      const loc = place.geometry?.location;
      onDestinationCoordsChange(loc ? { lat: loc.lat(), lng: loc.lng() } : null);
    });
    autocompleteRef.current = ac;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, authChecked]);

  const handleQuickDestinationLocal = (place: string) => {
    onQuickDestination(place);
    onDestinationCoordsChange(null);
    destinationInputRef.current?.focus();
  };

  const destWrapStyle: React.CSSProperties = destFocused
    ? { borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(56,189,248,0.6)", background: "rgba(15,23,42,0.9)", boxShadow: "0 0 0 3px rgba(56,189,248,0.1), inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)", transition: "border-color 0.2s ease, box-shadow 0.2s ease" }
    : { borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(251,146,60,0.3)", background: "rgba(15,23,42,0.9)", boxShadow: "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)", transition: "border-color 0.2s ease, box-shadow 0.2s ease" };

  return (
    <div className="w-full max-w-[520px] mx-auto space-y-4">

      {/* ── Header ── */}
      <div style={{ borderRadius: 24, padding: "18px 20px", border: "1px solid rgba(34,211,238,0.1)", background: "linear-gradient(135deg,rgba(8,47,73,0.88),rgba(15,23,42,0.94),rgba(30,27,75,0.88))", backdropFilter: "blur(20px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onOpenProfile} title="View profile" className="neu-extruded btn-tap"
            style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: "linear-gradient(135deg,#10b981,#06b6d4,#6366f1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", cursor: "pointer" }}>
            {currentUsername.charAt(0).toUpperCase()}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="font-orbitron" style={{ fontSize: 17, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.01em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Hey, {currentUsername}!
            </h1>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Where to? Plan your next trip.</p>
          </div>
          <button onClick={onSignOut} className="btn-tap" style={{ flexShrink: 0, borderRadius: 12, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.5)", fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer", whiteSpace: "nowrap" }}>
            Sign out
          </button>
        </div>
      </div>

      {/* ── Route input ── */}
      <div style={{ borderRadius: 26, padding: "20px", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(2,6,23,0.92)", backdropFilter: "blur(20px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        {/* ── Transport mode selector ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {([
            {
              key: "driving" as const,
              label: "4 Wheels",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 11l1.5-4.5h11L19 11M17 16a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-7 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM3 11.5V17h1v1.5A.5.5 0 0 0 4.5 19h1a.5.5 0 0 0 .5-.5V17h11v1.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V17h1v-5.5L19 11H5l-2 .5z"/>
                </svg>
              ),
            },
            {
              key: "bicycling" as const,
              label: "2 Wheels",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5.5" cy="15.5" r="3.5"/>
                  <circle cx="18.5" cy="15.5" r="3.5"/>
                  <path d="M15 6h-5l-1.5 5.5M15 6l3.5 9.5M9.5 11.5l5 .5"/>
                  <circle cx="15" cy="6" r="1"/>
                </svg>
              ),
            },
            {
              key: "walking" as const,
              label: "Walk",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="4" r="1.5"/>
                  <path d="M9 8.5l-2 6M15 8.5l2 6M10 8.5h4l1 3.5-3 2 1 4M9 8.5l-1 4 3 1.5"/>
                </svg>
              ),
            },
          ] as const).map(({ key, label, icon }) => {
            const active = travelMode === key;
            return (
              <button
                key={key}
                onClick={() => onTravelModeChange(key)}
                className="btn-tap"
                style={{
                  flex: 1,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  padding: "10px 6px",
                  borderRadius: 16,
                  border: active ? "1px solid rgba(56,189,248,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)",
                  color: active ? "#38bdf8" : "#64748b",
                  cursor: "pointer",
                  boxShadow: active ? "0 0 12px rgba(56,189,248,0.15)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {icon}
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 14 }}>

          {/* Left connector rail */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 28, flexShrink: 0 }}>
            {/* Origin dot */}
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "3px solid #67e8f9", background: "#22d3ee", boxShadow: "0 0 12px rgba(34,211,238,0.6)", flexShrink: 0 }} />
            {/* Waypoint segments + dots */}
            {waypointInputs.map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 2, height: 52, margin: "5px 0", borderRadius: 2, background: "linear-gradient(to bottom,#22d3ee,#7dd3fc)", flexShrink: 0 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #7dd3fc", background: "#0ea5e9", boxShadow: "0 0 8px rgba(125,211,252,0.5)", flexShrink: 0 }} />
              </div>
            ))}
            {/* Final line to destination */}
            <div style={{ width: 2, flex: 1, margin: "6px 0", minHeight: 40, borderRadius: 2, background: waypointInputs.length > 0 ? "linear-gradient(to bottom,#7dd3fc,#fb923c)" : "linear-gradient(to bottom,#22d3ee,#475569,#fb923c)", flexShrink: 0 }} />
            {/* Destination dot */}
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "3px solid #fdba74", background: "#fb923c", boxShadow: "0 0 12px rgba(251,146,60,0.6)", flexShrink: 0 }} />
          </div>

          {/* Right fields */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Origin */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>Starting Point</label>
              <div style={{ borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(34,211,238,0.3)", background: "rgba(15,23,42,0.9)", boxShadow: "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)" }}>
                {gpsLoading
                  ? <p style={{ fontSize: 13, color: "#64748b" }}>Detecting GPS location...</p>
                  : gpsError
                  ? <p style={{ fontSize: 13, color: "#f87171" }}>{gpsError}</p>
                  : <>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3 }}>{locationAddress}</p>
                      {locationCoords && <p style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginTop: 4 }}>📍 {locationCoords}</p>}
                    </>
                }
              </div>
            </div>

            {/* Waypoint rows */}
            {waypointInputs.map((wp, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <WaypointRow
                  index={i}
                  value={wp.address}
                  onChange={(addr, coords) => onWaypointChange(i, addr, coords)}
                  onRemove={() => onWaypointRemove(i)}
                  isLoaded={isLoaded}
                  authChecked={authChecked}
                />
              </div>
            ))}

            {/* Destination */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                  Destination <span style={{ color: "#fb923c" }}>*</span>
                </label>
                {waypointInputs.length < MAX_WAYPOINTS && (
                  <button
                    onClick={onWaypointAdd}
                    className="btn-tap"
                    style={{ fontSize: 11, fontWeight: 600, color: "#7dd3fc", background: "rgba(125,211,252,0.08)", border: "1px solid rgba(125,211,252,0.2)", borderRadius: 10, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Add Stop
                  </button>
                )}
              </div>
              <div style={destWrapStyle}>
                <input
                  ref={destinationInputRef}
                  type="text"
                  value={destination}
                  onChange={(e) => { onDestinationChange(e.target.value); onDestinationCoordsChange(null); }}
                  onFocus={() => setDestFocused(true)}
                  onBlur={() => setDestFocused(false)}
                  onKeyDown={(e) => { if (e.key === "Enter" && isValid) onGetRoute(); }}
                  placeholder="Where are you going?"
                  autoComplete="off"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 16, color: "#f8fafc", fontFamily: "inherit" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stop count badge */}
        {waypointInputs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, padding: "7px 12px", borderRadius: 12, background: "rgba(125,211,252,0.06)", border: "1px solid rgba(125,211,252,0.15)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
            <p style={{ fontSize: 12, color: "#7dd3fc", fontWeight: 600 }}>
              {waypointInputs.length} stop{waypointInputs.length > 1 ? "s" : ""} added · {waypointInputs.length + 1} legs total
            </p>
          </div>
        )}

        <button
          onClick={onGetRoute}
          disabled={loading || !isValid || gpsLoading}
          className="btn-gradient"
          style={{ width: "100%", marginTop: 18, borderRadius: 18, padding: "16px", fontSize: 16, boxShadow: "0 8px 24px rgba(6,182,212,0.3)" }}>
          {loading ? "Generating Route Info..." : gpsLoading ? "Waiting for GPS..." : `Get Route Info  →`}
        </button>
        {error && (
          <div style={{ marginTop: 12, borderRadius: 14, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(127,29,29,0.4)", fontSize: 13, color: "#fca5a5" }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Weather ── */}
      <div style={{ borderRadius: 24, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.88)", backdropFilter: "blur(20px)", boxShadow: "0 16px 32px rgba(0,0,0,0.3)" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>Current Weather · Lipa City</p>
        {weatherLoading ? (
          <p style={{ fontSize: 13, color: "#475569" }}>Detecting conditions...</p>
        ) : weatherData ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>{weatherData.condition.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="font-orbitron" style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{weatherData.temperature}°C</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>Feels {weatherData.feels_like}°C</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", marginTop: 3 }}>{weatherData.condition.label}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>💨 {weatherData.wind_speed} km/h</span>
              {weatherData.precipitation > 0 && (
                <span style={{ fontSize: 12, color: "#7dd3fc" }}>🌧 {weatherData.precipitation}mm</span>
              )}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#475569" }}>
            {currentPosition ? "Weather unavailable" : "Waiting for GPS to load weather..."}
          </p>
        )}
      </div>

      {/* ── Local Events · Lipa City ── */}
      <EventsCarousel
        events={events}
        nearest={nearest}
        onEventSelect={handleEventSelect}
      />

      {/* ── Popular Destinations ── */}
      <div style={{ borderRadius: 24, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.88)", backdropFilter: "blur(20px)", boxShadow: "0 16px 32px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", marginBottom: 12 }}>Popular Destinations</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {POPULAR_DESTINATIONS.map((place) => (
            <button key={place} onClick={() => handleQuickDestinationLocal(place)}
              className="chip-dest"
              style={{ borderRadius: 14, padding: "9px 14px", border: "1px solid rgba(34,211,238,0.25)", background: "rgba(15,23,42,0.85)", fontSize: 13, fontWeight: 600, color: "#e2e8f0", cursor: "pointer" }}>
              {place}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Searches ── */}
      <div style={{ borderRadius: 24, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.88)", backdropFilter: "blur(20px)", boxShadow: "0 16px 32px rgba(0,0,0,0.3)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", marginBottom: 12 }}>Recent Searches</h2>
        {recentSearches.length === 0 ? (
          <p style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "12px 0" }}>No recent searches yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentSearches.map((item) => (
              <button key={item.id} onClick={() => handleQuickDestinationLocal(item.destination)}
                className="btn-tap"
                style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderRadius: 16, padding: "13px 14px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(15,23,42,0.5)", textAlign: "left", cursor: "pointer" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.destination}</p>
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub_address || "Lipa City, Batangas"}</p>
                </div>
                <span style={{ fontSize: 12, color: "#475569", flexShrink: 0, marginLeft: 10 }}>{timeAgo(item.searched_at)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Trip History ── */}
      <div style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.88)", backdropFilter: "blur(20px)", boxShadow: "0 16px 32px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        <button onClick={onToggleTripHistory} className="btn-tap"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "transparent", border: "none", cursor: "pointer" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>Trip History</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {tripHistory.length > 0 && (
              <span style={{ borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}>{tripHistory.length}</span>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"
              style={{ transform: showTripHistory ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </button>
        {showTripHistory && (
          <div style={{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            {tripHistory.length === 0 ? (
              <p style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "12px 0" }}>No trips yet. Start a trip to see your history.</p>
            ) : tripHistory.map((trip) => {
              const badge = tripRiskBadge(trip.risk_level);
              return (
                <button key={trip.id} onClick={() => handleQuickDestinationLocal(trip.destination_label)}
                  className="btn-tap"
                  style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderRadius: 16, padding: "13px 14px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(15,23,42,0.5)", textAlign: "left", cursor: "pointer", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.destination_label || "Unknown destination"}</p>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {trip.eta_minutes ? `${trip.eta_minutes} min` : "—"}
                      {trip.distance_km ? ` · ${trip.distance_km} km` : ""}
                      {" · "}{timeAgo(trip.started_at)}
                    </p>
                  </div>
                  <span style={{ flexShrink: 0, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.text }}>{trip.risk_level}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
