"use client";

import { useEffect, useState } from "react";

type Props = {
  onFading: () => void;
  onComplete: () => void;
};

export default function LoadingScreen({ onFading, onComplete }: Props) {
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const [snapped, setSnapped] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setWordmarkVisible(true), 400);
    const t2 = setTimeout(() => setSnapped(true), 5500);
    const t3 = setTimeout(() => { setFading(true); onFading(); }, 6500);
    const t4 = setTimeout(() => onComplete(), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onFading, onComplete]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        /* ── Loading screen fade ── */
        .ls-root {
          position: fixed;
          inset: 0;
          z-index: 100;
          opacity: 1;
          transition: opacity 1.5s ease;
        }
        .ls-root.ls-fading {
          opacity: 0;
          pointer-events: none;
        }

        /* ── Needle chaos — slow, deliberate sweep ── */
        @keyframes needle-chaos {
          0%   { transform: rotate(0deg); }
          8%   { transform: rotate(127deg); }
          17%  { transform: rotate(43deg); }
          26%  { transform: rotate(251deg); }
          35%  { transform: rotate(88deg); }
          44%  { transform: rotate(310deg); }
          53%  { transform: rotate(155deg); }
          62%  { transform: rotate(67deg); }
          71%  { transform: rotate(290deg); }
          80%  { transform: rotate(112deg); }
          90%  { transform: rotate(205deg); }
          100% { transform: rotate(348deg); }
        }

        /* ── Cardinal pin wobbles ── */
        @keyframes pin-wobble-n {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25%     { transform: translateY(-4px) rotate(-12deg); }
          75%     { transform: translateY(2px) rotate(8deg); }
        }
        @keyframes pin-wobble-e {
          0%,100% { transform: translateX(0) rotate(0deg); }
          30%     { transform: translateX(3px) rotate(15deg); }
          70%     { transform: translateX(-2px) rotate(-9deg); }
        }
        @keyframes pin-wobble-s {
          0%,100% { transform: translateY(0) rotate(0deg); }
          40%     { transform: translateY(4px) rotate(10deg); }
          60%     { transform: translateY(-3px) rotate(-14deg); }
        }
        @keyframes pin-wobble-w {
          0%,100% { transform: translateX(0) rotate(0deg); }
          20%     { transform: translateX(-4px) rotate(-11deg); }
          80%     { transform: translateX(3px) rotate(13deg); }
        }

        /* ── Compass needle — 3s slow sweep ── */
        .ls-needle {
          transform-origin: 100px 100px;
          animation: needle-chaos 3s ease-in-out infinite;
        }
        .ls-needle.ls-snapped {
          transform: rotate(0deg) !important;
          animation: none !important;
          transition: transform 0.8s cubic-bezier(0.34,1.56,0.64,1);
        }

        /* ── Cardinal pins — slower wobbles ── */
        .ls-pin-n { animation: pin-wobble-n 1.8s ease-in-out infinite; }
        .ls-pin-e { animation: pin-wobble-e 1.4s ease-in-out infinite; }
        .ls-pin-s { animation: pin-wobble-s 2.2s ease-in-out infinite; }
        .ls-pin-w { animation: pin-wobble-w 1.6s ease-in-out infinite; }

        .ls-pin-n.ls-snapped,
        .ls-pin-e.ls-snapped,
        .ls-pin-s.ls-snapped,
        .ls-pin-w.ls-snapped {
          transform: translate(0,0) rotate(0deg) !important;
          animation: none !important;
          transition: transform 0.8s cubic-bezier(0.34,1.56,0.64,1);
        }

        /* ── N cardinal snaps to cyan ── */
        .ls-cardinal-n { fill: #94a3b8; transition: fill 0.5s ease; }
        .ls-cardinal-n.ls-snapped { fill: #38bdf8; }

        /* ── Wordmark fade-in ── */
        @keyframes wordmark-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ls-wordmark {
          opacity: 0;
        }
        .ls-wordmark.ls-visible {
          animation: wordmark-fadein 1s ease forwards;
        }

        /* ── Outer ring slow pulse ── */
        @keyframes ring-pulse {
          0%,100% { opacity: 0.22; }
          50%     { opacity: 0.45; }
        }
        .ls-ring-outer {
          animation: ring-pulse 3s ease-in-out infinite;
        }
        .ls-ring-outer.ls-snapped {
          animation: none;
          opacity: 0.55;
          transition: opacity 0.8s ease;
        }
      `}</style>

      {/* ── Root ── */}
      <div className={`ls-root${fading ? " ls-fading" : ""}`}>

        {/* ── Background layers (design skill §6) ── */}
        <div style={{ position: "absolute", inset: 0, background: "#020617" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.13) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(99,102,241,0.1) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 40% at 10% 90%, rgba(16,185,129,0.07) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)", pointerEvents: "none" }} />

        {/* ── Content ── */}
        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44 }}>

          {/* ── Compass SVG (design skill §9 exact coordinates) ── */}
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">

            {/* Outer ring with pulse */}
            <circle className={`ls-ring-outer${snapped ? " ls-snapped" : ""}`} cx="100" cy="100" r="85" stroke="#38bdf8" strokeWidth="1" />
            {/* Inner ring */}
            <circle cx="100" cy="100" r="65" stroke="rgba(56,189,248,0.1)" strokeWidth="1" />

            {/* Crosshair H */}
            <line x1="35" y1="100" x2="165" y2="100" stroke="rgba(56,189,248,0.14)" strokeWidth="0.5" />
            {/* Crosshair V */}
            <line x1="100" y1="35" x2="100" y2="165" stroke="rgba(56,189,248,0.14)" strokeWidth="0.5" />

            {/* Cardinal pins */}
            <circle className={`ls-pin-n${snapped ? " ls-snapped" : ""}`} cx="100" cy="15" r="4" fill="#38bdf8" />
            <circle className={`ls-pin-e${snapped ? " ls-snapped" : ""}`} cx="185" cy="100" r="3" fill="#94a3b8" />
            <circle className={`ls-pin-s${snapped ? " ls-snapped" : ""}`} cx="100" cy="185" r="3" fill="#94a3b8" />
            <circle className={`ls-pin-w${snapped ? " ls-snapped" : ""}`} cx="15" cy="100" r="3" fill="#94a3b8" />

            {/* Cardinal labels */}
            <text className={`ls-cardinal-n${snapped ? " ls-snapped" : ""}`} x="100" y="8" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fontFamily="'Syne', sans-serif">N</text>
            <text x="196" y="104" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="11" fontWeight="700" fontFamily="'Syne', sans-serif">E</text>
            <text x="100" y="198" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="11" fontWeight="700" fontFamily="'Syne', sans-serif">S</text>
            <text x="4" y="104" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="11" fontWeight="700" fontFamily="'Syne', sans-serif">W</text>

            {/* Needle */}
            <g className={`ls-needle${snapped ? " ls-snapped" : ""}`}>
              <path d="M 100,30 L 106,100 L 100,115 L 94,100 Z" fill="#38bdf8" />
              <path d="M 100,115 L 106,100 L 100,170 L 94,100 Z" fill="#334155" />
              <circle cx="100" cy="100" r="4" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
            </g>
          </svg>

          {/* ── Wordmark + tagline ── */}
          <div
            className={`ls-wordmark${wordmarkVisible ? " ls-visible" : ""}`}
            style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "0.35em", color: "#f8fafc", textTransform: "uppercase", margin: 0 }}>
              TRANSYNC
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: 13, color: "#64748b", letterSpacing: "0.05em", margin: 0 }}>
              Synced to your route
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
