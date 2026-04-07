"use client";

import type { RouteData, RiskBadge } from "../lib/types";

type Props = {
  routeData: RouteData;
  destination: string;
  riskBadge: RiskBadge;
  aiInsight: string;
  aiInsightLoading: boolean;
  gyroEnabled: boolean;
  onGyroToggle: () => void;
  onStartTrip: () => void;
  onBack: () => void;
  onSearchDifferent: () => void;
};

export default function AdvisoryPanel({
  routeData, destination, riskBadge,
  aiInsight, aiInsightLoading,
  gyroEnabled, onGyroToggle,
  onStartTrip, onBack, onSearchDifferent,
}: Props) {
  return (
    <div className="w-full max-w-[520px] mx-auto space-y-4">

      {/* ── Back nav row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} className="btn-tap"
          style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f8fafc", flexShrink: 0, boxShadow: "-4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.14em" }}>Route Advisory</p>
          <p className="font-orbitron" style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {routeData.destination_label || destination}
          </p>
        </div>
        <span style={{ padding: "5px 12px", borderRadius: 99, flexShrink: 0, fontSize: 12, fontWeight: 700, background: riskBadge.bg, color: riskBadge.text }}>
          {routeData.risk_level}
        </span>
      </div>

      {/* ── Multi-stop badge ── */}
      {routeData.waypoints && routeData.waypoints.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 16, padding: "10px 14px", border: "1px solid rgba(125,211,252,0.2)", background: "rgba(125,211,252,0.06)", backdropFilter: "blur(20px)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.13em" }}>
              Multi-Stop Route · {routeData.waypoints.length} stop{routeData.waypoints.length > 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {routeData.waypoints.map((wp) => wp.address.split(",")[0]).join(" → ")} → {(routeData.destination_label || "").split(",")[0]}
            </p>
          </div>
        </div>
      )}

      {/* ── ETA + Depart tiles ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="neu-extruded" style={{ borderRadius: 20, padding: "16px", border: "1px solid rgba(56,189,248,0.15)", background: "rgba(2,6,23,0.92)", backdropFilter: "blur(20px)" }}>
          <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.13em" }}>ETA</p>
          <p className="font-orbitron" style={{ fontSize: 36, fontWeight: 800, color: "#38bdf8", lineHeight: 1.1, marginTop: 4, textShadow: "0 0 20px rgba(56,189,248,0.4)" }}>
            {routeData.eta_minutes}
            <span style={{ fontSize: 13, fontWeight: 500, color: "#7dd3fc", marginLeft: 3 }}>min</span>
          </p>
        </div>
        <div className="neu-extruded" style={{ borderRadius: 20, padding: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.92)", backdropFilter: "blur(20px)" }}>
          <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.13em" }}>Depart</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#a5f3fc", marginTop: 6, lineHeight: 1.3 }}>
            {routeData.recommended_departure_time || "Now"}
          </p>
        </div>
      </div>

      {/* ── Advisory text ── */}
      {routeData.advisory_text && (
        <div style={{ borderRadius: 20, padding: "16px", border: "1px solid rgba(56,189,248,0.14)", background: "rgba(56,189,248,0.06)", backdropFilter: "blur(20px)" }}>
          <p style={{ fontSize: 10, color: "#7dd3fc", textTransform: "uppercase", letterSpacing: "0.13em", marginBottom: 6 }}>Advisory</p>
          <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.6 }}>{routeData.advisory_text}</p>
        </div>
      )}

      {/* ── Synced Insight (AI) ── */}
      {(aiInsightLoading || aiInsight) && (
        <div style={{ borderRadius: 20, padding: "16px", border: "1px solid rgba(99,102,241,0.28)", background: "linear-gradient(135deg,rgba(99,102,241,0.09),rgba(6,182,212,0.06))", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <span className="synced-star" style={{ fontSize: 13 }}>✦</span>
            <p style={{ fontSize: 10, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700 }}>Synced Insight</p>
            {aiInsightLoading && (
              <p style={{ fontSize: 10, color: "#6366f1", marginLeft: 2, animation: "ai-pulse 1.4s ease-in-out infinite" }}>thinking...</p>
            )}
          </div>
          <p style={{ fontSize: 14, color: "#c4b5fd", lineHeight: 1.7, margin: 0 }}>
            {aiInsight}
            {aiInsightLoading && (
              <span style={{ display: "inline-block", width: 2, height: "1em", background: "#818cf8", marginLeft: 3, verticalAlign: "text-bottom", borderRadius: 1, animation: "blink 0.9s ease-in-out infinite" }} />
            )}
          </p>
        </div>
      )}

      {/* ── Gyroscopic toggle ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 20, padding: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.92)", backdropFilter: "blur(20px)", boxShadow: "-4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5)" }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>Gyroscopic Mode</p>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Heading-based map tilt for mobile</p>
        </div>
        <button onClick={onGyroToggle}
          style={{ position: "relative", width: 52, height: 28, borderRadius: 99, border: "none", flexShrink: 0, background: gyroEnabled ? "#06b6d4" : "#334155", cursor: "pointer", transition: "background 0.2s", boxShadow: gyroEnabled ? "0 0 12px rgba(6,182,212,0.4)" : "none" }}>
          <span style={{ position: "absolute", top: 3, left: gyroEnabled ? 27 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </button>
      </div>

      {/* ── Start Trip ── */}
      <button onClick={onStartTrip} className="btn-gradient btn-tap"
        style={{ width: "100%", borderRadius: 18, padding: "17px", fontSize: 16, boxShadow: "0 8px 28px rgba(6,182,212,0.35)", letterSpacing: "0.01em" }}>
        Start Trip  →
      </button>

      {/* ── Search different ── */}
      <button onClick={onSearchDifferent}
        style={{ width: "100%", borderRadius: 14, padding: "10px 10px 24px", fontSize: 13, fontWeight: 500, color: "#64748b", background: "transparent", border: "none", cursor: "pointer" }}>
        Search a different destination
      </button>

    </div>
  );
}
