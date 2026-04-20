"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { CustomBounce } from "gsap/CustomBounce";
import { CustomWiggle } from "gsap/CustomWiggle";
import { RoughEase, ExpoScaleEase, SlowMo } from "gsap/EasePack";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { EaselPlugin } from "gsap/EaselPlugin";
import { Flip } from "gsap/Flip";
import { GSDevTools } from "gsap/GSDevTools";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MotionPathHelper } from "gsap/MotionPathHelper";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Observer } from "gsap/Observer";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";
import { PixiPlugin } from "gsap/PixiPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(
  useGSAP, DrawSVGPlugin, ScrambleTextPlugin, TextPlugin, SplitText,
  CustomEase, CustomBounce, CustomWiggle, RoughEase, ExpoScaleEase, SlowMo,
  Draggable, EaselPlugin, Flip, GSDevTools, InertiaPlugin,
  MotionPathHelper, MotionPathPlugin, MorphSVGPlugin, Observer,
  Physics2DPlugin, PhysicsPropsPlugin, PixiPlugin,
  ScrollTrigger, ScrollSmoother, ScrollToPlugin,
);

type Props = {
  onFading: () => void;
  onComplete: () => void;
};

// 4-pointed sparkle star path centered at SVG origin
const SPARKLE_D = "M 0 -7 L 1.8 -1.8 L 7 0 L 1.8 1.8 L 0 7 L -1.8 1.8 L -7 0 L -1.8 -1.8 Z";

