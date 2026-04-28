"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseBridgeMessages,
  wsEstopCommand,
  wsMoveCoordinateCommand,
  wsMoveCommand,
  wsJogCommand,
  wsArduinoCommand,
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
  // In the browser, window.setTimeout returns a number. (Node types can conflict in TS.)
  const reconnectTimer = useRef<number | null>(null);
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

        const handle = async () => {
          let raw = "";
          const d = ev.data;
          if (typeof d === "string") raw = d;
          else if (d instanceof Blob) raw = await d.text();
          else if (d instanceof ArrayBuffer)
            raw = new TextDecoder().decode(new Uint8Array(d));
          // Some servers send Uint8Array views
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          else if ((d as any)?.buffer instanceof ArrayBuffer) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const view = d as any;
            raw = new TextDecoder().decode(
              new Uint8Array(view.buffer, view.byteOffset ?? 0, view.byteLength),
            );
          }

          const { telemetry, logs } = parseBridgeMessages(raw);
          for (const t of telemetry) onTelemetryRef.current(t);
          for (const log of logs) onLogRef.current(log);
        };

        // fire-and-forget; safe for sync and async frame types
        void handle();
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

  const sendMoveCoordinate = useCallback((x: number, y: number, z: number) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(wsMoveCoordinateCommand(x, y, z));
    return true;
  }, []);

  const sendJog = useCallback((dj1: number, dj2: number, dj3: number, motorId: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(wsJogCommand(dj1, dj2, dj3, motorId));
    return true;
  }, []);

  const sendEstop = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(wsEstopCommand());
    return true;
  }, []);

  // Use ReturnType to automatically get the correct type for setInterval 
  // whether this is running in a browser or Node environment.
  const driveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const PUBLISH_RATE_MS = 100; // Send command 10 times per second

  const startDriving = useCallback((directionCommand: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    // Clear any existing interval first to prevent runaway commands
    if (driveIntervalRef.current) {
      clearInterval(driveIntervalRef.current);
    }

    driveIntervalRef.current = setInterval(() => {
      // Assuming wsArduinoCommand formats the string and ws.send actually sends it
      ws.send(wsArduinoCommand(directionCommand)); 
    }, PUBLISH_RATE_MS);
    return true;
  }, []);

  const stopDriving = useCallback(() => {
    const ws = wsRef.current;
    // Clear the interval using the ref
    if (driveIntervalRef.current) {
      clearInterval(driveIntervalRef.current);
      driveIntervalRef.current = null;
    }
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(wsArduinoCommand('s'));
    return true;
  }, []);



  return { status, lastMessageAt, sendMove, sendMoveCoordinate, sendJog, sendEstop, startDriving, stopDriving};
}
