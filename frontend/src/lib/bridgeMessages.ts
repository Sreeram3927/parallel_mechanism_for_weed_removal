import type { LogEntry, LogLevel } from "@/types/logs";

const LEVELS: LogLevel[] = ["ERROR", "WARN", "INFO", "DEBUG", "VERBOSE"];

function asLogLevel(s: unknown): LogLevel | null {
  if (typeof s !== "string") return null;
  const u = s.toUpperCase();
  return LEVELS.includes(u as LogLevel) ? (u as LogLevel) : null;
}

function nextClientLogId() {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type BridgeTelemetry = { j1: number; j2: number; j3: number };

function coerceTimestamp(ts: unknown): number {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return Date.now();
  // If it's in seconds (common for integer timestamps), convert to ms.
  // 10-digit seconds ~ 1_000_000_000 .. 4_000_000_000; ms is 13 digits.
  if (ts > 0 && ts < 10_000_000_000) return ts * 1000;
  return ts;
}

/** Expected JSON shapes from ws://…:8765 (extend as your backend evolves). */
export function parseBridgeMessages(raw: string): {
  telemetry: BridgeTelemetry[];
  logs: LogEntry[];
} {
  const telemetry: BridgeTelemetry[] = [];
  const logs: LogEntry[] = [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { telemetry, logs };
  }

  const visit = (o: Record<string, unknown>) => {
    const t = o.type;
    if (t === "telemetry") {
      const directJ1 = o.j1;
      const directJ2 = o.j2;
      const directJ3 = o.j3;
      const data = o.data;
      const angleA =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>).angleA
          : undefined;
      const angleB =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>).angleB
          : undefined;
      const angleC =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>).angleC
          : undefined;

      const j1 = typeof directJ1 === "number" ? directJ1 : angleA;
      const j2 = typeof directJ2 === "number" ? directJ2 : angleB;
      const j3 = typeof directJ3 === "number" ? directJ3 : angleC;
      if (
        typeof j1 === "number" &&
        typeof j2 === "number" &&
        typeof j3 === "number"
      ) {
        telemetry.push({ j1, j2, j3 });
      }
      return;
    }
    if (t === "log") {
      const message = o.message;
      const level = asLogLevel(o.level) ?? "INFO";
      const source = (typeof o.tag === "string" ? o.tag : undefined) ??
        (typeof o.source === "string" ? o.source : "bridge");
      if (typeof message === "string") {
        logs.push({
          id: typeof o.id === "string" ? o.id : nextClientLogId(),
          ts:
            typeof o.timestamp === "number"
              ? coerceTimestamp(o.timestamp)
              : typeof o.ts === "number"
                ? coerceTimestamp(o.ts)
                : typeof o.t === "number"
                  ? coerceTimestamp(o.t)
                  : Date.now(),
          level,
          source,
          message,
        });
      }
    }

    // Allow "log-like" payloads without an explicit type
    if (t !== "log") {
      const maybeMsg = o.message ?? o.msg ?? o.text;
      const maybeLevel = o.level ?? o.severity ?? o.lvl;
      if (typeof maybeMsg === "string" && typeof maybeLevel === "string") {
        logs.push({
          id: typeof o.id === "string" ? o.id : nextClientLogId(),
          ts:
            typeof o.ts === "number"
              ? o.ts
              : typeof o.t === "number"
                ? o.t
                : Date.now(),
          level: asLogLevel(maybeLevel) ?? "INFO",
          source: typeof o.source === "string" ? o.source : "bridge",
          message: maybeMsg,
        });
      }
    }

    // Allow "telemetry-like" payloads without an explicit type
    if (t !== "telemetry") {
      const j1 =
        (o.j1 as unknown) ??
        (o.J1 as unknown) ??
        (o.joint1 as unknown) ??
        (o.theta1 as unknown);
      const j2 =
        (o.j2 as unknown) ??
        (o.J2 as unknown) ??
        (o.joint2 as unknown) ??
        (o.theta2 as unknown);
      const j3 =
        (o.j3 as unknown) ??
        (o.J3 as unknown) ??
        (o.joint3 as unknown) ??
        (o.theta3 as unknown);
      if (
        typeof j1 === "number" &&
        typeof j2 === "number" &&
        typeof j3 === "number"
      ) {
        telemetry.push({ j1, j2, j3 });
      }
    }

    const nested = o.telemetry;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const n = nested as Record<string, unknown>;
      const j1 = n.j1;
      const j2 = n.j2;
      const j3 = n.j3;
      if (
        typeof j1 === "number" &&
        typeof j2 === "number" &&
        typeof j3 === "number"
      ) {
        telemetry.push({ j1, j2, j3 });
      }
    }
  };

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object") visit(item as Record<string, unknown>);
    }
    return { telemetry, logs };
  }

  if (data && typeof data === "object") {
    const root = data as Record<string, unknown>;
    if (Array.isArray(root.events)) {
      for (const item of root.events) {
        if (item && typeof item === "object")
          visit(item as Record<string, unknown>);
      }
      return { telemetry, logs };
    }
    visit(root);
  }

  return { telemetry, logs };
}

export function wsMoveCommand(j1: number, j2: number, j3: number) {
  return JSON.stringify({
    target: "esp",
    command: "CMD_MOVE_ABSOLUTE", 
    motorId: "T",
    valA: j1, 
    valB: j2, 
    valC: j3 
  });
}

export function wsJogCommand(j1: number, j2: number, j3: number, motorId: string) {
  return JSON.stringify({
    target: "esp",
    command: "CMD_JOG_RELATIVE",
    motorId: motorId,
    valA: j1,
    valB: j2,
    valC: j3
  });
}

export function wsMoveCoordinateCommand(x: number, y: number, z: number) {
  return JSON.stringify({
    target: "esp",
    command: "CMD_MOVE_COORDINATE",
    x: x,
    y: y,
    z: z
  });
}

export function wsEstopCommand() {
  return JSON.stringify({ 
    target: "esp",
    command: "CMD_STOP",
    // valA, valB, valC are not needed for a stop command
  });
}

export function wsArduinoCommand(cmd: string) {
  return JSON.stringify({
    target: "arduino",
    command: cmd
  });
}

/** Laser power 0–100 → Arduino command string L&lt;power&gt; (e.g. L10, L100, L0). */
export function wsLaserCommand(power: number) {
  const clamped = Math.round(Math.min(100, Math.max(0, power)));
  return JSON.stringify({
    target: "arduino",
    command: `L${clamped}`,
  });
}