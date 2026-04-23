"use client";

import { forwardRef, useEffect, useState } from "react";
import type { LocalEvent } from "../lib/types";

// Non-interactive advisory preview for the login page.
// Purpose: give users a glimpse of upcoming local events + congestion hotspots
// before they sign in. Pills scroll horizontally forever (CSS only — uses the
// existing .carousel-track keyframe). pointerEvents:none so nothing is
// clickable — this is a "preview", not a control.
//
// Uses the event.icon emoji (not the EventIcon SVG) because a tight pill
// row benefits from the density / color of emoji glyphs, and this is
// deliberately lightweight visual texture.

type Props = {
  /** External opacity override (login entrance timeline owns the fade-in). */
  opacity?: number;
};

const LoginEventsPreview = forwardRef<HTMLDivElement, Props>(function LoginEventsPreview(
  { opacity = 1 },
  ref
) {
  const [events, setEvents] = useState<LocalEvent[]>([]);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!backendUrl) return;
    const ctrl = new AbortController();
    fetch(`${backendUrl}/events`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setEvents(data.events || []); })
      .catch(() => { /* silent — preview simply won't render */ });
    return () => ctrl.abort();
  }, []);

  if (events.length === 0) return null;

  // Duplicate for seamless CSS loop — the -50% translateX in the
  // carousel-scroll keyframe lands exactly at the start of the second copy.
  const tickerEvents = [...events, ...events];

  const formatDays = (d: number) => {
    if (d <= 0) return "Today";
    if (d === 1) return "Tomorrow";
    if (d < 14)  return `${d}d`;
    if (d < 60)  return `${Math.round(d / 7)}w`;
    return `${Math.round(d / 30)}mo`;
  };

  const truncate = (s: string, n: number) =>
    s.length <= n ? s : s.slice(0, n).trim() + "…";

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 62,            // sits above the bottom status pill (bottom:20)
        left: 0, right: 0,
        zIndex: 5,
        overflow: "hidden",
        pointerEvents: "none", // non-interactive per spec
        opacity,
        willChange: "opacity",
        // Soft fade at both edges so pills slide in/out instead of clipping
        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" as unknown as string,
      }}
    >
      <div
        className="carousel-track"
        // Seamless loop math: total width must = 2N·(W+G) so that
        // translateX(-50%) lands exactly on item #N+1 (= item #1's visual
        // position, since it's duplicated). With gap:G, that requires
        // padding-right = G and no other padding. The mask above handles
        // the left-edge fade, so no left padding is needed.
        style={{ display: "flex", gap: 8, width: "max-content", paddingRight: 8 }}
      >
        {tickerEvents.map((ev, i) => {
          const highImpact = ev.traffic_impact === "high";
          return (
            <div
              key={`${ev.id}-${i}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "6px 12px 6px 10px",
                borderRadius: 99,
                border: highImpact
                  ? "1px solid rgba(239,68,68,0.28)"
                  : "1px solid rgba(56,189,248,0.18)",
                background: "rgba(15,23,42,0.72)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)" as unknown as string,
                boxShadow:
                  "-2px -2px 4px rgba(255,255,255,0.03)," +
                  "2px 2px 6px rgba(0,0,0,0.45)",
                flexShrink: 0, whiteSpace: "nowrap",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {/* Emoji — the event's respective icon glyph */}
              <span style={{ fontSize: 14, lineHeight: 1 }}>{ev.icon}</span>
              {/* Name — truncated to keep the pill tight */}
              <span style={{
                fontSize: 11, fontWeight: 600, color: "#cbd5e1",
                letterSpacing: "0.01em",
              }}>
                {truncate(ev.name.split("—")[0].trim(), 22)}
              </span>
              {/* Separator dot */}
              <span style={{ fontSize: 10, color: "#475569", lineHeight: 1 }}>·</span>
              {/* Days-away — red for high-impact, cyan otherwise */}
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: highImpact ? "#fca5a5" : "#38bdf8",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}>
                {formatDays(ev.days_away)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default LoginEventsPreview;
