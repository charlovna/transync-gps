"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
} from "@react-google-maps/api";

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
}: MapViewProps) {
  const [heading, setHeading] = useState(0);
  const [mapsReady, setMapsReady] = useState(false);
  const [animatedPath, setAnimatedPath] = useState<LatLng[]>([]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const animationRef = useRef<number | null>(null);
  const routeCameraTimeoutRef = useRef<number[]>([]);
  const previousUserPosRef = useRef<LatLng | null>(null);
  // Track last pan time to avoid over-panning on every tiny GPS tick
  const lastNavPanRef = useRef<number>(0);

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

  // ── Camera: navigation follow (Waze/Google Maps style) ───────────────────
  useEffect(() => {
    if (!mapRef.current || !tripStarted || !userPos || !mapsReady) return;

    const now = Date.now();
    // Throttle pans to max once every 800ms for smoothness
    if (now - lastNavPanRef.current < 800) return;
    lastNavPanRef.current = now;

    const map = mapRef.current;
    map.panTo(userPos);

    const currentZoom = map.getZoom() ?? 15;
    if (currentZoom < 17) map.setZoom(17);

    if (gyroEnabled) {
      map.setHeading(heading);
      map.setTilt(45);
    } else {
      map.setHeading(0);
      map.setTilt(0);
    }
  }, [tripStarted, userPos, gyroEnabled, heading, mapsReady]);

  // ── Zoom in / out requests ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapsReady || !zoomRequest) return;
    const map = mapRef.current;
    const current = map.getZoom() ?? 15;
    map.setZoom(Math.min(21, Math.max(3, current + zoomRequest.delta)));
  }, [zoomRequest, mapsReady]);

  // ── Camera: recenter button ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userPos || recenterRequest === 0 || !mapsReady) return;

    const map = mapRef.current;
    map.panTo(userPos);

    const zoom = tripStarted ? 17 : 16;
    const current = map.getZoom() ?? 15;
    if (current < zoom) map.setZoom(zoom);

    if (tripStarted && gyroEnabled) {
      map.setHeading(heading);
      map.setTilt(45);
    } else {
      map.setHeading(0);
      map.setTilt(0);
    }
  }, [recenterRequest, userPos, tripStarted, gyroEnabled, heading, mapsReady]);

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapsReady(true);
  };

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
    // Height is 100dvh so map fills screen on mobile (accounts for browser chrome)
    <div style={{ position: "absolute", inset: 0 }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={15}
        onLoad={handleMapLoad}
        options={{
          mapTypeId: "roadmap",
          styles: midnightIndigoMapStyle,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          zoomControl: false,         // using custom FABs below
          scrollwheel: true,          // desktop scroll-to-zoom
          gestureHandling: "greedy",  // single-finger pan + pinch-zoom on mobile
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

        {/* Ghost route (faded) */}
        {routeData?.polyline && routeData.polyline.length > 0 && (
          <Polyline
            path={routeData.polyline}
            options={{ strokeColor: "#60a5fa", strokeOpacity: 0.2, strokeWeight: 7, zIndex: 1 }}
          />
        )}

        {/* Animated route (solid) */}
        {animatedPath.length > 1 && (
          <Polyline
            path={animatedPath}
            options={{ strokeColor: "#38bdf8", strokeOpacity: 1, strokeWeight: 7, zIndex: 2 }}
          />
        )}
      </GoogleMap>

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(2,6,23,0.28)", backdropFilter: "blur(2px)",
          color: "#e2e8f0", fontFamily: "inherit", fontSize: 16, fontWeight: 600,
        }}>
          Generating predictive advisory...
        </div>
      )}
    </div>
  );
}
