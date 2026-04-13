"use client";

import { useEffect, useState } from "react";

export type MockWsStatus = "idle" | "connecting" | "connected" | "error";

export function useMockWebSocket() {
  const [status, setStatus] = useState<MockWsStatus>("idle");
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);

  useEffect(() => {
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
  }, []);

  return { status, lastMessageAt };
}
