"use client";

import { useEffect, useState } from "react";

/**
 * Full-bleed "Listening" takeover shown during the ~3s analyze round-trip.
 * Per the wireframe: dim photo backdrop, scrim, soft film grain, a pulsing
 * centered ring with an accent core, mono kicker, and one serif line.
 */
export function Listening() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, []);

  const bars = Array.from({ length: 28 }, (_, i) =>
    4 + Math.abs(Math.sin(i * 0.7 + tick * 0.1) * 22),
  );

  return (
    <div className="fixed inset-0 overflow-hidden text-[#f5efe0]" style={{ background: "#0e0d0b" }}>
      {/* photo backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 55% 45%, #5a6e52 0%, #2d3a2a 50%, #0e0d0b 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,13,11,0.4) 0%, rgba(14,13,11,0.1) 40%, rgba(14,13,11,0.8) 100%)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none grain" />

      {/* top bar */}
      <div className="absolute top-7 left-8 right-8 flex justify-between items-center font-mono text-[10px] tracking-[0.22em] uppercase text-[#f5efe0]/55">
        <div className="flex items-center gap-2">
          <span className="w-[7px] h-[7px] rounded-full bg-rust animate-pulse-dot" />
          Auris is listening
        </div>
        <div>01 · Identifying</div>
      </div>

      {/* center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-16 text-center">
        <div className="relative w-[120px] h-[120px] rounded-full border border-[#f5efe0]/25 mb-9">
          <div
            className="absolute rounded-full border border-[#f5efe0]/15"
            style={{ inset: "-24px" }}
          />
          <div
            className="absolute rounded-full border border-[#f5efe0]/10"
            style={{ inset: "-54px" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-14 h-14 rounded-full bg-rust animate-pulse-dot"
            style={{
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 40px rgba(196, 74, 43, 0.6)",
            }}
          />
        </div>
        <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-[#f5efe0]/60 mb-3.5">
          Noticing
        </div>
        <div className="font-display italic text-4xl md:text-[52px] leading-[1.1] tracking-[-0.015em] text-[#f5efe0] max-w-[720px]">
          light from a window, the curve of a leaf, a word forming&hellip;
        </div>
      </div>

      {/* bottom */}
      <div className="absolute bottom-7 left-8 right-8 flex justify-between items-center text-[#f5efe0]/50 font-mono text-[10px] tracking-[0.2em] uppercase">
        <div className="flex items-center gap-2">
          <div
            className="w-11 h-14 rounded-md border"
            style={{
              background: "linear-gradient(135deg, #445a3c 0%, #1f2a1a 100%)",
              borderColor: "rgba(245, 239, 224, 0.15)",
            }}
          />
          <span>your photo</span>
        </div>
        <div className="flex gap-[3px] items-center">
          {bars.map((h, i) => (
            <span key={i} className="wavebar" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div>~3 seconds</div>
      </div>
    </div>
  );
}
