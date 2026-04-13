"use client";

import { useEffect, useState } from "react";
import { connectWhep } from "@/lib/whep";

type Phase = "idle" | "connecting" | "connected" | "error";

/**
 * Plays a MediaMTX (WHEP) WebRTC stream into the given <video> element.
 */
export function useWhepStream(
  whepUrl: string | null,
  video: HTMLVideoElement | null,
) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!whepUrl || !video) {
      setPhase("idle");
      setError(null);
      return;
    }

    let cancelled = false;
    const ac = new AbortController();

    setError(null);
    setPhase("connecting");

    let cleanup: (() => void) | undefined;

    connectWhep({
      whepUrl,
      video,
      signal: ac.signal,
    })
      .then((fn) => {
        if (cancelled) {
          fn();
          return;
        }
        cleanup = fn;
        setPhase("connected");
      })
      .catch((e: unknown) => {
        if (cancelled || ac.signal.aborted) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        const msg =
          e instanceof Error ? e.message : "WebRTC / WHEP connection failed";
        setError(msg);
        setPhase("error");
      });

    return () => {
      cancelled = true;
      ac.abort();
      cleanup?.();
      video.srcObject = null;
      setPhase("idle");
    };
  }, [whepUrl, video]);

  return { phase, error };
}
