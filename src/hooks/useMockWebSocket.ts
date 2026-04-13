"use client";

import { useEffect, useState } from "react";
import type { BridgeStatus } from "@/types/bridge";

export function useMockWebSocket(enabled: boolean) {
  const [status, setStatus] = useState<BridgeStatus>(
    enabled ? "connecting" : "idle",
  );
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setLastMessageAt(null);
      return;
    }

    setStatus("connecting");
    const connectTimer = window.setTimeout(() => {
      setStatus("connected");
      setLastMessageAt(Date.now());
    }, 900);

    const heartbeat = window.setInterval(() => {
      setLastMessageAt(Date.now());
    }, 2500);

    return () => {
      window.clearTimeout(connectTimer);
      window.clearInterval(heartbeat);
    };
  }, [enabled]);

  return { status, lastMessageAt };
}
