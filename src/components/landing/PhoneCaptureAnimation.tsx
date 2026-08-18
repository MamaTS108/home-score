"use client";

import { useEffect, useState } from "react";
import { RoomIllustration } from "./RoomIllustration";

type Phase = "framing" | "flash" | "processing" | "result";

const DURATIONS: Record<Phase, number> = {
  framing: 2200,
  flash: 180,
  processing: 1500,
  result: 3200,
};

const ORDER: Phase[] = ["framing", "flash", "processing", "result"];

/**
 * Landing-page hero visual: a stylized phone frame cycling through
 * "cadrage -> capture -> analyse -> résultat" to show, at a glance, what the
 * product actually does (take a photo, get an AI renovation back).
 *
 * Built with SVG/CSS only — no hotlinked photos — so it ships with zero
 * external asset dependencies and no copyright risk. Swap `RoomIllustration`
 * for real (licensed) photography whenever that's ready.
 */
export function PhoneCaptureAnimation() {
  const [phase, setPhase] = useState<Phase>("framing");
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setReducedMotion(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const timeout = setTimeout(() => {
      const currentIndex = ORDER.indexOf(phase);
      const next = ORDER[(currentIndex + 1) % ORDER.length];
      setPhase(next);
    }, DURATIONS[phase]);

    return () => clearTimeout(timeout);
  }, [phase, reducedMotion]);

  const showAfter = phase === "processing" || phase === "result";
  const displayPhase = reducedMotion ? "result" : phase;

  return (
    <div className="relative mx-auto w-[240px] sm:w-[260px]">
      {/* soft ambient glow behind the phone */}
      <div
        className="absolute inset-0 -z-10 rounded-[3rem] blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle at 50% 30%, var(--accent-soft), transparent 70%)" }}
        aria-hidden
      />

      {/* phone frame */}
      <div className="relative rounded-[2.5rem] border-[6px] border-[#171717] bg-[#171717] shadow-[0_30px_60px_-15px_rgba(23,23,23,0.35)]">
        {/* notch */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-5 w-24 bg-[#171717] rounded-b-2xl z-20" />

        {/* screen */}
        <div className="relative aspect-[9/19] rounded-[2rem] overflow-hidden bg-background">
          <div className="absolute inset-0">
            <RoomIllustration variant={reducedMotion ? "after" : showAfter ? "after" : "before"} />
          </div>

          {/* viewfinder overlay while framing */}
          {displayPhase === "framing" && (
            <div className="absolute inset-0 animate-[fadeIn_0.3s_ease]">
              <div className="absolute inset-3 border border-white/70 rounded-2xl" />
              <Corner className="top-3 left-3" />
              <Corner className="top-3 right-3 rotate-90" />
              <Corner className="bottom-14 left-3 -rotate-90" />
              <Corner className="bottom-14 right-3 rotate-180" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="h-11 w-11 rounded-full border-4 border-white/90 bg-white/20 animate-pulse" />
              </div>
              <div className="absolute top-6 left-0 right-0 text-center">
                <span className="text-[10px] tracking-wide text-white/90 bg-black/30 rounded-full px-2.5 py-1">
                  Cadrez votre pièce
                </span>
              </div>
            </div>
          )}

          {/* flash */}
          {displayPhase === "flash" && <div className="absolute inset-0 bg-white animate-[flashPulse_0.18s_ease]" />}

          {/* processing overlay */}
          {displayPhase === "processing" && (
            <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.25s_ease]">
              <div className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span className="text-[11px] text-white font-medium">Analyse de votre pièce...</span>
            </div>
          )}

          {/* result badge */}
          {displayPhase === "result" && (
            <div className="absolute bottom-3 left-3 right-3 animate-[slideUp_0.4s_ease]">
              <div className="bg-surface/95 backdrop-blur rounded-xl px-3 py-2.5 shadow-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-foreground">Visualisation IA</span>
                  <span className="text-[11px] font-semibold text-accent">2 850 €</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">Salon moderne chaleureux</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <svg className={`absolute h-5 w-5 text-white/90 ${className}`} viewBox="0 0 20 20" fill="none">
      <path d="M2 8V2H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