export default function LoadingScreen({ onFading, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Phase 1 — GPS Arrow
  const phase1Ref    = useRef<HTMLDivElement>(null);
  const needleRef    = useRef<SVGPathElement>(null);
  const needlePivot  = useRef<SVGCircleElement>(null);

  // Phase 2 — Globe (higher-fidelity: gradient fill, glow, 3 latitudes, 3 longitudes, highlight)
  const phase2WrapRef      = useRef<HTMLDivElement>(null);
  const globeRotateRef     = useRef<HTMLDivElement>(null);
  const globeGlowRef       = useRef<SVGCircleElement>(null);
  const globeFillRef       = useRef<SVGCircleElement>(null);
  const globeOuterRef      = useRef<SVGCircleElement>(null);
  const globeMeridianRef   = useRef<SVGEllipseElement>(null);
  const globeMeridianLRef  = useRef<SVGEllipseElement>(null);
  const globeMeridianRRef  = useRef<SVGEllipseElement>(null);
  const globeEquatorRef    = useRef<SVGEllipseElement>(null);
  const globeLatTopRef     = useRef<SVGEllipseElement>(null);
  const globeLatBotRef     = useRef<SVGEllipseElement>(null);
  const globeHighlightRef  = useRef<SVGEllipseElement>(null);

  // Phase 3 — Pin Drop
  const phase3WrapRef = useRef<HTMLDivElement>(null);
  const pinGroupRef   = useRef<SVGGElement>(null);
  const pinBodyRef    = useRef<SVGPathElement>(null);
  const pinHoleRef    = useRef<SVGCircleElement>(null);
  const pinGlowRef    = useRef<SVGCircleElement>(null);
  const rippleRef     = useRef<SVGEllipseElement>(null);
  // Beacon rings — continuous radar pings after pin lands
  const beacon1Ref    = useRef<SVGEllipseElement>(null);
  const beacon2Ref    = useRef<SVGEllipseElement>(null);
  const beacon3Ref    = useRef<SVGEllipseElement>(null);

  // Phase 4 — Sparkles
  const sparkleRefs = useRef<(SVGPathElement | null)[]>([]);

  // Wordmark
  const wordmarkRef     = useRef<HTMLDivElement>(null);
  const wordmarkTextRef = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // ── Phase 1: GPS Arrow (0–2s) ──────────────────────────────────────────
    // Initial state
    gsap.set(phase1Ref.current, { x: -380, opacity: 0 });
    gsap.set(needleRef.current,  { drawSVG: "0%", fillOpacity: 0 });
    gsap.set(needlePivot.current, { scale: 0, svgOrigin: "0 0" });

    tl
      // Slide in from left with spring
      .to(phase1Ref.current, { x: 0, opacity: 1, duration: 0.55, ease: "back.out(1.7)" }, 0)
      // Stroke traces the arrow outline
      .to(needleRef.current, { drawSVG: "100%", duration: 0.7, ease: "power2.inOut" }, 0.2)
      // Pivot dot springs in
      .to(needlePivot.current, { scale: 1, duration: 0.28, ease: "back.out(2.5)" }, 0.75)
      // Cyan fill floods inward
      .to(needleRef.current, { fillOpacity: 1, duration: 0.35, ease: "power1.inOut" }, 0.9)
      // Exit right
      .to(phase1Ref.current, { x: 380, opacity: 0, duration: 0.45, ease: "power2.in" }, 1.55);

    // Kill Phase 1 completely once it exits — prevents bleed-through on later fades.
    tl.set(phase1Ref.current, { visibility: "hidden" }, 2.05);

    // ── Phase 2: Globe (2–4.3s) — higher-fidelity build ───────────────────
    gsap.set(phase2WrapRef.current, { opacity: 0, scale: 0.82, visibility: "visible" });
    gsap.set([globeGlowRef.current, globeFillRef.current, globeHighlightRef.current], { opacity: 0 });
    gsap.set(
      [globeOuterRef.current, globeMeridianRef.current,
       globeMeridianLRef.current, globeMeridianRRef.current,
       globeEquatorRef.current, globeLatTopRef.current, globeLatBotRef.current],
      { drawSVG: "0%" }
    );

    tl
      // Glow blooms first — establishes depth before linework arrives
      .to(globeGlowRef.current, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.95)
      // Globe container fades in
      .to(phase2WrapRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, 2.0)
      // Radial-gradient fill materialises under the wires
      .to(globeFillRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" }, 2.05)
      // Silhouette → central meridian → flanking meridians → equator → latitudes
      .to(globeOuterRef.current,     { drawSVG: "100%", duration: 0.6,  ease: "power2.inOut" }, 2.08)
      .to(globeMeridianRef.current,  { drawSVG: "100%", duration: 0.45, ease: "power2.inOut" }, 2.42)
      .to(globeMeridianLRef.current, { drawSVG: "100%", duration: 0.4,  ease: "power2.inOut" }, 2.6)
      .to(globeMeridianRRef.current, { drawSVG: "100%", duration: 0.4,  ease: "power2.inOut" }, 2.68)
      .to(globeEquatorRef.current,   { drawSVG: "100%", duration: 0.32, ease: "power2.inOut" }, 2.85)
      .to(globeLatTopRef.current,    { drawSVG: "100%", duration: 0.28, ease: "power2.inOut" }, 3.0)
      .to(globeLatBotRef.current,    { drawSVG: "100%", duration: 0.28, ease: "power2.inOut" }, 3.08)
      // Specular highlight fades in just as spin starts
      .to(globeHighlightRef.current, { opacity: 0.55, duration: 0.45, ease: "power2.out" }, 3.1)
      // ── Pseudo-3D spin ──────────────────────────────────────────────────
      // rotationY on an SVG rasterizes poorly at edge angles (~90°/270°) —
      // the pixel area collapses and the browser dumbs down anti-aliasing.
      // Instead we animate each meridian's rx so the lines SWEEP through a
      // rotation cycle while the SVG stays in its native 2D raster space.
      // Three meridians offset by ~120° of phase → one is always front-facing.
      // A tiny 2D rotation adds motion cues without touching quality.
      .to(globeMeridianRef.current, {
        keyframes: { attr: [{ rx: 24 }, { rx: 4 }, { rx: 48 }, { rx: 24 }] },
        duration: 1.2,
        ease: "sine.inOut",
      }, 3.15)
      .to(globeMeridianLRef.current, {
        keyframes: { attr: [{ rx: 48 }, { rx: 24 }, { rx: 4 }, { rx: 48 }] },
        duration: 1.2,
        ease: "sine.inOut",
      }, 3.15)
      .to(globeMeridianRRef.current, {
        keyframes: { attr: [{ rx: 12 }, { rx: 48 }, { rx: 24 }, { rx: 12 }] },
        duration: 1.2,
        ease: "sine.inOut",
      }, 3.15)
      // Gentle 2D tilt — crisp at every frame
      .to(globeRotateRef.current, {
        rotation: 6,
        duration: 1.2,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      }, 3.15)
      // Highlight drifts to suggest a moving light source
      .to(globeHighlightRef.current, {
        attr: { cx: 14 },
        duration: 1.2,
        ease: "sine.inOut",
      }, 3.15)
      // Globe exits with slight scale-up fade
      .to(phase2WrapRef.current, { opacity: 0, scale: 1.1, duration: 0.32, ease: "power2.in" }, 4.0)
      // Hard-hide Phase 2 so it cannot bleed through Phase 3 or the final fade
      .set(phase2WrapRef.current, { visibility: "hidden" }, 4.35);

    // ── Wordmark — appears with globe, persists ───────────────────────────
    gsap.set(wordmarkRef.current, { opacity: 0, y: 10 });
    tl
      .to(wordmarkRef.current, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 2.0)
      .to(wordmarkTextRef.current, {
        duration: 1.1,
        scrambleText: {
          text: "TRANSYNC",
          chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%",
          speed: 0.45,
          revealDelay: 0.08,
        },
        ease: "none",
      }, 2.0);

    // ── Phase 3: Pin Drop (4.3–5.8s) ──────────────────────────────────────
    gsap.set(phase3WrapRef.current, { opacity: 0 });
    gsap.set(pinGroupRef.current, { y: -240 });
    gsap.set(pinBodyRef.current, { drawSVG: "0%", fillOpacity: 0 });
    gsap.set(pinHoleRef.current, { opacity: 0 });
    gsap.set(pinGlowRef.current, { opacity: 0, scale: 0.7, transformOrigin: "50% 58%" });
    gsap.set(rippleRef.current, { scale: 0, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set([beacon1Ref.current, beacon2Ref.current, beacon3Ref.current], {
      scale: 0, opacity: 0, transformOrigin: "50% 50%",
    });

    tl
      .to(phase3WrapRef.current, { opacity: 1, duration: 0.18 }, 4.28)
      // Pin falls with elastic bounce — ends with natural overshoot
      .to(pinGroupRef.current, { y: 0, duration: 0.88, ease: "elastic.out(1, 0.42)" }, 4.3)
      // Stroke draws as the pin descends
      .to(pinBodyRef.current, { drawSVG: "100%", duration: 0.58, ease: "power2.out" }, 4.3)
      // Impact ripple
      .to(rippleRef.current, { opacity: 0.75, duration: 0.04 }, 4.9)
      .to(rippleRef.current, { scale: 4.5, opacity: 0, duration: 0.82, ease: "power2.out" }, 4.9)
      // Fill floods into the pin body
      .to(pinBodyRef.current, { fillOpacity: 1, duration: 0.38, ease: "power1.inOut" }, 5.05)
      // Hole punches through the fill
      .to(pinHoleRef.current, { opacity: 1, duration: 0.22, ease: "power2.out" }, 5.25);

    // ── Pin LIFE — infinite loops that make the pin read as a live beacon ─
    // 1. Ambient glow behind pin body — fades in on impact, then breathes
    tl.to(pinGlowRef.current, {
      opacity: 0.75, scale: 1,
      svgOrigin: "0 -6",
      duration: 0.5, ease: "power2.out",
    }, 5.1);
    tl.to(pinGlowRef.current, {
      opacity: 0.38, scale: 0.9,
      svgOrigin: "0 -6",
      duration: 1.4, yoyo: true, repeat: -1, ease: "sine.inOut",
    }, 5.6);

    // 2. Radar ping rings — 3 staggered by 0.5s, 1.5s cycle. The "location
    //    beacon" feel seen in nav apps — instantly reads as "active pin".
    const pingDuration = 1.5;
    [beacon1Ref, beacon2Ref, beacon3Ref].forEach((ref, i) => {
      tl.fromTo(ref.current,
        { scale: 0.6, opacity: 0.7, svgOrigin: "0 58" },
        {
          scale: 4.2, opacity: 0,
          svgOrigin: "0 58",
          duration: pingDuration,
          repeat: -1,
          ease: "power2.out",
        },
        5.55 + i * 0.5
      );
    });

    // ── Phase 4: Sparkles (5.2s+) — orbit + twinkle + color pulse ─────────
    const ORIGIN_X = 0, ORIGIN_Y = -18, RADIUS = 72;
    // Each sparkle gets unique jitter so the ring doesn't look mechanical.
    const jitter = [0, 0.8, -0.4, 1.2, -0.7, 0.5, -1.1, 0.9];
    const sparkleColors = ["#a78bfa", "#c4b5fd", "#818cf8", "#60a5fa", "#a78bfa", "#c4b5fd", "#818cf8", "#6366f1"];

    sparkleRefs.current.forEach((el, i) => {
      if (!el) return;
      const angle = (i * 45 * Math.PI) / 180;
      const r = RADIUS + jitter[i] * 4;
      const endX = ORIGIN_X + r * Math.cos(angle);
      const endY = ORIGIN_Y + r * Math.sin(angle);

      gsap.set(el, {
        x: ORIGIN_X, y: ORIGIN_Y, scale: 0, opacity: 0,
        rotation: i * 17, transformOrigin: "center",
        fill: sparkleColors[i],
      });

      // 1. Burst outward with back.out overshoot. Last burst ends at ~5.89s,
      //    so every infinite loop below starts at 5.92 to avoid overwrite.
      tl.to(el, {
        x: endX, y: endY,
        scale: 1, opacity: 1,
        rotation: i * 17 + 180,
        duration: 0.42,
        ease: "back.out(2.4)",
      }, 5.2 + i * 0.038);

      const loopStart = 5.92;

      // 2. Continuous rotation — each sparkle spins at its own pace / direction.
      //    "+=" is relative, so it picks up from the burst's final rotation.
      tl.to(el, {
        rotation: `+=${i % 2 === 0 ? 720 : -720}`,
        duration: 7 + i * 0.5,
        repeat: -1,
        ease: "none",
      }, loopStart);

      // 3. Orbital drift — each sparkle slowly circles its final position.
      const orbitR = 4 + (i % 3);
      tl.to(el, {
        keyframes: {
          x: [endX, endX + orbitR, endX, endX - orbitR, endX],
          y: [endY, endY - orbitR, endY - orbitR * 2, endY - orbitR, endY],
        },
        duration: 3.2 + i * 0.3,
        repeat: -1,
        ease: "sine.inOut",
      }, loopStart);

      // 4. Twinkle — scale + opacity pulse with individual rhythm
      tl.to(el, {
        scale: 0.32 + (i % 3) * 0.14,
        opacity: 0.22,
        duration: 0.5 + i * 0.06,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      }, loopStart + i * 0.03);

      // 5. Color pulse — violet ↔ cyan on a lazy cycle (every other star)
      if (i % 2 === 0) {
        tl.to(el, {
          fill: "#22d3ee",
          duration: 1.8 + i * 0.15,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        }, loopStart + 0.1);
      }
    });

    // ── Exit: Phase 3 fades out BEFORE the root fade, so the pin + sparkles
    //         can't overlap with the login page logo during the crossfade. ───
    //         Gives sparkles ~0.58s of visible orbit/twinkle before exit.
    tl.to(phase3WrapRef.current, {
      opacity: 0,
      scale: 0.96,
      duration: 0.5,
      ease: "power2.in",
      transformOrigin: "50% 58%",
    }, 6.5);
    tl.set(phase3WrapRef.current, { visibility: "hidden" }, 7.0);

    // Wordmark fades independently so it doesn't ghost through the login
    tl.to(wordmarkRef.current, {
      opacity: 0, y: -6,
      duration: 0.5,
      ease: "power2.in",
    }, 6.55);

    // ── Fade out root + callbacks ──────────────────────────────────────────
    // By t=7.0 everything foreground is already hidden; the root fade now only
    // handles the background gradients + grid, which is cheap and clean.
    tl.call(onFading, [], 6.95);
    tl.to(rootRef.current, { opacity: 0, duration: 0.85, ease: "power1.inOut" }, 6.95);
    tl.call(onComplete, [], 7.85);

  }, { scope: rootRef, dependencies: [onFading, onComplete] });

  // ── Shared stage-phase style ───────────────────────────────────────────
  const phaseStyle: React.CSSProperties = {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <>
      <style>{`
        .ls-root {
          position: fixed;
          inset: 0;
          z-index: 100;
          will-change: opacity;
        }
      `}</style>

      <div className="ls-root" ref={rootRef}>

        {/* ── Background layers ── */}
        <div style={{ position: "absolute", inset: 0, background: "#020617" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.13) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(99,102,241,0.1) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 40% at 10% 90%, rgba(16,185,129,0.07) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)", pointerEvents: "none" }} />

        {/* ── Main content ── */}
        <div style={{
          position: "relative", zIndex: 1, height: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 48,
        }}>

          {/* ── Animation stage (all phases overlap here) ── */}
          <div style={{ position: "relative", width: 220, height: 220 }}>

            {/* Phase 1 — GPS Arrow */}
            <div ref={phase1Ref} style={phaseStyle}>
              <svg width="180" height="180" viewBox="-90 -90 180 180" fill="none" overflow="visible">
                {/* Targeting ring */}
                <circle cx="0" cy="-5" r="48" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />
                {/* Cross-hair ticks */}
                <line x1="-48" y1="-5" x2="-28" y2="-5" stroke="rgba(56,189,248,0.22)" strokeWidth="0.8" />
                <line x1="28"  y1="-5" x2="48"  y2="-5" stroke="rgba(56,189,248,0.22)" strokeWidth="0.8" />
                <line x1="0" y1="-53" x2="0" y2="-33" stroke="rgba(56,189,248,0.22)" strokeWidth="0.8" />
                <line x1="0" y1="23"  x2="0" y2="43"  stroke="rgba(56,189,248,0.22)" strokeWidth="0.8" />
                {/* Navigation arrow (drawn by DrawSVGPlugin, then fill floods in) */}
                <path
                  ref={needleRef}
                  d="M 0,-55 L 20,38 L 0,22 L -20,38 Z"
                  fill="#38bdf8"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                {/* Pivot dot */}
                <circle
                  ref={needlePivot}
                  cx="0" cy="0" r="5.5"
                  fill="#020617"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />
              </svg>
            </div>

            {/* Phase 2 — Globe (higher-fidelity build) */}
            <div ref={phase2WrapRef} style={phaseStyle}>
              <div ref={globeRotateRef} style={{ willChange: "transform", transformStyle: "preserve-3d" }}>
                <svg width="190" height="190" viewBox="-80 -80 160 160" fill="none" overflow="visible">
                  <defs>
                    {/* Sphere body — dark inner, cyan edge tint */}
                    <radialGradient id="globeFill" cx="38%" cy="34%" r="78%">
                      <stop offset="0%"   stopColor="rgba(56,189,248,0.38)" />
                      <stop offset="45%"  stopColor="rgba(14,116,144,0.22)" />
                      <stop offset="85%"  stopColor="rgba(2,6,23,0.85)" />
                      <stop offset="100%" stopColor="rgba(2,6,23,1)" />
                    </radialGradient>
                    {/* Outer ambient glow */}
                    <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="60%"  stopColor="rgba(56,189,248,0)" />
                      <stop offset="80%"  stopColor="rgba(56,189,248,0.18)" />
                      <stop offset="100%" stopColor="rgba(56,189,248,0)" />
                    </radialGradient>
                    {/* Specular highlight */}
                    <radialGradient id="globeHighlight" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
                      <stop offset="60%"  stopColor="rgba(255,255,255,0.08)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                  </defs>

                  {/* Outer glow — sits behind everything */}
                  <circle ref={globeGlowRef} cx="0" cy="0" r="78" fill="url(#globeGlow)" />

                  {/* Sphere fill */}
                  <circle ref={globeFillRef} cx="0" cy="0" r="60" fill="url(#globeFill)" />

                  {/* Outer silhouette */}
                  <circle
                    ref={globeOuterRef}
                    cx="0" cy="0" r="60"
                    stroke="#38bdf8" strokeWidth="1.8"
                    fill="none"
                  />

                  {/* Central meridian */}
                  <ellipse
                    ref={globeMeridianRef}
                    cx="0" cy="0" rx="24" ry="60"
                    stroke="#38bdf8" strokeWidth="1.4"
                  />
                  {/* Left meridian */}
                  <ellipse
                    ref={globeMeridianLRef}
                    cx="0" cy="0" rx="48" ry="60"
                    stroke="rgba(56,189,248,0.55)" strokeWidth="1"
                  />
                  {/* Right meridian (slimmer to suggest 3D) */}
                  <ellipse
                    ref={globeMeridianRRef}
                    cx="0" cy="0" rx="12" ry="60"
                    stroke="rgba(56,189,248,0.45)" strokeWidth="0.9"
                  />

                  {/* Equator */}
                  <ellipse
                    ref={globeEquatorRef}
                    cx="0" cy="0" rx="60" ry="18"
                    stroke="#38bdf8" strokeWidth="1.4"
                  />
                  {/* Upper latitude */}
                  <ellipse
                    ref={globeLatTopRef}
                    cx="0" cy="-26" rx="54" ry="11"
                    stroke="rgba(56,189,248,0.6)" strokeWidth="0.9"
                  />
                  {/* Lower latitude */}
                  <ellipse
                    ref={globeLatBotRef}
                    cx="0" cy="26" rx="54" ry="11"
                    stroke="rgba(56,189,248,0.6)" strokeWidth="0.9"
                  />

                  {/* Specular highlight — drifts during spin for "moving light" */}
                  <ellipse
                    ref={globeHighlightRef}
                    cx="-18" cy="-22" rx="26" ry="18"
                    fill="url(#globeHighlight)"
                    opacity="0"
                  />
                </svg>
              </div>
            </div>

            {/* Phase 3 — Pin Drop + Phase 4 Sparkles */}
            <div ref={phase3WrapRef} style={phaseStyle}>
              <svg
                width="240" height="240"
                viewBox="-120 -100 240 210"
                fill="none"
                overflow="visible"
                style={{ overflow: "visible" }}
              >
                <defs>
                  {/* Pin ambient glow — cyan radial bleed beneath the pin */}
                  <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="rgba(56,189,248,0.55)" />
                    <stop offset="40%"  stopColor="rgba(56,189,248,0.22)" />
                    <stop offset="100%" stopColor="rgba(56,189,248,0)" />
                  </radialGradient>
                </defs>

                {/* Ambient glow behind pin — breathes during beacon phase */}
                <circle
                  ref={pinGlowRef}
                  cx="0" cy="-6" r="56"
                  fill="url(#pinGlow)"
                />

                {/* Radar ping rings — 3 staggered pings radiating from pin tip */}
                <ellipse
                  ref={beacon1Ref}
                  cx="0" cy="58"
                  rx="22" ry="6.5"
                  stroke="#38bdf8" strokeWidth="1.6"
                  fill="none"
                />
                <ellipse
                  ref={beacon2Ref}
                  cx="0" cy="58"
                  rx="22" ry="6.5"
                  stroke="rgba(56,189,248,0.85)" strokeWidth="1.4"
                  fill="none"
                />
                <ellipse
                  ref={beacon3Ref}
                  cx="0" cy="58"
                  rx="22" ry="6.5"
                  stroke="rgba(56,189,248,0.7)" strokeWidth="1.2"
                  fill="none"
                />

                {/* Impact ripple (one-shot on landing) */}
                <ellipse
                  ref={rippleRef}
                  cx="0" cy="58"
                  rx="24" ry="7"
                  stroke="#38bdf8" strokeWidth="2"
                  fill="none"
                />

                {/* Pin group — animated as unit for the fall */}
                <g ref={pinGroupRef}>
                  {/* Pin teardrop body */}
                  <path
                    ref={pinBodyRef}
                    d="M 0,-55 C 30,-55 46,-34 46,-14 C 46,12 26,34 0,58 C -26,34 -46,12 -46,-14 C -46,-34 -30,-55 0,-55 Z"
                    fill="#38bdf8"
                    stroke="#38bdf8"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                  {/* Punch-through circle hole */}
                  <circle
                    ref={pinHoleRef}
                    cx="0" cy="-18" r="14"
                    fill="#020617"
                  />
                </g>

                {/* 8 AI sparkle stars — GSAP sets x/y from ORIGIN_X/Y */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <path
                    key={i}
                    ref={(el) => { sparkleRefs.current[i] = el; }}
                    d={SPARKLE_D}
                    fill="#a78bfa"
                    stroke="rgba(167,139,250,0.5)"
                    strokeWidth="0.5"
                  />
                ))}
              </svg>
            </div>

          </div>{/* end stage */}

          {/* ── Wordmark ── */}
          <div
            ref={wordmarkRef}
            style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            <p
              ref={wordmarkTextRef}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800, fontSize: 18,
                letterSpacing: "0.35em",
                color: "#f8fafc",
                textTransform: "uppercase",
                margin: 0,
                // Hold layout space so ScrambleText doesn't collapse it
                minWidth: "11ch",
              }}
            >
              TRANSYNC
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400, fontSize: 13,
              color: "#64748b",
              letterSpacing: "0.05em",
              margin: 0,
            }}>
              Synced to your route
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
