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
      const j1 = o.j1;
      const j2 = o.j2;
      const j3 = o.j3;
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
      const source =
        typeof o.source === "string" ? o.source : "bridge";
      if (typeof message === "string") {
        logs.push({
          id: typeof o.id === "string" ? o.id : nextClientLogId(),
          ts:
            typeof o.ts === "number"
              ? o.ts
              : typeof o.t === "number"
                ? o.t
                : Date.now(),
          level,
          source,
          message,
        });
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
  return JSON.stringify({ type: "move", j1, j2, j3 });
}

export function wsEstopCommand() {
  return JSON.stringify({ type: "estop" });
}
