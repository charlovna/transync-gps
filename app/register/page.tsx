"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [phase, setPhase] = useState(0);
  const [username, setUsername]               = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState("");
  const [focusedField, setFocusedField]       = useState<string | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("transync_token") ||
      sessionStorage.getItem("transync_token");
    if (token) { router.push("/"); return; }

    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required."); return;
    }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      if (!backendUrl) { setError("Missing NEXT_PUBLIC_BACKEND_API_URL"); return; }
      const res = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed. Please try again."); return; }
      sessionStorage.setItem("transync_token", data.token);
      sessionStorage.setItem("transync_user", JSON.stringify(data.user));
      setSuccess("Account created! Redirecting...");
      setTimeout(() => router.push("/"), 1200);
    } catch {
      setError("Unable to connect to Transync backend.");
    } finally {
      setLoading(false);
    }
  };

  const cardVisible = phase >= 2;

  const inputWrapStyle = (field: string, errorBorder?: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10,
    borderRadius: 14, padding: "13px 14px",
    border: errorBorder
      ? "1px solid rgba(239,68,68,0.4)"
      : focusedField === field
      ? "1px solid rgba(56,189,248,0.6)"
      : "1px solid rgba(255,255,255,0.09)",
    background: "rgba(2,6,23,0.7)",
    boxShadow: focusedField === field
      ? "0 0 0 3px rgba(56,189,248,0.1), inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)"
      : "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  });

  return (
    <div style={{
      position: "relative", width: "100%", height: "100dvh",
      overflow: "hidden", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      background: "#020617",
    }}>
      {/* Radial gradients */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.13) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(99,102,241,0.1) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 50% 40% at 10% 90%, rgba(16,185,129,0.07) 0%, transparent 60%)" }} />

      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background:
          "linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px) 0 0 / 48px 48px," +
          "linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px) 0 0 / 48px 48px",
      }} />

      {/* Scanline overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
      }} />

      {/* Top pill */}
      <div style={{
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 10,
        display: "flex", alignItems: "center", gap: 6, borderRadius: 99,
        border: "1px solid rgba(56,189,248,0.18)", background: "rgba(2,6,23,0.7)",
        backdropFilter: "blur(12px)", padding: "7px 16px", whiteSpace: "nowrap",
        opacity: cardVisible ? 1 : 0, transition: "opacity 0.5s ease",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>Lipa City, Batangas</span>
      </div>

      {/* Logo */}
      <div style={{
        position: "relative", zIndex: 20, marginBottom: 16,
        transform: phase >= 1 ? "translateY(0)" : "translateY(-20px)",
        opacity: phase >= 1 ? 1 : 0,
        transition: "transform 0.5s ease, opacity 0.4s ease",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg,#10b981 0%,#06b6d4 50%,#6366f1 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 28px rgba(6,182,212,0.35), -4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5)",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
      </div>

      {/* Registration card */}
      <div style={{
        position: "relative", zIndex: 15,
        width: "100%", maxWidth: 400, margin: "0 16px",
        transform: cardVisible ? "translateY(0)" : "translateY(30px)",
        opacity: cardVisible ? 1 : 0,
        transition: "transform 0.55s cubic-bezier(0.34,1.2,0.64,1), opacity 0.45s ease",
        maxHeight: "calc(100dvh - 140px)", overflowY: "auto",
      }}>
        <div style={{
          borderRadius: 28, border: "1px solid rgba(56,189,248,0.12)",
          background: "rgba(15,23,42,0.88)", backdropFilter: "blur(32px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset, -4px -4px 8px rgba(255,255,255,0.03), 4px 4px 16px rgba(0,0,0,0.6)",
          padding: "28px 26px 26px",
        }}>
          <div style={{ marginBottom: 22, textAlign: "center" }}>
            <h2 style={{
              fontSize: 20, fontWeight: 800, color: "#f8fafc",
              letterSpacing: "-0.02em", margin: 0,
              fontFamily: "'Orbitron', sans-serif",
            }}>Create Account</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 5, fontFamily: "'DM Sans', sans-serif" }}>
              Join Transync — Lipa City commuter intelligence
            </p>
          </div>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Username */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Username</label>
              <div style={inputWrapStyle("username")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")} onBlur={() => setFocusedField(null)}
                  placeholder="your_username" autoComplete="username"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Email Address</label>
              <div style={inputWrapStyle("email")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com" autoComplete="email"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Password</label>
              <div style={inputWrapStyle("password")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                  placeholder="Min. 6 characters" autoComplete="new-password"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }} />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Confirm Password</label>
              <div style={inputWrapStyle("confirm", !!(confirmPassword && confirmPassword !== password))}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input type={showPassword ? "text" : "password"} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirm")} onBlur={() => setFocusedField(null)}
                  placeholder="Re-enter password" autoComplete="new-password"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }} />
                {confirmPassword.length > 0 && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: confirmPassword === password ? "#10b981" : "#ef4444" }} />
                )}
              </div>
            </div>

            {error && (
              <div style={{ borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(127,29,29,0.35)", fontSize: 13, color: "#fca5a5", fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(6,78,59,0.35)", fontSize: 13, color: "#6ee7b7", fontFamily: "'DM Sans', sans-serif" }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className={!loading ? "btn-gradient" : ""}
              style={{
                width: "100%", marginTop: 4, borderRadius: 16, padding: "15px",
                fontSize: 15, fontWeight: 700, color: "#fff",
                background: loading ? "rgba(71,85,105,0.4)" : undefined,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : undefined,
                opacity: loading ? 0.6 : 1,
                letterSpacing: "0.01em", fontFamily: "'DM Sans', sans-serif",
              }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#475569", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "#38bdf8", fontWeight: 600, textDecoration: "none" }}>Sign in</a>
            </p>
          </form>
        </div>
      </div>

      {/* Bottom pill */}
      <div style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 10,
        borderRadius: 99, border: "1px solid rgba(56,189,248,0.12)", background: "rgba(2,6,23,0.7)",
        backdropFilter: "blur(12px)", padding: "7px 18px", whiteSpace: "nowrap",
        opacity: cardVisible ? 1 : 0, transition: "opacity 0.5s ease 0.3s",
      }}>
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Monitoring: De La Salle Lipa • BigBen • Barangays</span>
      </div>
    </div>
  );
}
