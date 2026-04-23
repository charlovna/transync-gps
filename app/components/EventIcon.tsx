"use client";

import React from "react";

// Professional Lucide-style SVG icon set mapped per event id.
// currentColor means the icon inherits its parent's color — keeps the
// cyan/amber/violet accent system working without per-icon config.
// Each icon is designed at 24×24 viewBox, 1.6 strokeWidth for a refined line.

type Props = {
  id: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

const strokeProps = {
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Cathedral() {
  // Church with central spire + cross — for san-sebastian-fiesta
  return (
    <>
      {/* Cross on spire */}
      <path d="M12 2v3M10.5 3.5h3" />
      {/* Spire */}
      <path d="M12 5l3 4H9z" />
      {/* Body */}
      <path d="M9 9v12M15 9v12" />
      {/* Arched doorway */}
      <path d="M10.5 21v-4a1.5 1.5 0 0 1 3 0v4" />
      {/* Side wings */}
      <path d="M5 13v8h4M19 13v8h-4" />
      {/* Windows */}
      <path d="M6.5 16v2M17.5 16v2" />
      {/* Ground */}
      <path d="M4 21h16" />
    </>
  );
}

function Cross() {
  // Latin cross with light rays — for semana-santa
  return (
    <>
      <path d="M12 3v18M8 8h8" />
      {/* Soft light rays */}
      <path d="M4 5l1.5 1.5M20 5l-1.5 1.5M3 12h2M19 12h2" opacity="0.55" />
    </>
  );
}

function SteamBowl() {
  // Bowl with three steam trails — for lomi-festival
  return (
    <>
      {/* Bowl */}
      <path d="M3 12h18a0 0 0 0 1 0 0 6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z" />
      <path d="M3 12h18" />
      {/* Steam */}
      <path d="M8 8c0-1.5 1-1.5 1-3M12 7.5c0-1.5 1-1.5 1-3M16 8c0-1.5 1-1.5 1-3" opacity="0.75" />
    </>
  );
}

function CoffeeCup() {
  // Classic coffee cup with saucer + steam — for coffee-festival
  return (
    <>
      {/* Cup */}
      <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
      {/* Handle */}
      <path d="M16 10h2a2 2 0 0 1 0 4h-2" />
      {/* Saucer */}
      <path d="M4 20h14" />
      {/* Steam */}
      <path d="M9 5c0-1 .6-1 .6-2M12 5c0-1 .6-1 .6-2" opacity="0.75" />
    </>
  );
}

function Candle() {
  // Candle with flame — for undas
  return (
    <>
      {/* Flame */}
      <path d="M12 3c1.6 1.5 2 3 2 4a2 2 0 0 1-4 0c0-1 .4-2.5 2-4z" />
      {/* Wick */}
      <path d="M12 9v1.5" />
      {/* Body */}
      <path d="M8.5 11h7v9h-7z" />
      {/* Base */}
      <path d="M7 20h10" />
    </>
  );
}

function CitySkyline() {
  // Three buildings with aerial — for lipa-foundation-day
  return (
    <>
      {/* Left */}
      <path d="M3 21v-8h5v8" />
      {/* Middle (tallest, with aerial) */}
      <path d="M10 21V7h4v14M12 7V4" />
      {/* Right */}
      <path d="M16 21v-6h5v6" />
      {/* Windows as dots */}
      <path d="M5 15v.5M6.5 15v.5M11.5 11v.5M12.5 11v.5M11.5 15v.5M12.5 15v.5M18 18v.5M19.5 18v.5" opacity="0.55" />
      {/* Ground */}
      <path d="M3 21h18" />
    </>
  );
}

function PineTree() {
  // Christmas pine with star topper — for pasko-sa-lipa
  return (
    <>
      {/* Star */}
      <path d="M12 3l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z" opacity="0.85" />
      {/* Three-tier pine */}
      <path d="M12 8l-3 4h6z" />
      <path d="M12 12l-4 4h8z" />
      <path d="M12 16l-5 4h10z" />
      {/* Trunk */}
      <path d="M11 20v1h2v-1" />
    </>
  );
}

function Factory() {
  // Industrial facility with smokestacks — for lima-industry-fair
  return (
    <>
      {/* Smokestacks */}
      <path d="M5 5v6M8 7v4" opacity="0.75" />
      {/* Main body (saw-tooth roof) */}
      <path d="M11 21V10l3 2V10l3 2V10l3 2v9z" />
      {/* Small window row */}
      <path d="M13 16h.5M15 16h.5M17 16h.5M19 16h.5" opacity="0.55" />
      {/* Ground */}
      <path d="M3 21h18" />
      {/* Chimney caps */}
      <path d="M4 5h2M7 7h2" />
    </>
  );
}

// Map event id → icon renderer. Falls back to a generic pin if unknown.
const ICONS: Record<string, () => React.ReactElement> = {
  "san-sebastian-fiesta":  Cathedral,
  "semana-santa":          Cross,
  "lomi-festival":         SteamBowl,
  "coffee-festival":       CoffeeCup,
  "undas":                 Candle,
  "lipa-foundation-day":   CitySkyline,
  "pasko-sa-lipa":         PineTree,
  "lima-industry-fair":    Factory,
};

function GenericPin() {
  return (
    <>
      <path d="M12 22s7-7 7-13a7 7 0 0 0-14 0c0 6 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  );
}

export default function EventIcon({ id, size = 24, className, style }: Props) {
  const Render = ICONS[id] || GenericPin;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
      {...strokeProps}
    >
      <Render />
    </svg>
  );
}
