"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import LoadingScreen from "../components/LoadingScreen";

export default function LoginPage() {
  const router = useRouter();

  const [showLoader, setShowLoader]         = useState(true);
  const [loginBgVisible, setLoginBgVisible] = useState(false); // CSS crossfade
  const [loginVisible, setLoginVisible]     = useState(false); // GSAP entrance gate

  const [username, setUsername]         = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── Refs for GSAP ────────────────────────────────────────────────────────
  const pageRef     = useRef<HTMLDivElement>(null);
  const topPillRef  = useRef<HTMLDivElement>(null);
  const logoRef     = useRef<HTMLDivElement>(null);
  const logoGlowRef = useRef<HTMLDivElement>(null);
  const cardRef     = useRef<HTMLDivElement>(null);
  const botPillRef  = useRef<HTMLDivElement>(null);
  const errorRef    = useRef<HTMLDivElement>(null);

  // Auth token check — redirect if already signed in
  useEffect(() => {
    const token =
      localStorage.getItem("transync_token") ||
      sessionStorage.getItem("transync_token");
    if (token) router.push("/");
  }, [router]);

  // ── Entrance timeline — Emil-Kowalski-style blur-in ──────────────────────
  // Core principles:
  //   • Blur + opacity + small translate is the "premium" recipe — no scale
  //     theatrics, no fighting overshoots.
  //   • xPercent:-50 on the pills lets GSAP own centering AND y in one matrix.
  //     The old code's `y:-10` silently stripped the CSS `translateX(-50%)`,
  //     which is why the pills snapped sideways as they animated.
  //   • expo.out (cubic-bezier 0.16,1,0.3,1) lands every element with a soft
  //     settle; one back.out(1.2) on the logo for a single deliberate accent.
  //   • Total duration ~0.95s — anything longer reads as sluggish on a login.
  useGSAP(() => {
    if (!loginVisible) return;

    const ctx = gsap.context(() => {
      // Initial states — synchronous, pre-paint. xPercent:-50 preserves
      // horizontal centering that CSS left:50% + translateX(-50%) used to own.
      gsap.set(topPillRef.current, {
        opacity: 0, xPercent: -50, y: -6, filter: "blur(8px)", force3D: true,
      });
      gsap.set(botPillRef.current, {
        opacity: 0, xPercent: -50, y: 8, filter: "blur(8px)", force3D: true,
      });
      gsap.set(logoRef.current, {
        opacity: 0, y: -10, scale: 0.96, filter: "blur(10px)", force3D: true,
      });
      gsap.set(logoGlowRef.current, { opacity: 0 });
      gsap.set(cardRef.current, {
        opacity: 0, y: 14, scale: 0.985, filter: "blur(12px)", force3D: true,
      });
      gsap.set("[data-field]", {
        opacity: 0, y: 6, filter: "blur(6px)", force3D: true,
      });

      const tl = gsap.timeline({
        defaults: { ease: "expo.out", force3D: true },
      });

      tl
        .to(topPillRef.current, {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55,
        }, 0)
        .to(logoRef.current, {
          opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
          duration: 0.7, ease: "back.out(1.2)",
        }, 0.06)
        .to(logoGlowRef.current, {
          opacity: 1, duration: 0.7, ease: "power2.out",
        }, 0.28)
        .to(cardRef.current, {
          opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
          duration: 0.6,
        }, 0.14)
        // Fields start as the card is ~60% through its translate — reads as
        // "the card's content materialising", not a separate step.
        .to("[data-field]", {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 0.5, stagger: 0.045,
        }, 0.3)
        .to(botPillRef.current, {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55,
        }, 0.32);

      // ── Ambient life — runs forever after entrance ─────────────────────
      // The page was dead after the entrance finished. Adding a gentle breath
      // on the logo glow gives it a heartbeat without being distracting.
      gsap.to(logoGlowRef.current, {
        opacity: 0.55,
        scale: 1.12,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: 1.0,  // wait until entrance is done
        transformOrigin: "center",
      });
    }, pageRef);

    return () => ctx.revert();
  }, { scope: pageRef, dependencies: [loginVisible] });

  // ── Error message pop-in — softer than before ───────────────────────────
  useGSAP(() => {
    if (!error || !errorRef.current) return;
    gsap.fromTo(
      errorRef.current,
      { opacity: 0, y: -6 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
    );
  }, { scope: pageRef, dependencies: [error] });

  // ── Form submit ──────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
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
      {/* LoadingScreen overlays at z-index 100, crossfades out at ~5.8s */}
      {showLoader && (
        <LoadingScreen
          onFading={() => setLoginBgVisible(true)}
          onComplete={() => { setShowLoader(false); setLoginVisible(true); }}
        />
      )}

      {/* Login page — CSS crossfade wrapper synced with loader fade-out.
          Kept short (0.9s) so the GSAP timeline owns the perceived entrance
          instead of two fades fighting each other. */}
      <div style={{
        opacity: loginBgVisible ? 1 : 0,
        transition: "opacity 0.9s ease-out",
        pointerEvents: loginVisible ? "auto" : "none",
        willChange: "opacity",
      }}>
        {/* GSAP scope root */}
        <div
          ref={pageRef}
          style={{
            position: "relative", width: "100%", height: "100dvh",
            overflow: "hidden", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            background: "#020617",
          }}
        >
          {/* ── Background atmosphere ── */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(6,182,212,0.13) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(99,102,241,0.1) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 50% 40% at 10% 90%, rgba(16,185,129,0.07) 0%, transparent 60%)" }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background:
              "linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px) 0 0 / 48px 48px," +
              "linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px) 0 0 / 48px 48px",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
          }} />

          {/* ── Top location pill ── */}
          <div
            ref={topPillRef}
            style={{
              position: "absolute", top: 20, left: "50%",
              // Translate via GSAP only. The left:50% + translateX(-50%) trick
              // breaks GSAP y-tweens, so we use a wrapper-less transform that
              // GSAP can own entirely (compensated by marginLeft).
              transform: "translate3d(-50%, 0, 0)",
              zIndex: 10,
              display: "flex", alignItems: "center", gap: 6, borderRadius: 99,
              border: "1px solid rgba(56,189,248,0.18)",
              background: "rgba(2,6,23,0.7)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)" as any,
              padding: "7px 16px", whiteSpace: "nowrap",
              opacity: 0,
              willChange: "transform, opacity",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>Lipa City, Batangas</span>
          </div>

          {/* ── Logo ── */}
          <div
            ref={logoRef}
            style={{
              position: "relative", zIndex: 20,
              display: "flex", flexDirection: "column", alignItems: "center",
              paddingBottom: 8,
              opacity: 0,
              willChange: "transform, opacity",
            }}
          >
            {/* Ambient glow */}
            <div
              ref={logoGlowRef}
              style={{
                position: "absolute", width: 120, height: 120, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(6,182,212,0.32) 0%, transparent 70%)",
                filter: "blur(20px)", transform: "translate3d(0,10px,0)",
                opacity: 0, willChange: "opacity",
                pointerEvents: "none",
              }}
            />
            {/* Icon box */}
            <div style={{
              width: 74, height: 74, borderRadius: 22,
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #6366f1 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow:
                "0 12px 40px rgba(6,182,212,0.38), 0 4px 12px rgba(0,0,0,0.4)," +
                "-4px -4px 8px rgba(255,255,255,0.05), 4px 4px 12px rgba(0,0,0,0.5)",
              position: "relative", zIndex: 1,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
          </div>

          {/* ── Login card ── */}
          <div
            ref={cardRef}
            style={{
              position: "relative", zIndex: 15, width: "100%", maxWidth: 400,
              margin: "0 16px",
              opacity: 0,
              willChange: "transform, opacity",
            }}
          >
            <div style={{
              borderRadius: 28,
              border: "1px solid rgba(56,189,248,0.12)",
              background: "rgba(15,23,42,0.9)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)" as any,
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset," +
                "-4px -4px 8px rgba(255,255,255,0.03), 4px 4px 16px rgba(0,0,0,0.6)",
              padding: "28px 26px 26px",
            }}>

              {/* Heading */}
              <div data-field style={{ marginBottom: 24, textAlign: "center", willChange: "transform, opacity" }}>
                <h2 style={{
                  fontSize: 24, fontWeight: 800, color: "#f8fafc",
                  letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2,
                  fontFamily: "'Orbitron', sans-serif",
                }}>Welcome back</h2>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 5, fontFamily: "'DM Sans', sans-serif" }}>
                  Smart traffic &amp; weather insights for Lipa City
                </p>
              </div>

              <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Username */}
                <div data-field style={{ willChange: "transform, opacity" }}>
                  <label htmlFor="login-username" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                    Username
                  </label>
                  <div style={inputWrapStyle("username")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input
                      id="login-username" type="text" value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your_username" autoComplete="username"
                      disabled={!loginVisible}
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div data-field style={{ willChange: "transform, opacity" }}>
                  <label htmlFor="login-email" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                    Email Address
                  </label>
                  <div style={inputWrapStyle("email")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      id="login-email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@example.com" autoComplete="email"
                      disabled={!loginVisible}
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div data-field style={{ willChange: "transform, opacity" }}>
                  <label htmlFor="login-password" style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                    Password
                  </label>
                  <div style={inputWrapStyle("password")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      id="login-password" type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••" autoComplete="current-password"
                      disabled={!loginVisible}
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 15, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                    >
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

                {/* Stay signed in */}
                <div data-field style={{ willChange: "transform, opacity" }}>
                  <button
                    type="button"
                    onClick={() => setStaySignedIn((prev) => !prev)}
                    disabled={!loginVisible}
                    style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: "2px 0", width: "fit-content" }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      border: staySignedIn ? "2px solid #06b6d4" : "2px solid rgba(255,255,255,0.2)",
                      background: staySignedIn ? "linear-gradient(135deg,#06b6d4,#6366f1)" : "rgba(2,6,23,0.6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "border-color 0.2s ease, background 0.2s ease",
                      boxShadow: staySignedIn
                        ? "0 0 8px rgba(6,182,212,0.4), -2px -2px 4px rgba(255,255,255,0.05), 2px 2px 6px rgba(0,0,0,0.5)"
                        : "-2px -2px 4px rgba(255,255,255,0.04), 2px 2px 6px rgba(0,0,0,0.5)",
                    }}>
                      {staySignedIn && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1", fontFamily: "'DM Sans', sans-serif" }}>
                      Stay Signed In
                    </span>
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div
                    ref={errorRef}
                    role="alert"
                    aria-live="assertive"
                    style={{
                      borderRadius: 12, padding: "10px 14px",
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: "rgba(127,29,29,0.35)",
                      fontSize: 13, color: "#fca5a5",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <div data-field style={{ willChange: "transform, opacity" }}>
                  <button
                    type="submit"
                    disabled={loading || !loginVisible}
                    className={!loading && loginVisible ? "btn-gradient" : ""}
                    style={{
                      width: "100%", marginTop: 4, borderRadius: 16, padding: "15px",
                      fontSize: 15, fontWeight: 700, color: "#fff",
                      background: loading ? "rgba(71,85,105,0.4)" : undefined,
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: loading ? "none" : undefined,
                      letterSpacing: "0.01em",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                </div>

                {/* Register link */}
                <div data-field style={{ textAlign: "center", willChange: "transform, opacity" }}>
                  <p style={{ fontSize: 13, color: "#475569", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    No account yet?{" "}
                    <a href="/register" style={{ color: "#38bdf8", fontWeight: 600, textDecoration: "none" }}>Create one</a>
                  </p>
                </div>

              </form>
            </div>
          </div>

          {/* ── Bottom status pill ── */}
          <div
            ref={botPillRef}
            style={{
              position: "absolute", bottom: 20, left: "50%",
              transform: "translate3d(-50%, 0, 0)",
              zIndex: 10,
              borderRadius: 99, border: "1px solid rgba(56,189,248,0.12)",
              background: "rgba(2,6,23,0.7)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)" as any,
              padding: "7px 18px", whiteSpace: "nowrap",
              opacity: 0,
              willChange: "transform, opacity",
            }}
          >
            <span style={{ fontSize: 11, color: "#475569", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
              Monitoring: De La Salle Lipa · BigBen · Barangays
            </span>
          </div>

        </div>{/* end pageRef */}
      </div>
    </>
  );
}
