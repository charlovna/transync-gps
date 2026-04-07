"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useJsApiLoader } from "@react-google-maps/api";
import MapView from "./components/MapView";
import PlannerPanel from "./components/PlannerPanel";
import AdvisoryPanel from "./components/AdvisoryPanel";
import NavigationHUD from "./components/NavigationHUD";
import ArrivalOverlay from "./components/ArrivalOverlay";
import ProfileSheet from "./components/ProfileSheet";
import type { LatLng, RouteData, WeatherData, RecentSearch, TripRecord, ProfileData, RiskBadge, WaypointStop } from "./lib/types";

// Must be module-level — stable reference required by useJsApiLoader
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing")[] = ["places"];

function getDistanceMeters(from: LatLng, to: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getToken(): string {
  return localStorage.getItem("transync_token") || sessionStorage.getItem("transync_token") || "";
}

function riskBadgeFor(level?: string): RiskBadge {
  switch (level) {
    case "Low":    return { bg: "#10b981", text: "#fff" };
    case "Medium": return { bg: "#eab308", text: "#0f172a" };
    case "High":   return { bg: "#ef4444", text: "#fff" };
    default:       return { bg: "#475569", text: "#fff" };
  }
}

export default function Home() {
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
  const [destination, setDestination]           = useState("");
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null);
  const [waypointInputs, setWaypointInputs]     = useState<WaypointStop[]>([]);
  const [routeData, setRouteData]               = useState<RouteData | null>(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");
  const [gpsLoading, setGpsLoading]             = useState(true);
  const [gpsError, setGpsError]                 = useState("");
  const [currentPosition, setCurrentPosition]   = useState<LatLng | null>(null);
  const [locationAddress, setLocationAddress]   = useState("Fetching current location...");
  const [locationCoords, setLocationCoords]     = useState("");

  // ── View state ────────────────────────────────────────────────────────────
  // showPlanner: planner overlay visible (Steps 1 & 2)
  // showAdvisory: true = Step 2 (advisory); false = Step 1 (search form)
  const [showPlanner, setShowPlanner]           = useState(true);
  const [showAdvisory, setShowAdvisory]         = useState(false);
  const [hudMinimized, setHudMinimized]         = useState(false);
  const [gyroEnabled, setGyroEnabled]           = useState(false);
  const [tripStarted, setTripStarted]           = useState(false);
  const [recenterRequest, setRecenterRequest]   = useState(0);
  const [activeTripId, setActiveTripId]         = useState<number | null>(null);
  const [zoomRequest, setZoomRequest]           = useState<{ delta: number; seq: number }>({ delta: 0, seq: 0 });

  // ── Weather ───────────────────────────────────────────────────────────────
  const [weatherData, setWeatherData]           = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading]     = useState(false);
  const weatherFetchedRef                       = useRef(false);

  // ── Searches + trips ──────────────────────────────────────────────────────
  const [recentSearches, setRecentSearches]     = useState<RecentSearch[]>([]);
  const [tripHistory, setTripHistory]           = useState<TripRecord[]>([]);
  const [showTripHistory, setShowTripHistory]   = useState(false);

  // ── Profile ───────────────────────────────────────────────────────────────
  const [showProfile, setShowProfile]           = useState(false);
  const [profileData, setProfileData]           = useState<ProfileData | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrent, setCpCurrent]               = useState("");
  const [cpNew, setCpNew]                       = useState("");
  const [cpConfirm, setCpConfirm]               = useState("");
  const [cpError, setCpError]                   = useState("");
  const [cpSuccess, setCpSuccess]               = useState("");
  const [cpLoading, setCpLoading]               = useState(false);

  // ── Arrival ───────────────────────────────────────────────────────────────
  const [showArrival, setShowArrival]               = useState(false);
  const [arrivalRating, setArrivalRating]           = useState(0);
  const [arrivalFeedback, setArrivalFeedback]       = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted]   = useState(false);
  const [tripDurationMinutes, setTripDurationMinutes] = useState(0);
  const [arrivalAccuracy, setArrivalAccuracy]       = useState(0);
  const tripStartTimeRef    = useRef<number>(0);
  const arrivalTriggeredRef = useRef(false);

  // ── AI advisory ───────────────────────────────────────────────────────────
  const [aiInsight, setAiInsight]               = useState("");
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const aiInsightFetchedRef                     = useRef(false); // guard: fires once per route
  const streamBufferRef                         = useRef("");    // raw received text
  const displayLenRef                           = useRef(0);    // chars currently shown
  const typewriterRef                           = useRef<number | null>(null);

  // ── Dynamic ETA — original speed stored at trip start ────────────────────
  const originalEtaMpsRef = useRef(0); // avg speed in m/s from initial route

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "";
  const isValid    = useMemo(() => destination.trim().length > 0, [destination]);
  const riskBadge  = riskBadgeFor(routeData?.risk_level);

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

  const saveSearch = async (dest: string, subAddress: string) => {
    if (!backendUrl) return;
    try {
      await fetch(`${backendUrl}/searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ destination: dest, sub_address: subAddress }),
      });
      fetchRecentSearches();
    } catch { /* non-fatal */ }
  };

  const startTripBackend = async (rd: RouteData): Promise<number | null> => {
    if (!backendUrl) return null;
    try {
      const r = await fetch(`${backendUrl}/trips/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          origin_label: rd.origin_label || "",
          destination_label: rd.destination_label || "",
          eta_minutes: rd.eta_minutes ?? null,
          risk_level: rd.risk_level || "Low",
          distance_km: rd.distance_km ?? null,
        }),
      });
      const d = await r.json();
      return d.trip_id ?? null;
    } catch { return null; }
  };

  const endTripBackend = async (tripId: number) => {
    if (!backendUrl) return;
    try {
      await fetch(`${backendUrl}/trips/${tripId}/end`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch { /* non-fatal */ }
  };

  // ── GPS watcher (starts immediately, independent of auth) ─────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsLoading(false); setGpsError("Geolocation not supported.");
      setLocationAddress("Current location unavailable"); return;
    }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
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
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
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

  // ── Arrival detection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripStarted || !currentPosition || !routeData?.destination_position) return;
    if (arrivalTriggeredRef.current) return;
    if (getDistanceMeters(currentPosition, routeData.destination_position) > 150) return;
    arrivalTriggeredRef.current = true;
    const elapsed = Math.max(1, Math.round((Date.now() - tripStartTimeRef.current) / 60000));
    let accuracy = 88;
    if (weatherData) accuracy += 5;
    if (routeData.risk_level === "Low")  accuracy += 3;
    if (routeData.risk_level === "High") accuracy -= 6;
    setTripDurationMinutes(elapsed);
    setArrivalAccuracy(Math.min(99, Math.max(75, accuracy)));
    setArrivalRating(0); setArrivalFeedback(""); setFeedbackSubmitted(false);
    setShowArrival(true); setTripStarted(false);
    if (activeTripId) { endTripBackend(activeTripId); setActiveTripId(null); }
    fetchTripHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition, tripStarted]);

  // ── Dynamic ETA — recomputes every 15s while trip is active ─────────────
  useEffect(() => {
    if (!tripStarted || !routeData) return;
    const tick = () => {
      const elapsedMin = (Date.now() - tripStartTimeRef.current) / 60000;
      // If we have distance-to-destination and avg speed, compute remaining ETA
      if (originalEtaMpsRef.current > 0 && currentPosition && routeData.destination_position) {
        const remaining = getDistanceMeters(currentPosition, routeData.destination_position);
        const etaMin = Math.max(1, Math.round(remaining / originalEtaMpsRef.current / 60));
        setRouteData((prev) => prev ? { ...prev, eta_minutes: etaMin } : prev);
      } else {
        // Fallback: count down from original ETA by elapsed time
        const original = routeData.eta_minutes ?? 0;
        const remaining = Math.max(1, Math.round(original - elapsedMin));
        setRouteData((prev) => prev ? { ...prev, eta_minutes: remaining } : prev);
      }
    };
    tick(); // immediate first tick
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripStarted]);

  // ── AI insight streaming — smooth typewriter ─────────────────────────────
  const fetchAiInsight = async (data: RouteData) => {
    if (aiInsightFetchedRef.current) return;
    aiInsightFetchedRef.current = true;
    streamBufferRef.current = "";
    displayLenRef.current = 0;
    setAiInsightLoading(true);

    // Typewriter: reveals one char every 18ms from the buffer as it fills
    const startTypewriter = () => {
      if (typewriterRef.current !== null) return;
      typewriterRef.current = window.setInterval(() => {
        const buf = streamBufferRef.current;
        const cur = displayLenRef.current;
        if (cur >= buf.length) return;
        // Advance by 1–3 chars per tick to feel fluid, not robotic
        const step = buf[cur] === " " ? 2 : 1;
        const next = Math.min(cur + step, buf.length);
        displayLenRef.current = next;
        setAiInsight(buf.slice(0, next));
      }, 18);
    };

    try {
      const res = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: data.destination_label || destination,
          eta_minutes: data.eta_minutes,
          risk_level: data.risk_level,
          advisory_text: data.advisory_text,
          weather: weatherData,
        }),
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      startTypewriter();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamBufferRef.current += decoder.decode(value, { stream: true });
      }
      // Stream done — let typewriter finish revealing remaining buffer
      const flush = window.setInterval(() => {
        const buf = streamBufferRef.current;
        if (displayLenRef.current >= buf.length) {
          window.clearInterval(flush);
          if (typewriterRef.current !== null) {
            window.clearInterval(typewriterRef.current);
            typewriterRef.current = null;
          }
          setAiInsight(buf); // ensure full text is shown
          setAiInsightLoading(false);
        }
      }, 40);
    } catch {
      if (typewriterRef.current !== null) {
        window.clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
      setAiInsightLoading(false);
    }
  };

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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGetRoute = async () => {
    setError(""); setRouteData(null); setAiInsight(""); setAiInsightLoading(false);
    aiInsightFetchedRef.current = false; // reset guard for new route
    if (!destination.trim()) { setError("Destination is required."); return; }
    if (!currentPosition) {
      setError(gpsLoading
        ? "Waiting for GPS fix — please hold a moment."
        : "Unable to get your location. Check location permissions and try again.");
      return;
    }
    try {
      setLoading(true);
      if (!backendUrl) { setError("Missing NEXT_PUBLIC_BACKEND_API_URL"); return; }
      const originValue = `${currentPosition.lat},${currentPosition.lng}`;
      const destValue   = destinationCoords
        ? `${destinationCoords.lat},${destinationCoords.lng}`
        : destination.trim();
      const waypointValues = waypointInputs
        .filter((w) => w.address.trim().length > 0)
        .map((w) => w.coords ? `${w.coords.lat},${w.coords.lng}` : w.address.trim());

      const res = await fetch(`${backendUrl}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ origin: originValue, destination: destValue, mode: "driving", waypoints: waypointValues }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to generate route advisory."); return; }
      setRouteData(data);
      setShowAdvisory(true);       // ← Step 2: switch to advisory view
      fetchAiInsight(data);        // non-blocking stream
      saveSearch(destination.trim(), data.destination_label || destination.trim());
    } catch (err) {
      console.error("Route request failed:", err);
      setError("Unable to connect to the Transync backend.");
    } finally { setLoading(false); }
  };

  const handleStartTrip = async () => {
    tripStartTimeRef.current = Date.now();
    arrivalTriggeredRef.current = false;
    // Store avg speed (m/s) from original route for live ETA recompute
    if (routeData?.eta_minutes && routeData?.distance_km) {
      originalEtaMpsRef.current = (routeData.distance_km * 1000) / (routeData.eta_minutes * 60);
    } else {
      originalEtaMpsRef.current = 0;
    }
    setTripStarted(true); setHudMinimized(false);
    setShowPlanner(false); setShowAdvisory(false);
    setRecenterRequest((prev) => prev + 1);
    if (routeData) {
      const tripId = await startTripBackend(routeData);
      setActiveTripId(tripId);
    }
  };

  const handleEndTrip = () => {
    setTripStarted(false);
    setShowPlanner(true); setShowAdvisory(false); // ← back to Step 1 after trip
    if (activeTripId) { endTripBackend(activeTripId); setActiveTripId(null); fetchTripHistory(); }
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
    <div className="relative w-full overflow-hidden bg-slate-950 text-white" style={{ height: "100dvh" }} aria-label="Transync navigation">
      <div aria-label="Navigation map" aria-hidden={!isLoaded} role="img">
      <MapView
        routeData={routeData} loading={loading} tripStarted={tripStarted}
        gyroEnabled={gyroEnabled} recenterRequest={recenterRequest}
        isLoaded={isLoaded} userPos={currentPosition}
        zoomRequest={zoomRequest}
      />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-slate-950/10" />

      {/* ══ STEP 3 — NAVIGATION HUD ══ */}
      {tripStarted && (
        <NavigationHUD
          routeData={routeData} destination={destination} riskBadge={riskBadge}
          hudMinimized={hudMinimized} onToggleHud={() => setHudMinimized((p) => !p)}
          gyroEnabled={gyroEnabled} onGyroToggle={() => setGyroEnabled((p) => !p)}
          onRecenter={() => setRecenterRequest((p) => p + 1)}
          onEndTrip={handleEndTrip}
          onZoomIn={() => setZoomRequest((p) => ({ delta: 1, seq: p.seq + 1 }))}
          onZoomOut={() => setZoomRequest((p) => ({ delta: -1, seq: p.seq + 1 }))}
        />
      )}

      {/* ══ STEPS 1 & 2 — PLANNER OVERLAY ══ */}
      {showPlanner && (
        <div role="main" aria-label="Route planner" className="absolute inset-0 z-20 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" as const }}>
          <div className="min-h-full px-4 py-4 pb-10 md:flex md:items-center md:justify-center md:p-6">

            {/* Step 1 — Search screen */}
            {!showAdvisory && (
              <PlannerPanel
                currentUsername={currentUsername}
                onOpenProfile={() => setShowProfile(true)}
                onSignOut={handleSignOut}
                locationAddress={locationAddress} locationCoords={locationCoords}
                gpsLoading={gpsLoading} gpsError={gpsError}
                destination={destination}
                onDestinationChange={setDestination}
                onDestinationCoordsChange={setDestinationCoords}
                waypointInputs={waypointInputs}
                onWaypointAdd={handleWaypointAdd}
                onWaypointRemove={handleWaypointRemove}
                onWaypointChange={handleWaypointChange}
                loading={loading} error={error} isValid={isValid}
                onGetRoute={handleGetRoute}
                weatherData={weatherData} weatherLoading={weatherLoading} currentPosition={currentPosition}
                recentSearches={recentSearches}
                tripHistory={tripHistory} showTripHistory={showTripHistory}
                onToggleTripHistory={() => setShowTripHistory((p) => !p)}
                onQuickDestination={setDestination}
                isLoaded={isLoaded} authChecked={authChecked}
              />
            )}

            {/* Step 2 — Advisory screen */}
            {showAdvisory && routeData && (
              <AdvisoryPanel
                routeData={routeData} destination={destination} riskBadge={riskBadge}
                aiInsight={aiInsight} aiInsightLoading={aiInsightLoading}
                gyroEnabled={gyroEnabled} onGyroToggle={() => setGyroEnabled((p) => !p)}
                onStartTrip={handleStartTrip}
                onBack={() => setShowAdvisory(false)}
                onSearchDifferent={() => {
                  setShowAdvisory(false);
                  setRouteData(null);
                  setDestination("");
                  setWaypointInputs([]);
                  setAiInsight("");
                  aiInsightFetchedRef.current = false;
                }}
              />
            )}

          </div>
        </div>
      )}

      {/* ══ PROFILE SHEET ══ */}
      {showProfile && (
        <ProfileSheet
          currentUsername={currentUsername} profileData={profileData}
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

      {/* ══ ARRIVAL OVERLAY ══ */}
      {showArrival && (
        <ArrivalOverlay
          routeData={routeData} destination={destination}
          tripDurationMinutes={tripDurationMinutes} arrivalAccuracy={arrivalAccuracy}
          arrivalRating={arrivalRating} onSetRating={setArrivalRating}
          arrivalFeedback={arrivalFeedback} onSetFeedback={setArrivalFeedback}
          feedbackSubmitted={feedbackSubmitted} onSubmitFeedback={() => setFeedbackSubmitted(true)}
          onPlanNew={() => { setShowArrival(false); setRouteData(null); setDestination(""); setShowPlanner(true); }}
          onDashboard={() => { setShowArrival(false); setShowPlanner(true); }}
        />
      )}

      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes ai-pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        .pac-container { background-color:#0f172a !important; border:1px solid rgba(56,189,248,0.2) !important; border-radius:16px !important; box-shadow:0 20px 40px rgba(0,0,0,0.55) !important; margin-top:6px !important; font-family:inherit !important; overflow:hidden; }
        .pac-item { background-color:#0f172a !important; color:#cbd5e1 !important; border-top:1px solid rgba(255,255,255,0.06) !important; padding:11px 14px !important; cursor:pointer !important; font-size:14px !important; }
        .pac-item:hover, .pac-item-selected { background-color:#1e293b !important; }
        .pac-item-query { color:#f8fafc !important; font-size:14px !important; font-weight:600 !important; }
        .pac-matched { color:#38bdf8 !important; }
        .pac-icon { filter:invert(1) opacity(0.35) !important; }
      `}</style>
    </div>
  );
}
