"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useJsApiLoader } from "@react-google-maps/api";
import PlannerPanel from "../components/PlannerPanel";
import ProfileSheet from "../components/ProfileSheet";
import type { LatLng, WeatherData, RecentSearch, TripRecord, ProfileData, WaypointStop, RiskLevel } from "../lib/types";

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing")[] = ["places"];

function getToken(): string {
  return localStorage.getItem("transync_token") || sessionStorage.getItem("transync_token") || "";
}

export default function Dashboard() {
  const router = useRouter();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [authChecked, setAuthChecked]         = useState(false);
  const [currentUsername, setCurrentUsername] = useState("...");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    const cached = localStorage.getItem("transync_user") || sessionStorage.getItem("transync_user");
    if (cached) {
      try { const p = JSON.parse(cached); if (p?.username) setCurrentUsername(p.username); } catch { /* ignore */ }
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (backendUrl) {
      fetch(`${backendUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => {
          if (r.status === 401) {
            localStorage.removeItem("transync_token"); localStorage.removeItem("transync_user");
            sessionStorage.removeItem("transync_token"); sessionStorage.removeItem("transync_user");
            router.push("/login"); return null;
          }
          return r.json();
        })
        .then((data) => { if (data?.user?.username) setCurrentUsername(data.user.username); })
        .catch(() => { /* keep cached */ });
    }
    setAuthChecked(true);
  }, [router]);

  // ── Core state ────────────────────────────────────────────────────────────
  const [destination, setDestination]             = useState("");
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null);
  const [travelMode, setTravelMode]               = useState<"driving" | "bicycling" | "walking">("driving");
  const [waypointInputs, setWaypointInputs]       = useState<WaypointStop[]>([]);
  const [gpsLoading, setGpsLoading]               = useState(true);
  const [gpsError, setGpsError]                   = useState("");
  const [currentPosition, setCurrentPosition]     = useState<LatLng | null>(null);
  const [locationAddress, setLocationAddress]     = useState("Fetching current location...");
  const [locationCoords, setLocationCoords]       = useState("");

  // ── Weather ───────────────────────────────────────────────────────────────
  const [weatherData, setWeatherData]       = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const weatherFetchedRef                   = useRef(false);

  // ── Searches + trips ──────────────────────────────────────────────────────
  const [recentSearches, setRecentSearches]   = useState<RecentSearch[]>([]);
  const [tripHistory, setTripHistory]         = useState<TripRecord[]>([]);
  const [showTripHistory, setShowTripHistory] = useState(false);

  // ── Profile ───────────────────────────────────────────────────────────────
  const [showProfile, setShowProfile]               = useState(false);
  const [profileData, setProfileData]               = useState<ProfileData | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrent, setCpCurrent]                   = useState("");
  const [cpNew, setCpNew]                           = useState("");
  const [cpConfirm, setCpConfirm]                   = useState("");
  const [cpError, setCpError]                       = useState("");
  const [cpSuccess, setCpSuccess]                   = useState("");
  const [cpLoading, setCpLoading]                   = useState(false);

  // ── Route Alert (passive conditions check against last trip) ─────────────
  type RouteAlert = {
    destination_label: string;
    type: "better" | "worse";
    currentRisk: RiskLevel;
    storedRisk: RiskLevel;
    timeSaving: number | null;
    currentEta: number | null;
    message: string;
  };
  const [routeAlert, setRouteAlert]     = useState<RouteAlert | null>(null);
  const routeAlertCheckedRef            = useRef(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "";
  const isValid    = useMemo(() => destination.trim().length > 0, [destination]);

  // ── Backend helpers ───────────────────────────────────────────────────────
  const fetchWeather = async (lat: number, lng: number) => {
    if (!backendUrl) return;
    setWeatherLoading(true);
    try {
      const r = await fetch(`${backendUrl}/weather?lat=${lat}&lng=${lng}`);
      const d = await r.json();
      if (r.ok) setWeatherData(d);
    } catch { /* non-fatal */ } finally { setWeatherLoading(false); }
  };

  const fetchRecentSearches = async () => {
    if (!backendUrl) return;
    try {
      const r = await fetch(`${backendUrl}/searches`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (r.ok && d.searches) setRecentSearches(d.searches);
    } catch { /* non-fatal */ }
  };

  const fetchTripHistory = async () => {
    if (!backendUrl) return;
    try {
      const r = await fetch(`${backendUrl}/trips`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (r.ok && d.trips) setTripHistory(d.trips);
    } catch { /* non-fatal */ }
  };

  const fetchProfile = async () => {
    if (!backendUrl) return;
    try {
      const r = await fetch(`${backendUrl}/auth/me`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      if (r.ok && d.user) setProfileData(d.user);
    } catch { /* non-fatal */ }
  };

  // ── GPS watcher ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsLoading(false); setGpsError("Geolocation not supported.");
      setLocationAddress("Current location unavailable"); return;
    }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (pos.coords.accuracy > 100) return;
        const coords: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentPosition(coords); setGpsLoading(false); setGpsError("");
        const coordString = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
        setLocationCoords(coordString);
        if (backendUrl) {
          try {
            const r = await fetch(`${backendUrl}/geocode/reverse?lat=${coords.lat}&lng=${coords.lng}`);
            const d = await r.json();
            setLocationAddress(d.address || coordString);
          } catch { setLocationAddress(coordString); }
        } else { setLocationAddress(coordString); }
      },
      (err) => {
        let message = "Unable to retrieve current location.";
        if (err.code === 1) message = "Location permission denied.";
        if (err.code === 2) message = "Location unavailable.";
        if (err.code === 3) message = "Location request timed out.";
        setGpsLoading(false); setGpsError(message);
        setLocationAddress("Current location unavailable"); setLocationCoords("");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl]);

  // ── Fetch weather once on first GPS fix ───────────────────────────────────
  useEffect(() => {
    if (!currentPosition || weatherFetchedRef.current) return;
    weatherFetchedRef.current = true;
    fetchWeather(currentPosition.lat, currentPosition.lng);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition]);

  // ── Adaptive route alert — check conditions against last trip once ────────
  useEffect(() => {
    if (!currentPosition || !authChecked || tripHistory.length === 0 || routeAlertCheckedRef.current || !backendUrl) return;
    routeAlertCheckedRef.current = true;
    const lastTrip = tripHistory[0];
    if (!lastTrip?.destination_label) return;
    (async () => {
      try {
        const r = await fetch(`${backendUrl}/route`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({
            origin: `${currentPosition.lat},${currentPosition.lng}`,
            destination: lastTrip.destination_label,
            mode: travelMode,
          }),
        });
        const data = await r.json();
        if (!r.ok || !data.eta_minutes) return;
        const riskLevels  = ["Low", "Medium", "High"] as const;
        const curRiskIdx  = riskLevels.indexOf(data.risk_level ?? "Low");
        const prevRiskIdx = riskLevels.indexOf(lastTrip.risk_level ?? "Low");
        const currentEta  = data.eta_minutes as number;
        const storedEta   = lastTrip.eta_minutes;
        const saving      = storedEta ? storedEta - currentEta : null;
        if (curRiskIdx < prevRiskIdx || (saving !== null && saving >= 3)) {
          setRouteAlert({
            destination_label: lastTrip.destination_label,
            type: "better",
            currentRisk: data.risk_level,
            storedRisk: lastTrip.risk_level,
            timeSaving: saving && saving >= 3 ? saving : null,
            currentEta,
            message: saving && saving >= 3
              ? `${saving} min faster to ${lastTrip.destination_label} than your last trip`
              : `Lower traffic risk to ${lastTrip.destination_label} right now`,
          });
        } else if (curRiskIdx > prevRiskIdx) {
          setRouteAlert({
            destination_label: lastTrip.destination_label,
            type: "worse",
            currentRisk: data.risk_level,
            storedRisk: lastTrip.risk_level,
            timeSaving: null,
            currentEta,
            message: `Traffic to ${lastTrip.destination_label} is heavier than your last trip`,
          });
        }
      } catch { /* non-fatal */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition, authChecked, tripHistory]);

  // ── Fetch searches + trips after auth ─────────────────────────────────────
  useEffect(() => {
    if (!authChecked) return;
    fetchRecentSearches();
    fetchTripHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  // ── Fetch full profile when sheet opens ───────────────────────────────────
  useEffect(() => {
    if (!showProfile || !authChecked) return;
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfile, authChecked]);

  // ── Waypoint handlers ─────────────────────────────────────────────────────
  const handleWaypointAdd = () => {
    if (waypointInputs.length >= 3) return;
    setWaypointInputs((prev) => [...prev, { address: "", coords: null }]);
  };

  const handleWaypointRemove = (idx: number) => {
    setWaypointInputs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleWaypointChange = (idx: number, address: string, coords: LatLng | null) => {
    setWaypointInputs((prev) => prev.map((w, i) => i === idx ? { ...w, address, coords } : w));
  };

  // ── Get Route — stores params to sessionStorage then navigates to /map ────
  const handleGetRoute = () => {
    if (!destination.trim()) return;
    sessionStorage.setItem("transync_dashboard_route", JSON.stringify({
      destination,
      destinationCoords,
      travelMode,
      waypoints: waypointInputs,
    }));
    router.push("/map");
  };

  const handleReRouteFromTrip = (label: string) => {
    sessionStorage.setItem("transync_dashboard_route", JSON.stringify({
      destination: label,
      destinationCoords: null,
      travelMode,
      waypoints: waypointInputs,
    }));
    router.push("/map");
  };

  const handleSignOut = () => {
    localStorage.removeItem("transync_token"); localStorage.removeItem("transync_user");
    sessionStorage.removeItem("transync_token"); sessionStorage.removeItem("transync_user");
    router.push("/login");
  };

  const handleChangePassword = async () => {
    setCpError(""); setCpSuccess("");
    if (!cpCurrent || !cpNew || !cpConfirm) { setCpError("All fields are required."); return; }
    if (cpNew !== cpConfirm)  { setCpError("New passwords do not match."); return; }
    if (cpNew.length < 6)     { setCpError("New password must be at least 6 characters."); return; }
    setCpLoading(true);
    try {
      const r = await fetch(`${backendUrl}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ current_password: cpCurrent, new_password: cpNew }),
      });
      const d = await r.json();
      if (!r.ok) { setCpError(d.error || "Failed to change password."); return; }
      setCpSuccess("Password updated successfully!");
      setCpCurrent(""); setCpNew(""); setCpConfirm("");
      setTimeout(() => { setCpSuccess(""); setShowChangePassword(false); }, 2000);
    } catch { setCpError("Unable to connect to server."); } finally { setCpLoading(false); }
  };

  const handleCloseProfile = () => {
    setShowProfile(false); setShowChangePassword(false);
    setCpError(""); setCpSuccess(""); setCpCurrent(""); setCpNew(""); setCpConfirm("");
  };

  if (!authChecked) return null;

  return (
    <div
      className="text-white overflow-y-auto"
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #020617 0%, #0a0f1e 50%, #020617 100%)",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-[520px] mx-auto px-4 py-6 pb-16">

        {/* ── Route Alert card ── */}
        {routeAlert && (
          <div className="panel-slide-in" style={{
            borderRadius: 20, padding: "14px 16px", marginBottom: 16,
            background: routeAlert.type === "better"
              ? "linear-gradient(135deg,rgba(5,30,18,0.9),rgba(15,23,42,0.95))"
              : "linear-gradient(135deg,rgba(40,15,5,0.9),rgba(15,23,42,0.95))",
            border: `1px solid ${routeAlert.type === "better" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`,
            backdropFilter: "blur(20px)",
            boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{routeAlert.type === "better" ? "✅" : "⚠️"}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: routeAlert.type === "better" ? "#34d399" : "#f87171", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                    {routeAlert.type === "better" ? "Route Alert · Better Window" : "Route Alert · Heavier Traffic"}
                  </p>
                  <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {routeAlert.message}
                  </p>
                </div>
              </div>
              <button onClick={() => setRouteAlert(null)} className="btn-tap"
                style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                ×
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {routeAlert.timeSaving !== null && (
                <div style={{ flex: 1, borderRadius: 11, padding: "7px 10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", textAlign: "center" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Time Saved</p>
                  <p className="font-orbitron" style={{ fontSize: 16, fontWeight: 800, color: "#10b981", lineHeight: 1 }}>↓ {routeAlert.timeSaving}<span style={{ fontSize: 9, color: "#475569", marginLeft: 2 }}>min</span></p>
                </div>
              )}
              {routeAlert.currentEta !== null && (
                <div style={{ flex: 1, borderRadius: 11, padding: "7px 10px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Current ETA</p>
                  <p className="font-orbitron" style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{routeAlert.currentEta}<span style={{ fontSize: 9, color: "#475569", marginLeft: 2 }}>min</span></p>
                </div>
              )}
              <div style={{ flex: 1, borderRadius: 11, padding: "7px 10px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Risk Now</p>
                <p style={{ fontSize: 13, fontWeight: 800, lineHeight: 1,
                  color: routeAlert.currentRisk === "Low" ? "#10b981" : routeAlert.currentRisk === "Medium" ? "#eab308" : "#ef4444" }}>
                  {routeAlert.currentRisk}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setRouteAlert(null); handleReRouteFromTrip(routeAlert.destination_label); }}
              className="btn-tap"
              style={{ width: "100%", padding: "11px", borderRadius: 14, border: "none",
                background: routeAlert.type === "better" ? "linear-gradient(90deg,#10b981,#06b6d4)" : "linear-gradient(90deg,#f59e0b,#ef4444)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Navigate Now →
            </button>
          </div>
        )}

        <PlannerPanel
          currentUsername={currentUsername}
          onOpenProfile={() => setShowProfile(true)}
          onSignOut={handleSignOut}
          locationAddress={locationAddress}
          locationCoords={locationCoords}
          gpsLoading={gpsLoading}
          gpsError={gpsError}
          destination={destination}
          onDestinationChange={setDestination}
          onDestinationCoordsChange={setDestinationCoords}
          waypointInputs={waypointInputs}
          onWaypointAdd={handleWaypointAdd}
          onWaypointRemove={handleWaypointRemove}
          onWaypointChange={handleWaypointChange}
          loading={false}
          error=""
          isValid={isValid}
          onGetRoute={handleGetRoute}
          travelMode={travelMode}
          onTravelModeChange={setTravelMode}
          weatherData={weatherData}
          weatherLoading={weatherLoading}
          currentPosition={currentPosition}
          recentSearches={recentSearches}
          tripHistory={tripHistory}
          showTripHistory={showTripHistory}
          onToggleTripHistory={() => setShowTripHistory((p) => !p)}
          onQuickDestination={(place) => { setDestination(place); setDestinationCoords(null); }}
          isLoaded={isLoaded}
          authChecked={authChecked}
          onNearestEventChange={() => { /* nearest event is resolved on the map page */ }}
          onReRouteFromTrip={handleReRouteFromTrip}
        />
      </div>

      {/* Google Places autocomplete dropdown styles */}
      <style>{`
        .pac-container { background-color:#0f172a !important; border:1px solid rgba(56,189,248,0.2) !important; border-radius:16px !important; box-shadow:0 20px 40px rgba(0,0,0,0.55) !important; margin-top:6px !important; font-family:inherit !important; overflow:hidden; }
        .pac-item { background-color:#0f172a !important; color:#cbd5e1 !important; border-top:1px solid rgba(255,255,255,0.06) !important; padding:11px 14px !important; cursor:pointer !important; font-size:14px !important; }
        .pac-item:hover, .pac-item-selected { background-color:#1e293b !important; }
        .pac-item-query { color:#f8fafc !important; font-size:14px !important; font-weight:600 !important; }
        .pac-matched { color:#38bdf8 !important; }
        .pac-icon { filter:invert(1) opacity(0.35) !important; }
      `}</style>

      {/* Profile sheet */}
      {showProfile && (
        <ProfileSheet
          currentUsername={currentUsername}
          profileData={profileData}
          showChangePassword={showChangePassword}
          onToggleChangePassword={() => setShowChangePassword((p) => !p)}
          cpCurrent={cpCurrent} onCpCurrentChange={setCpCurrent}
          cpNew={cpNew}         onCpNewChange={setCpNew}
          cpConfirm={cpConfirm} onCpConfirmChange={setCpConfirm}
          cpError={cpError} cpSuccess={cpSuccess} cpLoading={cpLoading}
          onChangePassword={handleChangePassword}
          onClose={handleCloseProfile}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
