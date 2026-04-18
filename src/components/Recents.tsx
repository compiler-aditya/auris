"use client";

import Link from "next/link";

/**
 * Home page recents chip strip.
 * For the hackathon demo we show curated sample chips; in a real build this
 * would fetch from /api/voices/recent.
 */
interface Chip {
  name: string;
  gradient: string;
  pair?: boolean;
}
const SAMPLE_CHIPS: Chip[] = [
  { name: "Houseplant", gradient: "radial-gradient(circle at 30% 40%, #7aa06a 0%, #2e4a2c 100%)" },
  { name: "Rajwada", gradient: "radial-gradient(circle at 30% 60%, #e8b678 0%, #7c3f1e 100%)" },
  { name: "Pigeon", gradient: "radial-gradient(circle at 40% 40%, #9ea09e 0%, #3d4440 100%)" },
  { name: "Coffee mug", gradient: "radial-gradient(circle at 50% 50%, #d8c4a8 0%, #7c5a3f 100%)" },
  { name: "◇ Threshold", gradient: "radial-gradient(circle at 50% 50%, #c44a2b 0%, #1a1a1a 100%)", pair: true },
];

export function Recents() {
  return (
    <div className="px-8 md:px-20 py-5 max-w-[1480px] mx-auto w-full border-t border-line flex justify-between items-center gap-6 flex-wrap">
      <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink3 flex items-center gap-2 shrink-0">
        · recent voices
      </div>
      <div className="flex gap-2.5 items-center flex-wrap">
        {SAMPLE_CHIPS.map((chip) => (
          <div
            key={chip.name}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-paper2 border border-line rounded-full"
          >
            <div
              className="w-[22px] h-[22px] rounded-full"
              style={{ background: chip.gradient }}
            />
            <span
              className="text-xs"
              style={{ color: chip.pair ? "var(--accent)" : "var(--ink-2)" }}
            >
              {chip.name}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/voices"
        className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink3 hover:text-ink transition"
      >
        view all →
      </Link>
    </div>
  );
}
