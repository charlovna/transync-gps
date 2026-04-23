"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { LocalEvent } from "../lib/types";
import EventIcon from "./EventIcon";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Long-press threshold — standard mobile platform convention is 500ms
// (iOS context menu fires at ~500, Android at ~500-700). 500 is the sweet
// spot: distinguishable from a tap but doesn't feel sluggish.
const LONG_PRESS_MS = 500;
// Cancel long-press if the pointer moves more than this many pixels (likely
// a scroll gesture on the horizontal carousel, not an intentional hold).
const LONG_PRESS_CANCEL_DISTANCE = 10;

// Category → accent color (cyan/amber/indigo/emerald/orange). Used for the
// icon tint and preview modal accent.
const getCategoryColor = (c: string): string =>
  ({
    fiesta:    "#38bdf8",
    festival:  "#22d3ee",
    religious: "#fbbf24",
    civic:     "#6366f1",
    cultural:  "#10b981",
    trade:     "#fb923c",
  } as Record<string, string>)[c] || "#94a3b8";

type Props = {
  events: LocalEvent[];
  nearest: LocalEvent | null;
  onEventSelect: (e: LocalEvent) => void;
};

// ── Category styling maps (per spec) ────────────────────────────────────────
const getCategoryAccent = (c: string): string =>
  ({
    fiesta:    "3px solid rgba(56,189,248,0.6)",
    festival:  "3px solid rgba(56,189,248,0.6)",
    religious: "3px solid rgba(251,191,36,0.6)",
    civic:     "3px solid rgba(99,102,241,0.6)",
    cultural:  "3px solid rgba(16,185,129,0.6)",
    trade:     "3px solid rgba(251,146,60,0.6)",
  } as Record<string, string>)[c] || "3px solid rgba(255,255,255,0.1)";

const getCategoryGradient = (c: string): string =>
  ({
    fiesta:    "linear-gradient(135deg,rgba(6,182,212,0.12),rgba(2,6,23,0.95))",
    festival:  "linear-gradient(135deg,rgba(6,182,212,0.10),rgba(2,6,23,0.95))",
    religious: "linear-gradient(135deg,rgba(251,191,36,0.10),rgba(2,6,23,0.95))",
    civic:     "linear-gradient(135deg,rgba(99,102,241,0.10),rgba(2,6,23,0.95))",
    cultural:  "linear-gradient(135deg,rgba(16,185,129,0.10),rgba(2,6,23,0.95))",
    trade:     "linear-gradient(135deg,rgba(251,146,60,0.10),rgba(2,6,23,0.95))",
  } as Record<string, string>)[c] || "rgba(15,23,42,0.95)";

