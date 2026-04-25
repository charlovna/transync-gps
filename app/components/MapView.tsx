"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  TrafficLayer,
} from "@react-google-maps/api";
import gsap from "gsap";

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

const lipaCenter = { lat: 13.9411, lng: 121.1631 };

type LatLng = { lat: number; lng: number };
type RiskLevel = "Low" | "Medium" | "High";

type WaypointStop = {
  address: string;
  coords: LatLng | null;
  position?: LatLng;
};

type AlternativeRoute = {
  polyline: LatLng[];
  eta_minutes: number;
  risk_level: RiskLevel;
  route_summary: string | null;
  distance_km: number | null;
};

type RouteData = {
  polyline?: LatLng[];
  eta_minutes?: number;
  risk_level?: RiskLevel;
  advisory_text?: string;
  recommended_departure_time?: string;
  origin_label?: string;
  destination_label?: string;
  origin_position?: LatLng;
  destination_position?: LatLng;
  waypoints?: WaypointStop[];
  routes?: AlternativeRoute[];
};

type MapViewProps = {
  routeData?: RouteData | null;
  loading?: boolean;
  tripStarted?: boolean;
  gyroEnabled?: boolean;
  recenterRequest?: number;
  isLoaded?: boolean;
  userPos?: LatLng | null;
  zoomRequest?: { delta: number; seq: number };
  selectedRouteIndex?: number;
};

const midnightIndigoMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1120" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111827" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0b1324" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#22304a" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#172033" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#020617" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
];

function toRadians(deg: number) { return (deg * Math.PI) / 180; }
function toDegrees(rad: number) { return (rad * 180) / Math.PI; }

