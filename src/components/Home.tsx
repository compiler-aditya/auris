"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Listening } from "./Listening";
import { Recents } from "./Recents";

type Status = "idle" | "listening" | "error";

interface AnalyzeResponse {
  character?: {
    id: string;
    kind: "category" | "landmark" | "pairing";
  };
  error?: string;
}

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
      const res = await fetch("/api/photos/analyze", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (data.error || !data.character) {
        throw new Error(data.error ?? "no character returned");
      }
      if (data.character.kind === "pairing") {
        router.push(`/pair/${data.character.id}`);
      } else {
        router.push(`/character/${data.character.id}`);
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  if (status === "listening") {
    return <Listening />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* nav */}
      <nav className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-rust" />
          <span className="font-display italic text-2xl">Auris</span>
        </div>
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink3 flex gap-5">
          <span>voice-first</span>
          <span>listening</span>
        </div>
      </nav>

      {/* hero */}
      <main className="flex-1 px-8 md:px-20 py-12 grid md:grid-cols-[1.3fr_1fr] gap-8 md:gap-16 items-center max-w-[1480px] mx-auto w-full">
        <div>
          <div className="inline-flex items-center gap-2.5 mb-7 font-mono text-[11px] tracking-[0.2em] uppercase text-ink3">
            <span className="w-1.5 h-1.5 rounded-full bg-rust" />
            Auris · 28 characters · voice-first
          </div>
          <h1 className="font-display text-6xl md:text-[108px] leading-[0.92] tracking-[-0.035em] text-ink">
            Photograph anything. <em className="italic text-rust">Hear</em> what it has to say.
          </h1>
          <p className="mt-7 text-lg md:text-[19px] leading-[1.5] text-ink2 max-w-[440px]">
            Point your camera at a plant, a pigeon, a mug, a temple. Auris will listen, then speak back — in a voice of its own.
          </p>

          <div className="mt-10 flex items-center gap-5 flex-wrap">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-3.5 pl-[22px] pr-7 py-[18px] bg-ink text-paper rounded-full font-medium text-[15px] hover:opacity-90 transition"
            >
              <span className="w-[34px] h-[34px] rounded-full bg-rust flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              Take a photo
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-[22px] py-[18px] text-ink2 border border-line2 rounded-full text-sm hover:bg-paper2 transition"
            >
              Upload image
            </button>
          </div>

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
            <p className="mt-6 text-sm text-rust">Something didn&rsquo;t land: {lastError}</p>
          )}
        </div>

        {/* capture card — last voice */}
        <aside className="bg-paper2 border border-line rounded-[18px] p-7 w-full md:max-w-[420px]">
          <div
            className="rounded-[14px] overflow-hidden relative aspect-[4/5]"
            style={{
              background:
                "radial-gradient(120% 80% at 20% 10%, #f3e2d4 0%, #c7a997 40%, #6b4d3e 100%)",
            }}
          >
            <div className="absolute top-3.5 left-3.5 px-2.5 py-1.5 bg-black/65 backdrop-blur-sm text-white rounded-full font-mono text-[10px] tracking-[0.14em] uppercase">
              Last voice · 12 min ago
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div>
              <div className="font-display italic text-[22px] leading-none">Houseplant</div>
              <div className="text-xs text-ink3 mt-1">&ldquo;everything okay?&rdquo;</div>
            </div>
            <button className="px-4 py-2.5 text-ink2 border border-line2 rounded-full text-xs hover:bg-paper transition">
              Replay
            </button>
          </div>
        </aside>
      </main>

      {/* recents strip */}
      <Recents />

      {/* colophon */}
      <footer className="px-8 py-4 max-w-[1480px] mx-auto w-full border-t border-line mt-4 flex justify-between font-mono text-[11px] tracking-[0.18em] uppercase text-ink3">
        <span>Auris · built with Kiro + ElevenLabs · MIT</span>
        <span>v0.3 · apr 2026</span>
      </footer>
    </div>
  );
}
