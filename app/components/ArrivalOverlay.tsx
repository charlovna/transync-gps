"use client";

import type { RouteData } from "../lib/types";

type Props = {
  routeData: RouteData | null;
  destination: string;
  tripDurationMinutes: number;
  arrivalAccuracy: number;
  arrivalRating: number;
  onSetRating: (r: number) => void;
  arrivalFeedback: string;
  onSetFeedback: (f: string) => void;
  feedbackSubmitted: boolean;
  onSubmitFeedback: () => void;
  onPlanNew: () => void;
  onDashboard: () => void;
};

export default function ArrivalOverlay({
  routeData, destination,
  tripDurationMinutes, arrivalAccuracy,
  arrivalRating, onSetRating,
  arrivalFeedback, onSetFeedback,
  feedbackSubmitted, onSubmitFeedback,
  onPlanNew, onDashboard,
}: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(2,6,23,0.97)", backdropFilter: "blur(24px)", overflowY: "auto", WebkitOverflowScrolling: "touch" as const, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16, animation: "fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1)" }}>

        {/* ── Checkmark ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingBottom: 8 }}>
          <div style={{ position: "relative", width: 88, height: 88 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06b6d4,#6366f1)", opacity: 0.18 }} />
            <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06b6d4,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,0.25)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 className="font-orbitron" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", background: "linear-gradient(90deg,#10b981,#06b6d4,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2 }}>
              Destination Reached!
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>You&apos;ve arrived at your destination</p>
          </div>
        </div>

        {/* ── Arrived at ── */}
        <div className="neu-extruded" style={{ borderRadius: 20, padding: "16px 18px", border: "1px solid rgba(34,211,238,0.2)", background: "linear-gradient(135deg,rgba(8,47,73,0.7),rgba(15,23,42,0.9))", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.13em", marginBottom: 3 }}>Arrived at</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {routeData?.destination_label || destination}
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="neu-extruded" style={{ borderRadius: 20, padding: "18px 16px", border: "1px solid rgba(56,189,248,0.15)", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(16px)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.13em", marginBottom: 4 }}>Duration</p>
            <p className="font-orbitron" style={{ fontSize: 30, fontWeight: 800, color: "#38bdf8", lineHeight: 1, textShadow: "0 0 16px rgba(56,189,248,0.35)" }}>
              {tripDurationMinutes}<span style={{ fontSize: 12, fontWeight: 500, color: "#7dd3fc", marginLeft: 3 }}>min</span>
            </p>
          </div>
          <div className="neu-extruded" style={{ borderRadius: 20, padding: "18px 16px", border: "1px solid rgba(16,185,129,0.15)", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(16px)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
            <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.13em", marginBottom: 4 }}>AI Accuracy</p>
            <p className="font-orbitron" style={{ fontSize: 30, fontWeight: 800, color: "#34d399", lineHeight: 1, textShadow: "0 0 16px rgba(52,211,153,0.3)" }}>
              {arrivalAccuracy}<span style={{ fontSize: 12, fontWeight: 500, color: "#6ee7b7", marginLeft: 2 }}>%</span>
            </p>
          </div>
        </div>

        {/* ── Rating ── */}
        <div style={{ borderRadius: 20, padding: "18px 18px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.7)", backdropFilter: "blur(16px)" }}>
          {!feedbackSubmitted ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(251,146,60,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>Rate Your Experience</p>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="star-btn" onClick={() => onSetRating(star)}>
                    <svg width="32" height="32" viewBox="0 0 24 24"
                      fill={star <= arrivalRating ? "#f59e0b" : "none"}
                      stroke={star <= arrivalRating ? "#f59e0b" : "#334155"} strokeWidth="1.8">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                ))}
              </div>
              <textarea
                value={arrivalFeedback}
                onChange={(e) => onSetFeedback(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                style={{ width: "100%", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.7)", color: "#cbd5e1", fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" as const, boxShadow: "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)" }}
              />
              <p style={{ fontSize: 11, color: "#334155", marginTop: 8, textAlign: "center" }}>This helps us improve our services for everyone!</p>
              <button onClick={onSubmitFeedback} disabled={arrivalRating === 0}
                style={{ width: "100%", marginTop: 12, borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 600, color: arrivalRating === 0 ? "#475569" : "#f8fafc", background: arrivalRating === 0 ? "rgba(71,85,105,0.3)" : "rgba(56,189,248,0.12)", border: arrivalRating === 0 ? "1px solid rgba(71,85,105,0.3)" : "1px solid rgba(56,189,248,0.25)", cursor: arrivalRating === 0 ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                Submit Feedback
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <p style={{ fontSize: 24, marginBottom: 6 }}>🙏</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#34d399" }}>Thank you for your feedback!</p>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Your rating helps Transync get better.</p>
            </div>
          )}
        </div>

        {/* ── CTA buttons ── */}
        <button onClick={onPlanNew} className="btn-gradient btn-tap"
          style={{ width: "100%", borderRadius: 18, padding: "17px", fontSize: 16, boxShadow: "0 8px 28px rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Plan New Route
        </button>
        <button onClick={onDashboard} className="btn-tap"
          style={{ width: "100%", borderRadius: 18, padding: "15px", fontSize: 15, fontWeight: 600, color: "#64748b", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Back to Dashboard
        </button>

      </div>
    </div>
  );
}
