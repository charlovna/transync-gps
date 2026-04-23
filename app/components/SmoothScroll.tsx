"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // ── Lenis ↔ ScrollTrigger sync ─────────────────────────────────────────
    // Both lines below are required — removing either causes parallax jitter.
    // (1) Every Lenis scroll update notifies ScrollTrigger so its markers and
    //     scrub tweens tick on the SAME frame as Lenis' smoothed scrollTop.
    // (2) GSAP's ticker drives Lenis' raf — unifies clocks so there are no
    //     double-RAF races between GSAP and Lenis.
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
