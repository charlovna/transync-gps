"use client";

import { GoogleMap, LoadScript } from "@react-google-maps/api";

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100vh",
};

const lipaCenter = { lat: 13.9411, lng: 121.1631 }; // Lipa City

export default function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div style={{ padding: 16, fontFamily: "monospace" }}>
        Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={lipaCenter}
        zoom={13}
        options={{
          mapTypeId: "roadmap", // ✅ default map, not satellite
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          clickableIcons: false,
        }}
      />
    </LoadScript>
  );
}