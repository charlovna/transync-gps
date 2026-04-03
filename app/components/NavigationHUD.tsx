"use client";

import type { RouteData, RiskBadge } from "../lib/types";

type Props = {
  routeData: RouteData | null;
  destination: string;
  riskBadge: RiskBadge;
  hudMinimized: boolean;
  onToggleHud: () => void;
  gyroEnabled: boolean;
  onGyroToggle: () => void;
  onRecenter: () => void;
  onEndTrip: () => void;
};

export default function NavigationHUD({
  routeData, destination, riskBadge,
  hudMinimized, onToggleHud,
  gyroEnabled, onGyroToggle,
  onRecenter, onEndTrip,
}: Props) {
  return (
    <>
      {/* ── Recenter FAB ── */}
      <button onClick={onRecenter} aria-label="Recenter" className="btn-tap"
        style={{ position: "fixed", right: 16, bottom: hudMinimized ? 96 : 228, zIndex: 40, borderRadius: 18, border: "1px solid rgba(56,189,248,0.25)", background: "rgba(2,6,23,0.92)", padding: "13px", backdropFilter: "blur(16px)", boxShadow: "0 8px 24px rgba(0,0,0,0.45), -2px -2px 6px rgba(255,255,255,0.05)", cursor: "pointer", transition: "bottom 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
      </button>

      {/* ── Gyro FAB ── */}
      <button onClick={onGyroToggle} aria-label="Toggle gyroscopic mode" className="btn-tap"
        style={{ position: "fixed", right: 76, bottom: hudMinimized ? 96 : 228, zIndex: 40, borderRadius: 18, border: gyroEnabled ? "1px solid rgba(34,211,238,0.4)" : "1px solid rgba(255,255,255,0.1)", background: gyroEnabled ? "rgba(6,182,212,0.18)" : "rgba(2,6,23,0.92)", padding: "13px", backdropFilter: "blur(16px)", boxShadow: "0 8px 24px rgba(0,0,0,0.45), -2px -2px 6px rgba(255,255,255,0.05)", cursor: "pointer", transition: "bottom 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={gyroEnabled ? "#22d3ee" : "#94a3b8"} strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>
        </svg>
      </button>

      {/* ── Bottom HUD ── */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30, borderRadius: "24px 24px 0 0", background: "rgba(2,6,23,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", backdropFilter: "blur(24px)", boxShadow: "0 -8px 48px rgba(0,0,0,0.55)", transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* drag handle */}
        <button onClick={onToggleHud} className="hud-handle-wrap">
          <div className="hud-handle" />
        </button>

        {!hudMinimized ? (
          <div style={{ padding: "4px 20px 36px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 2 }}>Navigating to</p>
                <p style={{ fontSize: 19, fontWeight: 700, color: "#f8fafc", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {routeData?.destination_label || destination}
                </p>
              </div>
              <span style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: riskBadge.bg, color: riskBadge.text }}>
                {routeData?.risk_level || "—"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div className="neu-extruded" style={{ borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(56,189,248,0.12)", background: "rgba(15,23,42,0.8)" }}>
                <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.13em" }}>ETA</p>
                <p className="font-orbitron" style={{ fontSize: 28, fontWeight: 800, color: "#38bdf8", lineHeight: 1.1, marginTop: 2, textShadow: "0 0 16px rgba(56,189,248,0.35)" }}>
                  {routeData?.eta_minutes ?? "—"}
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#7dd3fc", marginLeft: 3 }}>min</span>
                </p>
              </div>
              <div className="neu-extruded" style={{ borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,23,42,0.8)" }}>
                <p style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.13em" }}>Depart</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#a5f3fc", marginTop: 5, lineHeight: 1.3 }}>
                  {routeData?.recommended_departure_time || "Now"}
                </p>
              </div>
            </div>
            {routeData?.advisory_text && (
              <div style={{ borderRadius: 14, marginBottom: 14, border: "1px solid rgba(56,189,248,0.14)", background: "rgba(56,189,248,0.06)", padding: "10px 14px" }}>
                <p style={{ fontSize: 10, color: "#7dd3fc", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Advisory</p>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.55 }}>{routeData.advisory_text}</p>
              </div>
            )}
            <button onClick={onEndTrip} className="btn-tap"
              style={{ width: "100%", borderRadius: 18, padding: "16px", fontSize: 15, fontWeight: 700, color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
              End Trip
            </button>
          </div>
        ) : (
          <div style={{ padding: "4px 20px 28px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {routeData?.destination_label || destination}
              </p>
              <p className="font-orbitron" style={{ fontSize: 13, color: "#38bdf8", marginTop: 2 }}>
                {routeData?.eta_minutes ?? "—"} <span style={{ fontSize: 11, fontWeight: 400 }}>min</span>
                <span style={{ color: "#475569", marginLeft: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>· {routeData?.risk_level || "—"} traffic</span>
              </p>
            </div>
            <button onClick={onEndTrip} className="btn-tap"
              style={{ flexShrink: 0, borderRadius: 14, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
              End
            </button>
          </div>
        )}
      </div>
    </>
  );
}