export default function EventsCarousel({ events, nearest, onEventSelect }: Props) {
  // Hidden if no events loaded (per "fail silently" constraint)
  const [open, setOpen] = useState(false);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const bgRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const midRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const fgRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const scopeRef = useRef<HTMLDivElement>(null);

  // ── MOBILE-FIRST UX — Long-press TOGGLES in-place detail breakdown ─────
  // Old (removed): long-press → floating modal overlay with X button. On
  // Samsung S23+ / iPhone 14+ the X button was being overlapped by the event
  // pill at the top of the sheet — cramped header, bad thumb reach.
  // New: long-press expands the SAME carousel region into a detailed
  // breakdown in place. Long-press again returns to the scroll. No floating
  // X to overlap anything, close affordance is large and thumb-reachable,
  // and the gesture is symmetric (hold to open, hold to close).
  const [expandedEvent, setExpandedEvent] = useState<LocalEvent | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null); // visual feedback
  const pressTimer  = useRef<number | null>(null);
  const pressFired  = useRef(false);
  const pressStart  = useRef<{ x: number; y: number } | null>(null);
  const carouselLayerRef = useRef<HTMLDivElement>(null);
  const detailPanelRef   = useRef<HTMLDivElement>(null);

  const cancelPress = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressedId(null);
  };

  const closeExpanded = () => {
    // Explicit close runs the reverse GSAP animation, then clears the state
    // so the detail panel unmounts after its exit finishes. If the ref is
    // gone, fall back to instant clear.
    if (!detailPanelRef.current || !carouselLayerRef.current) {
      setExpandedEvent(null);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline({ onComplete: () => setExpandedEvent(null) });
    if (reduce) {
      tl.to(detailPanelRef.current, { opacity: 0, duration: 0.2 }, 0);
      tl.to(carouselLayerRef.current, { opacity: 1, duration: 0.2 }, 0);
    } else {
      tl.to(detailPanelRef.current, {
        opacity: 0, y: 10, scale: 0.98, filter: "blur(8px)",
        duration: 0.28, ease: "expo.in",
      }, 0);
      tl.to(carouselLayerRef.current, {
        opacity: 1, scale: 1, filter: "blur(0px)",
        duration: 0.45, ease: "expo.out",
      }, 0.08);
    }
  };

  // Pointer handlers — shared between cards and the detail panel so the
  // gesture is the same in both directions.
  const handlePointerDown = (e: React.PointerEvent, ev: LocalEvent, key: string) => {
    pressFired.current = false;
    pressStart.current = { x: e.clientX, y: e.clientY };
    setPressedId(key);
    pressTimer.current = window.setTimeout(() => {
      pressFired.current = true;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(18); } catch { /* non-fatal */ }
      }
      setPressedId(null);
      // Toggle: same event held again → close; otherwise open/switch.
      if (expandedEvent && expandedEvent.id === ev.id) {
        closeExpanded();
      } else {
        setExpandedEvent(ev);
      }
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pressStart.current || pressTimer.current === null) return;
    const dx = Math.abs(e.clientX - pressStart.current.x);
    const dy = Math.abs(e.clientY - pressStart.current.y);
    if (dx > LONG_PRESS_CANCEL_DISTANCE || dy > LONG_PRESS_CANCEL_DISTANCE) {
      cancelPress();
    }
  };

  const handleCardPointerUp = (ev: LocalEvent) => {
    const fired = pressFired.current;
    cancelPress();
    // Short tap on a CARD selects the destination (unchanged).
    // Short tap on the DETAIL PANEL does nothing — only long-press closes.
    if (!fired) onEventSelect(ev);
  };

  const handleDetailPointerUp = () => { cancelPress(); };
  const handlePointerCancel = () => { cancelPress(); };

  // Escape closes the expanded view (desktop / keyboard users).
  useEffect(() => {
    if (!expandedEvent) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeExpanded(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedEvent]);

  // ── GSAP: open animation ───────────────────────────────────────────────
  // Fires each time expandedEvent flips from null → a value. Carousel fades
  // out and blurs; detail panel slides up and sharpens in. Follows the
  // Emil-style entrance recipe from TRANSYNC_MASTER_SKILL §2 —
  // expo.out default, blur-in premium tell, translate 12–16px, no bounce.
  useGSAP(() => {
    if (!expandedEvent) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      gsap.set(carouselLayerRef.current, { opacity: 0 });
      gsap.set(detailPanelRef.current, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" });
      return;
    }
    gsap.to(carouselLayerRef.current, {
      opacity: 0, scale: 0.985, filter: "blur(8px)",
      duration: 0.3, ease: "expo.out",
    });
    gsap.fromTo(detailPanelRef.current,
      { opacity: 0, y: 14, scale: 0.985, filter: "blur(12px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
        duration: 0.5, ease: "expo.out", delay: 0.1 }
    );
  }, { dependencies: [expandedEvent ? expandedEvent.id : null] });

  // ── ScrollTrigger parallax per card ────────────────────────────────────
  // Each card's three layers scrub against page scroll when the card is in
  // viewport. bg slowest (-25), mid nearly-still (-5), fg leads forward (+8).
  // ScrollTrigger.refresh() fires on events data arrival and after resize.
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced-motion: no parallax, no scrub — just a static opacity fade-in
      // on the cards when they enter viewport.
      cardRefs.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 90%" } }
        );
      });
      ScrollTrigger.refresh();
      return;
    }

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      // Only parallax the first copy — duplicates (i >= events.length) are
      // there for the seamless CSS loop and shouldn't double-trigger.
      if (i >= events.length) return;

      const makeTrigger = (ref: HTMLDivElement | null, yPct: number) => {
        if (!ref) return;
        gsap.to(ref, {
          yPercent: yPct,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: true,  // scrub: true ONLY — never > 1 (motion-sickness risk)
            onEnter:       () => { ref.style.willChange = "transform"; },
            onLeave:       () => { ref.style.willChange = "auto"; },
            onEnterBack:   () => { ref.style.willChange = "transform"; },
            onLeaveBack:   () => { ref.style.willChange = "auto"; },
          },
        });
      };
      makeTrigger(bgRefs.current[i],  -25);
      makeTrigger(midRefs.current[i],  -5);
      makeTrigger(fgRefs.current[i],    8);

      // Entrance fade — fires once when card crosses 85% viewport
      gsap.fromTo(card,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "expo.out",
          scrollTrigger: { trigger: card, start: "top 85%" } }
      );
    });
    ScrollTrigger.refresh();
  }, { scope: scopeRef, dependencies: [events] });

  // ── Debounced refresh on resize (breakpoint / rotation) ────────────────
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, []);

  if (events.length === 0) return null;

  // Duplicate for seamless CSS loop. The track width must be 2× the visible
  // events so the @keyframes -50% translate lands exactly at the start of
  // the second copy. Refs only attach to the first copy.
  const trackEvents = [...events, ...events];

  return (
    <div
      ref={scopeRef}
      style={{ borderRadius: 24, padding: "18px 0 18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(2,6,23,0.88)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 16px 32px rgba(0,0,0,0.3)",
        overflow: "hidden",
        position: "relative" /* anchor for the absolute detail panel */ }}
    >
      {/* ── Carousel layer — fades / blurs out when detail panel opens ── */}
      <div ref={carouselLayerRef} style={{ willChange: "transform, opacity, filter" }}>
      {/* ── Section header + long-press hint ── */}
      <div style={{ margin: "0 20px 12px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, color: "#64748b",
          textTransform: "uppercase", letterSpacing: "0.2em",
          fontFamily: "'DM Sans', sans-serif",
          margin: 0,
        }}>
          Local Events · Lipa City
        </p>
        <p style={{
          fontSize: 9, fontWeight: 500, color: "#475569",
          textTransform: "uppercase", letterSpacing: "0.15em",
          fontFamily: "'DM Sans', sans-serif",
          margin: 0, whiteSpace: "nowrap",
        }}>
          Hold to expand
        </p>
      </div>

      {/* ── Horizontal track — scrolls forever; only pauses when a detail
              panel is open (is-paused class). No hover/touch pause. ── */}
      <div style={{ overflow: "hidden", width: "100%" }}>
        <div
          className={`carousel-track${expandedEvent ? " is-paused" : ""}`}
          // Seamless loop: padding-right = gap so total track width =
          // 2N·(W+G) and translateX(-50%) lands exactly on item #N+1.
          // Any other padding breaks the math and produces a visible jump.
          style={{ display: "flex", gap: 12, width: "max-content", paddingRight: 12 }}
        >
          {trackEvents.map((event, i) => {
            const pressKey = event.id + "-" + i;
            const isPressed = pressedId === pressKey;
            return (
            <article
              key={`${event.id}-${i}`}
              ref={(el) => { cardRefs.current[i] = el; }}
              data-index={i}
              onPointerDown={(e) => handlePointerDown(e, event, pressKey)}
              onPointerMove={handlePointerMove}
              onPointerUp={() => handleCardPointerUp(event)}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerCancel}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={`${event.name} — tap to select, long-press to expand detail`}
              style={{
                position: "relative", overflow: "hidden",
                width: 200, flexShrink: 0, height: 180,
                borderRadius: 20,
                boxShadow: isPressed
                  ? "-4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5), 0 0 0 2px " + getCategoryColor(event.category) + "55"
                  : "-4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderLeft: getCategoryAccent(event.category),
                cursor: "pointer",
                transition: "transform 0.18s ease, box-shadow 0.18s ease",
                transform: isPressed ? "scale(0.97)" : "scale(1)",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                touchAction: "pan-x", // lets parent carousel still scroll horizontally
              }}
            >
              {/* BG layer — speed -0.25 via ScrollTrigger yPercent -25 */}
              <div
                ref={(el) => { bgRefs.current[i] = el; }}
                style={{
                  position: "absolute", inset: 0,
                  willChange: "transform",
                  background: getCategoryGradient(event.category),
                }}
              />

              {/* MID layer — professional SVG icon replacing the emoji
                  placeholder. Large, translucent, sits behind the fg copy
                  for depth. Color keyed to the category palette. */}
              <div
                ref={(el) => { midRefs.current[i] = el; }}
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0.22,
                  color: getCategoryColor(event.category),
                  willChange: "transform",
                }}
              >
                <EventIcon id={event.id} size={88} />
              </div>

              {/* FG layer — speed +0.08, copy at bottom */}
              <div
                ref={(el) => { fgRefs.current[i] = el; }}
                style={{
                  position: "absolute", inset: 0,
                  padding: 14,
                  display: "flex", flexDirection: "column", justifyContent: "flex-end",
                  willChange: "transform",
                }}
              >
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 9, letterSpacing: "0.15em",
                  textTransform: "uppercase", color: "#64748b",
                  marginBottom: 4,
                }}>
                  // {event.category} — {event.location.split(",")[0]}
                </span>
                <h3 style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12, fontWeight: 700,
                  color: "#f8fafc", lineHeight: 1.3,
                  margin: "0 0 4px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {event.name}
                </h3>
                <span style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 10, fontWeight: 600, color: "#38bdf8",
                }}>
                  {event.date_display}
                </span>
                {event.traffic_impact === "high" && (
                  <span style={{
                    marginTop: 4, fontSize: 9, color: "#ef4444",
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                  }}>
                    ⚠ Heavy traffic expected
                  </span>
                )}
              </div>
            </article>
            );
          })}
        </div>
      </div>


      {/* ── Nearest event dropdown ── */}
      {nearest && (
        <div style={{ padding: "16px 20px 0" }}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="btn-tap"
            aria-expanded={open}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderRadius: 16, padding: "12px 14px",
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(56,189,248,0.2)",
              color: "#f1f5f9", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                color: getCategoryColor(nearest.category),
                background: getCategoryColor(nearest.category) + "18",
                border: "1px solid " + getCategoryColor(nearest.category) + "33",
              }}>
                <EventIcon id={nearest.id} size={16} />
              </span>
              <span style={{
                fontSize: 13, fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {nearest.name}
              </span>
            </span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#64748b" strokeWidth="2"
              style={{
                flexShrink: 0,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Expanded detail — height + opacity transition (spec) */}
          <div
            style={{
              display: "grid",
              gridTemplateRows: open ? "1fr" : "0fr",
              opacity: open ? 1 : 0,
              transition: "grid-template-rows 0.3s ease, opacity 0.3s ease",
            }}
          >
            <div style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 4px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                <h4 style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 16, fontWeight: 700, color: "#f8fafc",
                  margin: 0, lineHeight: 1.25,
                }}>
                  {nearest.name}
                </h4>
                <p style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 13, fontWeight: 600, color: "#38bdf8",
                  margin: 0,
                }}>
                  {nearest.date_display}
                  {nearest.days_away >= 0 && (
                    <span style={{ color: "#64748b", fontWeight: 400, marginLeft: 8 }}>
                      · in {nearest.days_away} day{nearest.days_away === 1 ? "" : "s"}
                    </span>
                  )}
                </p>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12, fontWeight: 400, color: "#64748b",
                  margin: 0,
                }}>
                  {nearest.location}
                </p>
                {nearest.traffic_impact === "high" && nearest.traffic_note && (
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11, fontWeight: 600, color: "#ef4444",
                    margin: 0, lineHeight: 1.4,
                  }}>
                    {nearest.traffic_note}
                  </p>
                )}
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, fontWeight: 400, color: "#94a3b8",
                  margin: "2px 0 4px", lineHeight: 1.5,
                }}>
                  {nearest.description}
                </p>
                <button
                  onClick={() => onEventSelect(nearest)}
                  className="btn-gradient btn-tap"
                  style={{
                    width: "100%", marginTop: 4,
                    borderRadius: 14, padding: "12px",
                    fontSize: 14, fontWeight: 700,
                  }}
                >
                  Get route to venue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>{/* end carouselLayerRef */}

      {/* ═══ IN-PLACE DETAIL PANEL — MOBILE-FIRST UX ═══════════════════════
          Long-press on a card → this panel fades in over the carousel.
          Long-press again (on the panel background) → collapses back.
          Short-tap on the CTA button triggers the route action.
          No floating X button to overlap anything — close affordances are
          (a) the large pill-shaped "Back" button at the bottom, (b) the X
          at the top (large 40×40 tap target, padded away from header text),
          (c) a long-press anywhere on the panel background. */}
      {expandedEvent && (
        <div
          ref={detailPanelRef}
          onPointerDown={(e) => handlePointerDown(e, expandedEvent, "detail-" + expandedEvent.id)}
          onPointerMove={handlePointerMove}
          onPointerUp={handleDetailPointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
          onContextMenu={(e) => e.preventDefault()}
          role="dialog"
          aria-modal="true"
          aria-label={`${expandedEvent.name} — detailed breakdown. Long-press or tap back to return.`}
          style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            padding: "18px 20px 18px",
            background: "rgba(2,6,23,0.96)",
            borderRadius: 24,
            borderLeft: "3px solid " + getCategoryColor(expandedEvent.category) + "99",
            opacity: 0,
            overflowY: "auto",
            // Mobile-first: disable native text-selection/callout during hold
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            touchAction: "pan-y", // allow vertical scroll of long descriptions
            fontFamily: "'DM Sans', sans-serif",
            willChange: "transform, opacity, filter",
          }}
        >
          {/* ── Header row: category + X close (X never overlaps text) ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 14, gap: 12,
          }}>
            <p style={{
              fontSize: 10, fontWeight: 600,
              color: getCategoryColor(expandedEvent.category),
              textTransform: "uppercase", letterSpacing: "0.2em",
              margin: 0, flex: 1, minWidth: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {expandedEvent.category}
            </p>
            {/* 40×40 tap target — exceeds 44px guideline when margin is
                counted. Sits in its own flex slot so no text can overlap it. */}
            <button
              onPointerDown={(e) => { e.stopPropagation(); }}
              onClick={(e) => { e.stopPropagation(); closeExpanded(); }}
              aria-label="Close detailed breakdown"
              style={{
                flexShrink: 0,
                width: 40, height: 40, borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(15,23,42,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#cbd5e1",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Icon tile + title ── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: getCategoryColor(expandedEvent.category),
              background:
                "linear-gradient(135deg, " + getCategoryColor(expandedEvent.category) + "22, rgba(2,6,23,0.6))",
              border: "1px solid " + getCategoryColor(expandedEvent.category) + "33",
              flexShrink: 0,
            }}>
              <EventIcon id={expandedEvent.id} size={28} />
            </div>
            <h3 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 18, fontWeight: 700, color: "#f8fafc",
              margin: "4px 0 0", lineHeight: 1.25, flex: 1, minWidth: 0,
            }}>
              {expandedEvent.name}
            </h3>
          </div>

          {/* ── Date + days away ── */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 14, fontWeight: 600, color: "#38bdf8",
            }}>
              {expandedEvent.date_display}
            </span>
            {expandedEvent.days_away >= 0 && (
              <span style={{ fontSize: 12, color: "#64748b" }}>
                · in {expandedEvent.days_away} day{expandedEvent.days_away === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* ── Location ── */}
          <p style={{
            fontSize: 12, color: "#94a3b8",
            margin: "0 0 12px", lineHeight: 1.45,
          }}>
            📍 {expandedEvent.location}
          </p>

          {/* ── Traffic warning (high impact only) ── */}
          {expandedEvent.traffic_impact === "high" && expandedEvent.traffic_note && (
            <div style={{
              marginBottom: 12, padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(239,68,68,0.28)",
              background: "rgba(127,29,29,0.22)",
            }}>
              <p style={{
                fontSize: 11, fontWeight: 600, color: "#fca5a5",
                margin: 0, lineHeight: 1.5,
              }}>
                {expandedEvent.traffic_note}
              </p>
            </div>
          )}

          {/* ── Description ── */}
          <p style={{
            fontSize: 13, color: "#cbd5e1",
            margin: "0 0 14px", lineHeight: 1.55,
          }}>
            {expandedEvent.description}
          </p>

          {/* ── CTA — stopPropagation so panel's long-press doesn't fire ── */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEventSelect(expandedEvent); closeExpanded(); }}
            className="btn-gradient btn-tap"
            style={{
              width: "100%", borderRadius: 14, padding: "13px",
              fontSize: 14, fontWeight: 700, marginTop: "auto",
            }}
          >
            Get route to venue →
          </button>

          {/* ── Hint: hold again to return ── */}
          <p style={{
            fontSize: 9, fontWeight: 500, color: "#475569",
            textTransform: "uppercase", letterSpacing: "0.15em",
            margin: "10px 0 0", textAlign: "center",
          }}>
            Hold to return to events
          </p>
        </div>
      )}
    </div>
  );
}
