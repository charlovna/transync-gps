"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "../components/LoadingScreen";

export default function LoginPage() {
  const router = useRouter();

  const [showLoader, setShowLoader] = useState(true);
  const [loginVisible, setLoginVisible] = useState(false);
  const [phase, setPhase] = useState(0);
  const [username, setUsername]         = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const token =
      localStorage.getItem("transync_token") ||
      sessionStorage.getItem("transync_token");
    if (token) { router.push("/"); return; }

    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 1050);
    const t3 = setTimeout(() => setPhase(3), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      if (!backendUrl) { setError("Missing NEXT_PUBLIC_BACKEND_API_URL"); return; }
      const res = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed. Please check your credentials."); return; }
      const store = staySignedIn ? localStorage : sessionStorage;
      store.setItem("transync_token", data.token);
      store.setItem("transync_user", JSON.stringify(data.user));
      router.push("/");
    } catch {
      setError("Unable to connect to Transync backend.");
    } finally {
      setLoading(false);
    }
  };

  const logoDropped  = phase >= 1;
  const cardVisible  = phase >= 2;
  const inputsActive = phase >= 3;

  const inputWrapStyle = (field: string): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10,
    borderRadius: 14, padding: "13px 14px",
    border: focusedField === field
      ? "1px solid rgba(56,189,248,0.6)"
      : "1px solid rgba(255,255,255,0.09)",
    background: "rgba(2,6,23,0.7)",
    boxShadow: focusedField === field
      ? "0 0 0 3px rgba(56,189,248,0.1), inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)"
      : "inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 8px rgba(0,0,0,0.5)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  });

  return (
    <>
      {/* LoadingScreen sits on top (z-index 100), fades out over 1.5s */}
      {/* onFading fires at t=6500ms → login fades in beneath */}
      {/* onComplete fires at t=8000ms → loader unmounts */}
      {showLoader && (
        <LoadingScreen
          onFading={() => setLoginVisible(true)}
          onComplete={() => setShowLoader(false)}
        />
      )}

      {/* Login page — rendered beneath loader, fades in during loader fadeout */}
      <div style={{
        opacity: loginVisible ? 1 : 0,
        transition: "opacity 1.5s ease",
        pointerEvents: loginVisible ? "auto" : "none",
      }}>
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
        opacity: cardVisible ? 1 : 0, transition: "opacity 0.6s ease",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>Lipa City, Batangas</span>
      </div>

      {/* Animated logo */}
      <div style={{
        position: "relative", zIndex: 20,
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: logoDropped ? "translateY(0px)" : "translateY(-80px)",
        opacity: logoDropped ? 1 : 0,
        transition: "transform 0.65s cubic-bezier(0.34,1.56,0.64,1), opacity 0.45s ease",
        paddingBottom: cardVisible ? 8 : 32,
      }}>
        <div style={{
          position: "absolute", width: 110, height: 110, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)",
          filter: "blur(18px)", transform: "translateY(8px)",
          opacity: logoDropped ? 1 : 0, transition: "opacity 0.8s ease 0.3s",
        }} />
        <div style={{
          width: logoDropped && cardVisible ? 68 : 78,
          height: logoDropped && cardVisible ? 68 : 78,
          borderRadius: logoDropped && cardVisible ? 20 : 24,
          background: "linear-gradient(135deg,#10b981 0%,#06b6d4 50%,#6366f1 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 40px rgba(6,182,212,0.4), 0 4px 12px rgba(0,0,0,0.4), -4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5)",
          transition: "width 0.5s ease, height 0.5s ease, border-radius 0.5s ease",
          position: "relative", zIndex: 1,
        }}>
          <svg width={logoDropped && cardVisible ? 32 : 38} height={logoDropped && cardVisible ? 32 : 38}
            viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "width 0.5s ease, height 0.5s ease" }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>

        {/* App name — shown only before card appears */}
        <div style={{
          marginTop: 16, opacity: cardVisible ? 0 : (logoDropped ? 1 : 0),
          transform: cardVisible ? "translateY(-6px)" : "translateY(0)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          textAlign: "center", pointerEvents: "none",
          position: cardVisible ? "absolute" : "relative",
        }}>
          <h1 style={{
            fontSize: 34, fontWeight: 800, color: "#f8fafc",
            letterSpacing: "-0.03em", lineHeight: 1, margin: 0,
            fontFamily: "'Orbitron', sans-serif",
          }}>TranSync</h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Smart commuter intelligence</p>
        </div>
      </div>

      {/* Login card */}
      <div style={{
        position: "relative", zIndex: 15, width: "100%", maxWidth: 400, margin: "0 16px",
        transform: cardVisible ? "translateY(0)" : "translateY(40px)",
        opacity: cardVisible ? 1 : 0,
        transition: "transform 0.65s cubic-bezier(0.34,1.2,0.64,1), opacity 0.55s ease",
      }}>
        <div style={{
          borderRadius: 28, border: "1px solid rgba(56,189,248,0.12)",
          background: "rgba(15,23,42,0.88)", backdropFilter: "blur(32px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset, -4px -4px 8px rgba(255,255,255,0.03), 4px 4px 16px rgba(0,0,0,0.6)",
          padding: "28px 26px 26px",
        }}>
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <h2 style={{
              fontSize: 24, fontWeight: 800, color: "#f8fafc",
              letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2,
              fontFamily: "'Orbitron', sans-serif",
            }}>Welcome back</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 5, fontFamily: "'DM Sans', sans-serif" }}>Smart traffic &amp; weather insights for Lipa City</p>
          </div>

          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Username */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Username</label>
              <div style={inputWrapStyle("username")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")} onBlur={() => setFocusedField(null)}
                  placeholder="your_username" autoComplete="username" disabled={!inputsActive}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", opacity: inputsActive ? 1 : 0.5 }} />
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
                  placeholder="you@example.com" autoComplete="email" disabled={!inputsActive}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", opacity: inputsActive ? 1 : 0.5 }} />
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
                  placeholder="••••••••" autoComplete="current-password" disabled={!inputsActive}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", opacity: inputsActive ? 1 : 0.5 }} />
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

            {/* Stay Signed In */}
            <button type="button" onClick={() => setStaySignedIn((prev) => !prev)} disabled={!inputsActive}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: inputsActive ? "pointer" : "default", padding: "2px 0", width: "fit-content", opacity: inputsActive ? 1 : 0.5 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                border: staySignedIn ? "2px solid #06b6d4" : "2px solid rgba(255,255,255,0.2)",
                background: staySignedIn ? "linear-gradient(135deg,#06b6d4,#6366f1)" : "rgba(2,6,23,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: staySignedIn
                  ? "0 0 8px rgba(6,182,212,0.4), -2px -2px 4px rgba(255,255,255,0.05), 2px 2px 6px rgba(0,0,0,0.5)"
                  : "-2px -2px 4px rgba(255,255,255,0.04), 2px 2px 6px rgba(0,0,0,0.5)",
              }}>
                {staySignedIn && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1", fontFamily: "'DM Sans', sans-serif" }}>Stay Signed In</span>
            </button>

            {error && (
              <div style={{ borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(127,29,29,0.35)", fontSize: 13, color: "#fca5a5", fontFamily: "'DM Sans', sans-serif" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !inputsActive}
              className={!loading && inputsActive ? "btn-gradient" : ""}
              style={{
                width: "100%", marginTop: 4, borderRadius: 16, padding: "15px",
                fontSize: 15, fontWeight: 700, color: "#fff",
                background: loading || !inputsActive ? "rgba(71,85,105,0.4)" : undefined,
                border: "none",
                cursor: loading || !inputsActive ? "not-allowed" : "pointer",
                boxShadow: loading || !inputsActive ? "none" : undefined,
                opacity: !inputsActive ? 0.5 : 1,
                letterSpacing: "0.01em",
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#475569", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              No account yet?{" "}
              <a href="/register" style={{ color: "#38bdf8", fontWeight: 600, textDecoration: "none" }}>Create one</a>
            </p>

            <p style={{ textAlign: "center", fontSize: 12, color: "#1e293b", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Powered by AI • Serving Lipa City
            </p>
          </form>
        </div>
      </div>

      {/* Bottom pill */}
      <div style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 10,
        borderRadius: 99, border: "1px solid rgba(56,189,248,0.12)", background: "rgba(2,6,23,0.7)",
        backdropFilter: "blur(12px)", padding: "7px 18px", whiteSpace: "nowrap",
        opacity: cardVisible ? 1 : 0, transition: "opacity 0.6s ease 0.3s",
      }}>
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>Monitoring: De La Salle Lipa • BigBen • Barangays</span>
      </div>
    </div>
    </div>
    </>
  );
}
