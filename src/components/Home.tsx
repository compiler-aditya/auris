"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Listening } from "./Listening";

type Status = "idle" | "listening" | "error";

interface AnalyzeResponse {
  character?: {
    id: string;
    kind: "category" | "landmark" | "pairing";
  };
  greeting_url?: string;
  ambient_url?: string | null;
  greeting_text?: string;
  error?: string;
}

const RECENT_CHIPS = [
  { name: "Houseplant", gradient: "radial-gradient(circle at 30% 40%, #7aa06a 0%, #2e4a2c 100%)" },
  { name: "Rajwada", gradient: "radial-gradient(circle at 30% 60%, #e8b678 0%, #7c3f1e 100%)" },
  { name: "Pigeon", gradient: "radial-gradient(circle at 40% 40%, #9ea09e 0%, #3d4440 100%)" },
  { name: "Coffee mug", gradient: "radial-gradient(circle at 50% 50%, #d8c4a8 0%, #7c5a3f 100%)" },
];

export function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    setLastError(null);
    setStatus("listening");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/photos/analyze", { method: "POST", body: fd });
      const data = (await res.json()) as AnalyzeResponse;
      if (data.error || !data.character) throw new Error(data.error ?? "no character");

      // Carry the ephemeral audio URLs + greeting forward so the destination
      // page can auto-play the encounter rather than sitting silent.
      const q = new URLSearchParams();
      if (data.greeting_url) q.set("g", data.greeting_url);
      if (data.ambient_url) q.set("a", data.ambient_url);
      if (data.greeting_text) q.set("t", data.greeting_text);
      const qs = q.toString() ? `?${q.toString()}` : "";

      const base = data.character.kind === "pairing" ? "/pair" : "/character";
      router.push(`${base}/${data.character.id}${qs}`);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  if (status === "listening") return <Listening />;

  return (
    <div className="min-h-[100svh] flex flex-col">
      {/* tiny nav */}
      <nav className="px-6 md:px-10 pt-6 md:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-rust" />
          <span className="font-display italic text-xl md:text-2xl">Auris</span>
        </div>
        <Link
          href="/voices"
          className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink3 hover:text-ink transition"
        >
          voices →
        </Link>
      </nav>

      {/* the one action */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl sm:text-6xl md:text-[96px] leading-[0.95] tracking-[-0.035em] text-ink">
          Photograph <em className="italic text-rust">anything.</em>
        </h1>
        <p className="mt-4 md:mt-5 text-sm md:text-base text-ink3">
          Hear what it has to say.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Take a photo"
          className="mt-14 md:mt-20 group w-[220px] h-[220px] md:w-[300px] md:h-[300px] rounded-full bg-ink text-paper flex items-center justify-center shadow-[0_30px_60px_-30px_rgba(26,26,26,0.45)] hover:scale-[1.015] active:scale-[0.99] transition-transform"
        >
          <span className="flex flex-col items-center gap-4 md:gap-5">
            <span className="w-20 h-20 md:w-[108px] md:h-[108px] rounded-full bg-rust flex items-center justify-center ring-1 ring-white/5 group-hover:scale-[1.03] transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-9 h-9 md:w-12 md:h-12"
                aria-hidden
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
            <span className="font-mono text-[11px] tracking-[0.24em] uppercase text-paper/80">
              Take a photo
            </span>
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {lastError && (
          <p className="mt-8 text-xs text-rust max-w-xs">{lastError}</p>
        )}
      </main>

      {/* quiet recents strip at the bottom */}
      <div className="px-6 md:px-10 pb-6 md:pb-8 flex justify-center gap-2 flex-wrap">
        {RECENT_CHIPS.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-paper2 border border-line rounded-full"
          >
            <span className="w-[18px] h-[18px] rounded-full" style={{ background: c.gradient }} />
            <span className="text-[11px] text-ink2">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
