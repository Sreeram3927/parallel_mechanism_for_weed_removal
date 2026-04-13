"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseBridgeMessages,
  wsEstopCommand,
  wsMoveCommand,
} from "@/lib/bridgeMessages";
import type { LogEntry } from "@/types/logs";
import type { BridgeStatus } from "@/types/bridge";

type Options = {
  enabled: boolean;
  url: string;
  onTelemetry: (j: { j1: number; j2: number; j3: number }) => void;
  onLog: (entry: LogEntry) => void;
};

const RECONNECT_MIN_MS = 1500;
const RECONNECT_MAX_MS = 20_000;

export function useRobotWebSocket({
  enabled,
  url,
  onTelemetry,
  onLog,
}: Options) {
  const [status, setStatus] = useState<BridgeStatus>(
    enabled ? "connecting" : "idle",
  );
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopped = useRef(false);

  const onTelemetryRef = useRef(onTelemetry);
  const onLogRef = useRef(onLog);
  onTelemetryRef.current = onTelemetry;
  onLogRef.current = onLog;

  const clearReconnect = useCallback(() => {
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(
    (connectFn: () => void) => {
      clearReconnect();
      const n = reconnectAttempt.current;
      const delay = Math.min(
        RECONNECT_MAX_MS,
        RECONNECT_MIN_MS * Math.pow(1.6, n),
      );
      reconnectTimer.current = window.setTimeout(() => {
        reconnectTimer.current = null;
        connectFn();
      }, delay);
      reconnectAttempt.current = n + 1;
    },
    [clearReconnect],
  );

  useEffect(() => {
    stopped.current = false;
    if (!enabled) {
      clearReconnect();
      reconnectAttempt.current = 0;
      wsRef.current?.close();
      wsRef.current = null;
      setStatus("idle");
      setLastMessageAt(null);
      return;
    }

    const connect = () => {
      if (stopped.current) return;
      clearReconnect();
      setStatus((s) => (s === "connected" ? s : "connecting"));

      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch {
        setStatus("error");
        scheduleReconnect(connect);
        return;
      }

      wsRef.current = socket;

      socket.onopen = () => {
        if (stopped.current) return;
        reconnectAttempt.current = 0;
        setStatus("connected");
      };

      socket.onmessage = (ev) => {
        if (stopped.current) return;
        setLastMessageAt(Date.now());
        const { telemetry, logs } = parseBridgeMessages(
          typeof ev.data === "string" ? ev.data : "",
        );
        for (const t of telemetry) onTelemetryRef.current(t);
        for (const log of logs) onLogRef.current(log);
      };

      socket.onerror = () => {
        if (stopped.current) return;
        setStatus("error");
      };

      socket.onclose = () => {
        if (stopped.current) return;
        wsRef.current = null;
        setStatus("connecting");
        scheduleReconnect(connect);
      };
    };

    connect();

    return () => {
      stopped.current = true;
      clearReconnect();
      reconnectAttempt.current = 0;
      wsRef.current?.close();
      wsRef.current = null;
      setStatus("idle");
    };
  }, [enabled, url, clearReconnect, scheduleReconnect]);

  const sendMove = useCallback((j1: number, j2: number, j3: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(wsMoveCommand(j1, j2, j3));
    return true;
  }, []);

  const sendEstop = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(wsEstopCommand());
    return true;
  }, []);

  return { status, lastMessageAt, sendMove, sendEstop };
}
