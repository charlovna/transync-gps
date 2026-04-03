"use client";

import { useState } from "react";
import type { ProfileData } from "../lib/types";

type Props = {
  currentUsername: string;
  profileData: ProfileData | null;
  showChangePassword: boolean;
  onToggleChangePassword: () => void;
  cpCurrent: string; onCpCurrentChange: (v: string) => void;
  cpNew: string;     onCpNewChange: (v: string) => void;
  cpConfirm: string; onCpConfirmChange: (v: string) => void;
  cpError: string;
  cpSuccess: string;
  cpLoading: boolean;
  onChangePassword: () => void;
  onClose: () => void;
  onSignOut: () => void;
};

type PwField = "current" | "new" | "confirm";

export default function ProfileSheet({
  currentUsername, profileData,
  showChangePassword, onToggleChangePassword,
  cpCurrent, onCpCurrentChange,
  cpNew, onCpNewChange,
  cpConfirm, onCpConfirmChange,
  cpError, cpSuccess, cpLoading,
  onChangePassword, onClose, onSignOut,
}: Props) {
  const [focusedField, setFocusedField] = useState<PwField | null>(null);

  const pwInputStyle = (field: PwField): React.CSSProperties => ({
    width: "100%",
    borderRadius: 14,
    padding: "12px 14px",
    border: focusedField === field ? "1px solid rgba(56,189,248,0.6)" : "1px solid rgba(255,255,255,0.1)",
    background: "rgba(15,23,42,0.9)",
    color: "#f8fafc",
    fontSize: 15,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    boxShadow: focusedField === field
      ? "0 0 0 3px rgba(56,189,248,0.1), inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)"
      : "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  });

  const pwFields: [string, PwField, string, (v: string) => void][] = [
    ["Current Password", "current", cpCurrent, onCpCurrentChange],
    ["New Password",     "new",     cpNew,     onCpNewChange],
    ["Confirm New Password", "confirm", cpConfirm, onCpConfirmChange],
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#020617", overflowY: "auto", WebkitOverflowScrolling: "touch" as const, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ minHeight: "100%", paddingBottom: 40 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", padding: "56px 20px 20px", gap: 12 }}>
          <button onClick={onClose} className="btn-tap"
            style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f8fafc", flexShrink: 0, boxShadow: "-4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <h1 className="font-orbitron" style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.01em" }}>Profile</h1>
        </div>

        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Avatar + info ── */}
          <div style={{ borderRadius: 24, padding: "24px 20px", border: "1px solid rgba(34,211,238,0.15)", background: "linear-gradient(135deg,rgba(8,47,73,0.88),rgba(15,23,42,0.94),rgba(30,27,75,0.88))", backdropFilter: "blur(20px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="neu-extruded" style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#10b981,#06b6d4,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {currentUsername.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>{currentUsername}</p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{profileData?.email || "..."}</p>
                <p style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                  Member since {profileData?.created_at
                    ? new Date(profileData.created_at.replace(" ", "T") + "Z").toLocaleDateString("en-PH", { month: "long", year: "numeric" })
                    : "..."}
                </p>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="neu-extruded" style={{ borderRadius: 20, padding: "18px 16px", border: "1px solid rgba(56,189,248,0.15)", background: "rgba(15,23,42,0.7)", backdropFilter: "blur(16px)" }}>
              <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>Total Trips</p>
              <p className="font-orbitron" style={{ fontSize: 36, fontWeight: 800, color: "#38bdf8", lineHeight: 1, textShadow: "0 0 20px rgba(56,189,248,0.35)" }}>{profileData?.trip_count ?? "—"}</p>
            </div>
            <div className="neu-extruded" style={{ borderRadius: 20, padding: "18px 16px", border: "1px solid rgba(167,139,250,0.15)", background: "rgba(15,23,42,0.7)", backdropFilter: "blur(16px)" }}>
              <p style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>Searches</p>
              <p className="font-orbitron" style={{ fontSize: 36, fontWeight: 800, color: "#a78bfa", lineHeight: 1, textShadow: "0 0 20px rgba(167,139,250,0.3)" }}>{profileData?.search_count ?? "—"}</p>
            </div>
          </div>

          {/* ── Change password ── */}
          <div style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(2,6,23,0.88)", backdropFilter: "blur(20px)", overflow: "hidden" }}>
            <button onClick={onToggleChangePassword} className="btn-tap"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "transparent", border: "none", cursor: "pointer" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>Change Password</p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"
                style={{ transform: showChangePassword ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {showChangePassword && (
              <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {pwFields.map(([label, field, val, setter]) => (
                  <div key={field}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{label}</label>
                    <input
                      type="password"
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      onFocus={() => setFocusedField(field)}
                      onBlur={() => setFocusedField(null)}
                      style={pwInputStyle(field)}
                    />
                  </div>
                ))}
                {cpError   && <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(127,29,29,0.4)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 13, color: "#fca5a5" }}>{cpError}</div>}
                {cpSuccess && <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(6,78,59,0.4)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 13, color: "#6ee7b7" }}>{cpSuccess}</div>}
                <button onClick={onChangePassword} disabled={cpLoading}
                  className="btn-gradient"
                  style={{ borderRadius: 16, padding: "14px", fontSize: 15, width: "100%" }}>
                  {cpLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            )}
          </div>

          {/* ── Sign out ── */}
          <button onClick={onSignOut} className="btn-tap"
            style={{ width: "100%", borderRadius: 18, padding: "16px", fontSize: 15, fontWeight: 700, color: "#fca5a5", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
            Sign Out
          </button>

        </div>
      </div>
    </div>
  );
}
