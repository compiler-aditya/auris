"use client";

import { useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";

interface Props {
  characterId: string;
}

type Status = "idle" | "connecting" | "listening" | "ended" | "error";

export function ConverseButton({ characterId }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const convRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null);

  async function start() {
    setLastError(null);
    setStatus("connecting");
    try {
      // Ask the server for a signed WS URL bound to this character's agent.
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

      // Request microphone access up-front so the browser prompts visibly.
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

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className={
          "rounded-full px-6 py-2 text-sm transition " +
          (isActive
            ? "bg-ember text-parchment"
            : "border border-ember text-ember hover:bg-ember hover:text-parchment")
        }
        onClick={isActive ? stop : start}
        disabled={status === "connecting"}
      >
        {{
          idle: "Talk back",
          connecting: "Connecting…",
          listening: "Listening · tap to end",
          ended: "Talk again",
          error: "Try again",
        }[status]}
      </button>
      {lastError && <p className="text-xs text-red-600 max-w-xs text-center">{lastError}</p>}
    </div>
  );
}
