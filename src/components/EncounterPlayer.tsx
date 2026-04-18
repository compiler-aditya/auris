"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Signed URL for the greeting mp3. Auto-played on mount when present. */
  greetingUrl?: string | null;
  /** Signed URL for the ambient bed. Loops at low volume while visible. */
  ambientUrl?: string | null;
  /** The spoken line — surfaced when playback is blocked (eg iOS autoplay rules). */
  greetingText?: string;
  /** Visual tone for the Replay button. */
  tone?: "dark" | "light";
}

type PlayState = "idle" | "playing" | "ended" | "blocked";

/**
 * Renders audio for the just-met character.
 * - Autoplay attempt on mount; if the browser blocks, shows a "Tap to listen"
 *   affordance (mobile browsers refuse autoplay without a gesture).
 * - Ambient bed loops at 25% volume underneath.
 * - Replay button re-triggers the greeting.
 */
export function EncounterPlayer({
  greetingUrl,
  ambientUrl,
  greetingText,
  tone = "dark",
}: Props) {
  const greetingRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayState>("idle");
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = 0.25;
      ambientRef.current.loop = true;
      void ambientRef.current.play().catch(() => {
        /* autoplay blocked is fine for ambient */
      });
    }
  }, [ambientUrl]);

  useEffect(() => {
    const el = greetingRef.current;
    if (!el || !greetingUrl) return;
    el.currentTime = 0;
    el.volume = 1;
    void el
      .play()
      .then(() => setState("playing"))
      .catch(() => setState("blocked"));
  }, [greetingUrl]);

  function replay() {
    const el = greetingRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el
      .play()
      .then(() => setState("playing"))
      .catch(() => setState("blocked"));
  }

  function toggleAmbient() {
    const el = ambientRef.current;
    if (!el) return;
    if (muted) {
      el.volume = 0.25;
      setMuted(false);
    } else {
      el.volume = 0;
      setMuted(true);
    }
  }

  if (!greetingUrl && !ambientUrl) return null;

  const buttonTone =
    tone === "light"
      ? "bg-[#f2e8d3]/10 text-[#f2e8d3] border-[#f2e8d3]/30 hover:bg-[#f2e8d3]/20"
      : "bg-paper2 text-ink2 border-line2 hover:bg-paper";

  return (
    <div className="flex flex-col gap-3">
      {greetingUrl && (
        <audio
          ref={greetingRef}
          src={greetingUrl}
          preload="auto"
          onEnded={() => setState("ended")}
        />
      )}
      {ambientUrl && (
        <audio ref={ambientRef} src={ambientUrl} preload="auto" />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={replay}
          className={
            "inline-flex items-center gap-2.5 px-5 py-3 rounded-full text-[13px] border transition " +
            buttonTone
          }
        >
          <span className="w-6 h-6 rounded-full bg-rust flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="#fff" className="w-3 h-3" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          {state === "playing"
            ? "Playing…"
            : state === "blocked"
              ? "Tap to listen"
              : "Replay greeting"}
        </button>

        {ambientUrl && (
          <button
            type="button"
            onClick={toggleAmbient}
            className={
              "px-4 py-3 rounded-full text-[12px] border transition " + buttonTone
            }
            aria-pressed={muted}
          >
            {muted ? "Ambient: off" : "Ambient: on"}
          </button>
        )}
      </div>

      {state === "blocked" && greetingText && (
        <p className="text-xs opacity-70 max-w-[380px]">
          Your browser blocked autoplay. The greeting is queued — tap the button above.
        </p>
      )}
    </div>
  );
}
