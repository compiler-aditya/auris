"use client";

import { useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";

type Status = "idle" | "connecting" | "listening" | "ended" | "error";
type Variant = "default" | "flush";
type Tone = "dark" | "light";

interface Props {
  characterId: string;
  /** Layout behavior. "flush" stretches to fill its flex parent. */
  variant?: Variant;
  /** Visual tone. "dark" = ink bg on paper pages; "light" = paper bg on dark pages (e.g. Pair unlock). */
  tone?: Tone;
}

const LABEL: Record<Status, string> = {
  idle: "Talk back",
  connecting: "Connecting…",
  listening: "Listening · tap to end",
  ended: "Talk again",
  error: "Try again",
};

export function ConverseButton({ characterId, variant = "default", tone = "dark" }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const convRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null);

  async function start() {
    setLastError(null);
    setStatus("connecting");
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const session = await Conversation.startSession({
        signedUrl: data.signed_url,
        onConnect: () => setStatus("listening"),
        onDisconnect: () => setStatus("ended"),
        onError: (err: unknown) => {
          setLastError(err instanceof Error ? err.message : String(err));
          setStatus("error");
        },
      });
      convRef.current = session;
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function stop() {
    try {
      await convRef.current?.endSession();
    } finally {
      convRef.current = null;
      setStatus("ended");
    }
  }

  const isActive = status === "connecting" || status === "listening";
  const onClick = isActive ? stop : start;

  // Match the wireframe: pill with a small round icon badge in accent.
  const bgStyle =
    tone === "light"
      ? { background: "#f2e8d3", color: "#0a0906" }
      : {};

  const baseClasses =
    variant === "flush"
      ? "flex-1 inline-flex items-center justify-center gap-2.5 pl-3.5 pr-[22px] py-4 rounded-full text-sm font-medium transition"
      : "inline-flex items-center gap-3 pl-[14px] pr-6 py-4 rounded-full text-sm font-medium transition";

  const toneClasses =
    tone === "light"
      ? "hover:opacity-90"
      : "bg-ink text-paper hover:opacity-90";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={`${baseClasses} ${toneClasses} disabled:opacity-50`}
        style={bgStyle}
        onClick={onClick}
        disabled={status === "connecting"}
      >
        <span className="w-7 h-7 rounded-full bg-rust flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#fff" className="w-3.5 h-3.5" aria-hidden>
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
            <path d="M19 11a7 7 0 0 1-14 0" fill="none" stroke="#fff" strokeWidth={2} />
            <path d="M12 18v3" fill="none" stroke="#fff" strokeWidth={2} />
          </svg>
        </span>
        {LABEL[status]}
      </button>
      {lastError && (
        <p className="text-[11px] text-rust max-w-xs">{lastError}</p>
      )}
    </div>
  );
}
