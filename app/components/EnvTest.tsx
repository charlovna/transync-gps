"use client";

export default function EnvTest() {
  const backend = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "undefined";
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "undefined";

  // Mask Google key for safety (show only first 8 chars)
  const maskedKey =
    mapsKey !== "undefined" ? mapsKey.substring(0, 8) + "..." : "undefined";

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 9999,
        background: "yellow",
        padding: 10,
        fontSize: 12,
        borderRadius: 6,
        fontFamily: "monospace",
      }}
    >
      <div><strong>Backend:</strong> {backend}</div>
      <div><strong>Maps Key:</strong> {maskedKey}</div>
    </div>
  );
}