function getBearing(from: LatLng, to: LatLng) {
  const lat1 = toRadians(from.lat), lng1 = toRadians(from.lng);
  const lat2 = toRadians(to.lat),   lng2 = toRadians(to.lng);
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function getDistanceMeters(from: LatLng, to: LatLng) {
  const R = 6371000;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function smoothHeading(prev: number, next: number, factor = 0.10) {
  const delta = ((next - prev + 540) % 360) - 180;
  return (prev + delta * factor + 360) % 360;
}

export default function MapView({
  routeData,
  loading = false,
  tripStarted = false,
  gyroEnabled = false,
  recenterRequest = 0,
  isLoaded = false,
  userPos = null,
  zoomRequest,
  selectedRouteIndex = 0,
}: MapViewProps) {
  const [heading, setHeading] = useState(0);
  const [mapsReady, setMapsReady] = useState(false);
  const [animatedPath, setAnimatedPath] = useState<LatLng[]>([]);

  const mapRef               = useRef<google.maps.Map | null>(null);
  const mapContainerRef      = useRef<HTMLDivElement>(null);
  const loadingOverlayRef    = useRef<HTMLDivElement>(null);
  const animationRef         = useRef<number | null>(null);
  const routeCameraTimeoutRef = useRef<number[]>([]);
  const previousUserPosRef   = useRef<LatLng | null>(null);
  const lastNavPanRef        = useRef<number>(0);
  // Suspends auto-follow while the user is actively panning/zooming so a
  // mid-trip pinch or pan isn't immediately yanked back by the next GPS tick.
  // Cleared by recenter (explicit re-engage) and on trip start.
  const userInteractingUntilRef = useRef<number>(0);
  // GSAP tween refs — killed before starting a new one to prevent conflicts
  const cameraPanTweenRef    = useRef<gsap.core.Tween | null>(null);
  const zoomTweenRef         = useRef<gsap.core.Tween | null>(null);

  // ── Heading — computed from incoming userPos prop ─────────────────────────
  useEffect(() => {
    if (!userPos) return;
    const prevPos = previousUserPosRef.current;
    if (prevPos) {
      const dist = getDistanceMeters(prevPos, userPos);
      if (dist >= 8) {
        const nextBearing = getBearing(prevPos, userPos);
        setHeading((prev) => smoothHeading(prev, nextBearing));
      }
    }
    previousUserPosRef.current = userPos;
  }, [userPos]);

  // ── Map center ───────────────────────────────────────────────────────────
  const mapCenter = useMemo(() => {
    if (tripStarted && userPos) return userPos;
    if (animatedPath.length > 0) return animatedPath[0];
    if (routeData?.origin_position) return routeData.origin_position;
    return userPos || lipaCenter;
  }, [tripStarted, userPos, animatedPath, routeData?.origin_position]);

  // Capture the *initial* map center once. Passing `center` as a controlled
  // prop would re-apply setCenter on every GPS tick (userPos → new ref each
  // tick → mapCenter changes → <GoogleMap> snaps the camera). All ongoing
  // camera moves are handled imperatively below — fitBounds, panTo, GSAP
  // tweens — so the React `center` prop only needs to seed the first frame.
  const initialCenterRef = useRef<LatLng | null>(null);
  if (!initialCenterRef.current) initialCenterRef.current = mapCenter;

  // ── Route polyline animation ─────────────────────────────────────────────
  useEffect(() => {
    const fullPath = routeData?.polyline ?? [];
    if (animationRef.current) { window.clearInterval(animationRef.current); animationRef.current = null; }
    if (!fullPath.length) { setAnimatedPath([]); return; }

    setAnimatedPath([fullPath[0]]);
    let index = 1;
    animationRef.current = window.setInterval(() => {
      setAnimatedPath((prev) => {
        if (index >= fullPath.length) {
          window.clearInterval(animationRef.current!);
          animationRef.current = null;
          return fullPath;
        }
        const next = [...prev, fullPath[index]];
        index++;
        return next;
      });
    }, 35);

    return () => { if (animationRef.current) { window.clearInterval(animationRef.current); animationRef.current = null; } };
  }, [routeData?.polyline]);

  // ── Camera: route overview (before trip starts) ──────────────────────────
  useEffect(() => {
    if (!mapRef.current || !routeData?.polyline?.length || tripStarted || !mapsReady) return;

    routeCameraTimeoutRef.current.forEach((id) => window.clearTimeout(id));
    routeCameraTimeoutRef.current = [];

    const map = mapRef.current;
    const bounds = new google.maps.LatLngBounds();
    if (routeData.origin_position) bounds.extend(routeData.origin_position);
    if (routeData.destination_position) bounds.extend(routeData.destination_position);
    routeData.waypoints?.forEach((wp) => { if (wp.position) bounds.extend(wp.position); });
    routeData.polyline.forEach((p) => bounds.extend(p));

    const focus = routeData.origin_position || routeData.polyline[0] || lipaCenter;
    map.panTo(focus);
    map.setZoom(16);

    const t1 = window.setTimeout(() => { map.panTo(focus); map.setZoom(17); }, 350);
    const t2 = window.setTimeout(() => { map.fitBounds(bounds, 100); }, 1200);
    routeCameraTimeoutRef.current = [t1, t2];

    return () => { routeCameraTimeoutRef.current.forEach((id) => window.clearTimeout(id)); };
  }, [routeData?.polyline, routeData?.origin_position, routeData?.destination_position, tripStarted, mapsReady]);

  // ── Camera: navigation follow — GSAP smooth interpolated pan ─────────────
  useEffect(() => {
    if (!mapRef.current || !tripStarted || !userPos || !mapsReady) return;

    // Bail while the user is actively interacting — pinch/pan/wheel set this
    // ref via listeners attached in handleMapLoad. Without this guard the
    // next GPS tick would yank the camera back mid-gesture.
    if (Date.now() < userInteractingUntilRef.current) return;

    const now = Date.now();
    if (now - lastNavPanRef.current < 800) return;
    lastNavPanRef.current = now;

    const map = mapRef.current;

    // Kill any in-flight pan and smoothly interpolate to new GPS position
    if (cameraPanTweenRef.current) cameraPanTweenRef.current.kill();
    const center = map.getCenter();
    if (center) {
      const pos = { lat: center.lat(), lng: center.lng() };
      cameraPanTweenRef.current = gsap.to(pos, {
        lat: userPos.lat,
        lng: userPos.lng,
        duration: 0.85,
        ease: "power2.out",
        onUpdate: () => map.setCenter({ lat: pos.lat, lng: pos.lng }),
      }) as gsap.core.Tween;
    } else {
      map.panTo(userPos);
    }

    // BUG FIX: zoom, heading, and tilt USED to be set here on every GPS tick.
    // That's what caused the "after zooming out, it keeps zooming in" bug —
    // every ~1s the nav follow would yank zoom back to 17. Those concerns
    // now live in their own effects below so they don't fight user intent.
  }, [tripStarted, userPos, mapsReady]);

  // ── Camera: trip-start one-shot zoom ─────────────────────────────────────
  // Fires ONCE when a trip begins. After this, zoom is fully user-controlled
  // (pinch, scroll, FABs). The only other path that changes zoom is a
  // recenter tap (explicit user intent) or a zoomRequest from the FABs.
  useEffect(() => {
    if (!tripStarted || !mapRef.current || !mapsReady) return;
    // Starting a trip is an explicit re-engage — clear any leftover
    // interaction lockout from the planning view so follow kicks in now.
    userInteractingUntilRef.current = 0;
    const map = mapRef.current;
    const currentZoom = map.getZoom() ?? 15;
    if (currentZoom >= 17) return;

    if (zoomTweenRef.current) zoomTweenRef.current.kill();
    const zObj = { z: currentZoom };
    zoomTweenRef.current = gsap.to(zObj, {
      z: 17,
      duration: 0.7,
      ease: "power2.out",
      onUpdate: () => map.setZoom(zObj.z),
    }) as gsap.core.Tween;
    // Deliberately NOT depending on userPos — this runs once per trip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripStarted, mapsReady]);

  // ── Heading — updates each tick; smoothHeading already damps GPS jitter ─
  useEffect(() => {
    if (!mapRef.current || !mapsReady) return;
    const map = mapRef.current;
    map.setHeading((tripStarted && gyroEnabled) ? heading : 0);
  }, [heading, gyroEnabled, tripStarted, mapsReady]);

  // ── Tilt — GSAP transition when gyro toggles (was a hard 0↔45 jump) ─────
  const tiltTweenRef = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    if (!mapRef.current || !mapsReady) return;
    const map = mapRef.current;
    const currentTilt = map.getTilt?.() ?? 0;
    const targetTilt  = (tripStarted && gyroEnabled) ? 45 : 0;
    if (Math.abs(currentTilt - targetTilt) < 0.5) return;

    if (tiltTweenRef.current) tiltTweenRef.current.kill();
    const tObj = { t: currentTilt };
    tiltTweenRef.current = gsap.to(tObj, {
      t: targetTilt,
      duration: 0.55,
      ease: "power2.inOut",
      onUpdate: () => map.setTilt(tObj.t),
    }) as gsap.core.Tween;
  }, [gyroEnabled, tripStarted, mapsReady]);

  // ── Camera: recenter button — GSAP smooth pan ────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userPos || recenterRequest === 0 || !mapsReady) return;

    // Recenter is the explicit "re-engage follow" gesture — drop any pending
    // interaction lockout so subsequent GPS ticks resume auto-follow.
    userInteractingUntilRef.current = 0;

    const map = mapRef.current;

    if (cameraPanTweenRef.current) cameraPanTweenRef.current.kill();
    const center = map.getCenter();
    if (center) {
      const pos = { lat: center.lat(), lng: center.lng() };
      cameraPanTweenRef.current = gsap.to(pos, {
        lat: userPos.lat,
        lng: userPos.lng,
        duration: 0.6,
        ease: "power3.out",
        onUpdate: () => map.setCenter({ lat: pos.lat, lng: pos.lng }),
      }) as gsap.core.Tween;
    } else {
      map.panTo(userPos);
    }

    const targetZoom = tripStarted ? 17 : 16;
    const currentZoom = map.getZoom() ?? 15;
    if (currentZoom < targetZoom) {
      if (zoomTweenRef.current) zoomTweenRef.current.kill();
      const zObj = { z: currentZoom };
      zoomTweenRef.current = gsap.to(zObj, {
        z: targetZoom,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => map.setZoom(zObj.z),
      }) as gsap.core.Tween;
    }

    // Heading + tilt are handled by their own dedicated effects; recenter
    // intentionally doesn't touch them so those effects remain the single
    // source of truth and we don't double-drive the same property.
  }, [recenterRequest, userPos, tripStarted, mapsReady]);

  // ── Zoom in / out requests — GSAP smooth zoom ───────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapsReady || !zoomRequest) return;
    const map = mapRef.current;
    const currentZoom = map.getZoom() ?? 15;
    const targetZoom = Math.min(21, Math.max(3, currentZoom + zoomRequest.delta));

    if (zoomTweenRef.current) zoomTweenRef.current.kill();
    const zObj = { z: currentZoom };
    zoomTweenRef.current = gsap.to(zObj, {
      z: targetZoom,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: () => map.setZoom(zObj.z),
    }) as gsap.core.Tween;
  }, [zoomRequest, mapsReady]);

  // ── Loading overlay: GSAP fade in/out ────────────────────────────────────
  useEffect(() => {
    const el = loadingOverlayRef.current;
    if (!el) return;
    if (loading) {
      gsap.fromTo(el,
        { opacity: 0, y: 12, pointerEvents: "none" },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out",
          onStart: () => { el.style.pointerEvents = "auto"; } }
      );
    } else {
      gsap.to(el, {
        opacity: 0, y: -8, duration: 0.25, ease: "power2.in",
        onComplete: () => { el.style.pointerEvents = "none"; },
      });
    }
  }, [loading]);

  // ── Map container fade-in when Maps JS API first loads ───────────────────
  useEffect(() => {
    if (isLoaded && mapContainerRef.current) {
      gsap.fromTo(mapContainerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: "power1.out" }
      );
    }
  }, [isLoaded]);

  // ── Cleanup all GSAP tweens on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      cameraPanTweenRef.current?.kill();
      zoomTweenRef.current?.kill();
      tiltTweenRef.current?.kill();
      if (animationRef.current) window.clearInterval(animationRef.current);
    };
  }, []);

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    // `dragstart` fires for single-finger pan; pinch-zoom and wheel-zoom
    // don't trip it, so those are handled by native listeners on the
    // container div (see effect below).
    map.addListener("dragstart", () => {
      userInteractingUntilRef.current = Date.now() + 8000;
    });
    setMapsReady(true);
  };

  // Pinch + scroll-wheel zoom listeners — Google Maps swallows these before
  // they bubble to React handlers, so we attach passively on the container
  // and bump the interaction window. 8s gives the user time to read what
  // they zoomed to before the next GPS tick re-engages follow.
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const bump = () => { userInteractingUntilRef.current = Date.now() + 8000; };
    const onTouch = (e: TouchEvent) => { if (e.touches.length >= 2) bump(); };
    el.addEventListener("wheel", bump, { passive: true });
    el.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      el.removeEventListener("wheel", bump);
      el.removeEventListener("touchstart", onTouch);
    };
  }, []);

  // ── Loading placeholder (Maps JS API not yet ready) ──────────────────────
  if (!isLoaded) {
    return (
      <div style={{
        position: "absolute", inset: 0, background: "#020617",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ color: "#475569", fontSize: 14, fontFamily: "inherit" }}>Loading map...</p>
      </div>
    );
  }

  const liveMarkerIcon =
    mapsReady && typeof google !== "undefined"
      ? {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: tripStarted ? 7 : 5,
          fillColor: "#38bdf8",
          fillOpacity: 1,
          strokeColor: "#e0f2fe",
          strokeWeight: 2,
          rotation: heading,
          anchor: new google.maps.Point(0, 2),
        }
      : undefined;

  return (
    <div ref={mapContainerRef} style={{ position: "absolute", inset: 0, willChange: "opacity" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenterRef.current ?? mapCenter}
        zoom={15}
        onLoad={handleMapLoad}
        options={{
          mapTypeId: "roadmap",
          styles: midnightIndigoMapStyle,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          zoomControl: false,
          scrollwheel: true,
          gestureHandling: "greedy",
          disableDefaultUI: true,
          minZoom: 3,
          maxZoom: 21,
        }}
      >
        {/* Live user position */}
        {userPos && (
          <Marker
            position={userPos}
            title={`Your Location • ${Math.round(heading)}°`}
            icon={liveMarkerIcon}
          />
        )}

        {/* Origin marker */}
        {routeData?.origin_position && (
          <Marker
            position={routeData.origin_position}
            title={routeData.origin_label || "Origin"}
            label="A"
          />
        )}

        {/* Waypoint markers (B, C, D…) */}
        {routeData?.waypoints?.map((wp, i) =>
          wp.position ? (
            <Marker
              key={`wp-${i}`}
              position={wp.position}
              title={wp.address || `Stop ${i + 1}`}
              label={String.fromCharCode(66 + i)}
            />
          ) : null
        )}

        {/* Destination marker — letter shifts if waypoints present */}
        {routeData?.destination_position && (
          <Marker
            position={routeData.destination_position}
            title={routeData.destination_label || "Destination"}
            label={String.fromCharCode(66 + (routeData.waypoints?.length ?? 0))}
          />
        )}

        {/* Traffic layer */}
        <TrafficLayer />

        {/* Alternative routes (non-selected) — rendered beneath primary */}
        {routeData?.routes?.map((alt, i) =>
          i !== selectedRouteIndex && alt.polyline.length > 0 ? (
            <Polyline
              key={`alt-${i}`}
              path={alt.polyline}
              options={{ strokeColor: "#475569", strokeOpacity: 0.55, strokeWeight: 5, zIndex: 1 }}
            />
          ) : null
        )}

        {/* Ghost route (faded full primary path) */}
        {routeData?.polyline && routeData.polyline.length > 0 && (
          <Polyline
            path={routeData.polyline}
            options={{ strokeColor: "#60a5fa", strokeOpacity: 0.2, strokeWeight: 7, zIndex: 2 }}
          />
        )}

        {/* Animated route (solid, draws in on load) */}
        {animatedPath.length > 1 && (
          <Polyline
            path={animatedPath}
            options={{ strokeColor: "#38bdf8", strokeOpacity: 1, strokeWeight: 7, zIndex: 3 }}
          />
        )}
      </GoogleMap>

      {/* Loading overlay — always in DOM, GSAP drives opacity/position */}
      <div
        ref={loadingOverlayRef}
        style={{
          position: "absolute", inset: 0, zIndex: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(2,6,23,0.28)", backdropFilter: "blur(2px)",
          color: "#e2e8f0", fontFamily: "inherit", fontSize: 16, fontWeight: 600,
          opacity: 0, pointerEvents: "none",
          willChange: "transform, opacity",
        }}
      >
        Generating predictive advisory...
      </div>
    </div>
  );
}
