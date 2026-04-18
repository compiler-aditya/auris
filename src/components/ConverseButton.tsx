"use client";

import { useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";

type Phase = "idle" | "connecting" | "speaking" | "listening" | "ended" | "error";
type Variant = "default" | "flush";
type Tone = "dark" | "light";

interface Props {
  characterId: string;
  /** Layout behavior. "flush" stretches to fill its flex parent. */
  variant?: Variant;
  /** Visual tone. "dark" = ink bg on paper pages; "light" = paper bg on dark pages. */
  tone?: Tone;
}

const LABEL: Record<Phase, string> = {
  idle: "Talk back",
  connecting: "Connecting…",
  speaking: "They're speaking…",
  listening: "Listening · speak now",
  ended: "Talk again",
  error: "Try again",
};

export function ConverseButton({ characterId, variant = "default", tone = "dark" }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lastLine, setLastLine] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const convRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null);

  async function start() {
    setLastError(null);
    setLastLine(null);
    setPhase("connecting");
    try {
      const res = await fetch("/api/converse/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId }),
      });
      const data = (await res.json()) as {
        agent_id?: string;
        signed_url?: string;
        error?: string;
      };
      if (!data.signed_url || !data.agent_id) {
        throw new Error(data.error ?? "no signed_url");
      }

      // The ElevenLabs client library acquires the mic itself via getUserMedia;
      // we don't pre-acquire (it would require a second permission prompt and
      // some browsers block duplicate mic consumers).
      const session = await Conversation.startSession({
        signedUrl: data.signed_url,
        onConnect: () => {
          setPhase("speaking"); // agent will deliver first_message immediately
        },
        onDisconnect: () => {
          setPhase("ended");
        },
        onModeChange: ({ mode }) => {
          // mode: "speaking" (agent is talking) | "listening" (mic is active)
          setPhase(mode === "speaking" ? "speaking" : "listening");
        },
        onMessage: ({ message, source }) => {
          // Keep the most recent user transcript / agent response on screen
          // so the user can see the conversation is alive.
          setLastLine(`${source === "user" ? "You" : "Them"}: ${message}`);
        },
        onError: (msg: string) => {
          setLastError(msg);
          setPhase("error");
        },
      });
      convRef.current = session;
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }

  async function stop() {
    try {
      await convRef.current?.endSession();
    } finally {
      convRef.current = null;
      setPhase("ended");
    }
  }

  function toggleMute() {
    const conv = convRef.current;
    if (!conv) return;
    const next = !muted;
    conv.setMicMuted(next);
    setMuted(next);
  }

  const isActive = phase === "connecting" || phase === "speaking" || phase === "listening";
  const onClick = isActive ? stop : start;

  const bgStyle =
    tone === "light" ? { background: "#f2e8d3", color: "#0a0906" } : {};

  const baseClasses =
    variant === "flush"
      ? "flex-1 inline-flex items-center justify-center gap-2.5 pl-3.5 pr-[22px] py-4 rounded-full text-sm font-medium transition"
      : "inline-flex items-center gap-3 pl-[14px] pr-6 py-4 rounded-full text-sm font-medium transition";

  const toneClasses =
    tone === "light" ? "hover:opacity-90" : "bg-ink text-paper hover:opacity-90";

  const dotColor =
    phase === "listening"
      ? "bg-[#4ade80]" // green — your turn
      : phase === "speaking"
        ? "bg-rust animate-pulse-dot" // rust pulse — agent speaking
        : phase === "connecting"
          ? "bg-rust animate-pulse-dot"
          : "bg-rust";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          className={`${baseClasses} ${toneClasses} disabled:opacity-50`}
          style={bgStyle}
          onClick={onClick}
          disabled={phase === "connecting"}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center ${dotColor}`}>
            <svg viewBox="0 0 24 24" fill="#fff" className="w-3.5 h-3.5" aria-hidden>
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
              <path d="M19 11a7 7 0 0 1-14 0" fill="none" stroke="#fff" strokeWidth={2} />
              <path d="M12 18v3" fill="none" stroke="#fff" strokeWidth={2} />
            </svg>
          </span>
          {LABEL[phase]}
        </button>

        {isActive && phase !== "connecting" && (
          <button
            type="button"
            onClick={toggleMute}
            className={
              "px-4 py-3 rounded-full text-[12px] border transition " +
              (tone === "light"
                ? "border-[#f2e8d3]/30 text-[#f2e8d3] hover:bg-[#f2e8d3]/10"
                : "border-line2 text-ink2 hover:bg-paper2")
            }
            aria-pressed={muted}
          >
            {muted ? "Mic: muted" : "Mic: on"}
          </button>
        )}
      </div>

      {lastLine && isActive && (
        <p
          className="text-[12px] max-w-[380px] leading-snug"
          style={{ color: tone === "light" ? "rgba(242,232,211,0.7)" : "var(--ink-3)" }}
        >
          {lastLine}
        </p>
      )}

      {lastError && (
        <p className="text-[11px] text-rust max-w-xs">
          {lastError.includes("Permission") || lastError.includes("NotAllowed")
            ? "Microphone blocked — enable it in your browser settings and tap again."
            : lastError}
        </p>
      )}
    </div>
  );
}
