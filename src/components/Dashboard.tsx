"use client";

import { useCallback, useEffect, useState } from "react";
import { CameraFeedPanel } from "@/components/CameraFeedPanel";
import { LogViewer } from "@/components/LogViewer";
import { RobotControlPanel } from "@/components/RobotControlPanel";
import { useMockWebSocket } from "@/hooks/useMockWebSocket";
import type { LogEntry, LogLevel } from "@/types/logs";

const MOCK_SOURCES = ["mtx", "realsense", "motion", "laser", "safety", "ws"];

const MOCK_MESSAGES: Record<LogLevel, string[]> = {
  ERROR: [
    "Joint J2 following error — driver alarm",
    "Laser interlock open — beam suppressed",
    "MTX frame timeout on channel 0",
  ],
  WARN: [
    "Joint J3 near soft limit (+2.1° margin)",
    "CPU thermal throttle risk — reduce stream FPS",
    "Calibration drift check recommended",
  ],
  INFO: [
    "Homing sequence complete",
    "Target pose accepted by planner",
    "Weed map tile 12/48 processed",
  ],
  DEBUG: [
    "IK solver residual 0.0004 rad",
    "Stepper tick: J1 +0.02°",
    "WS payload seq=18402 ack",
  ],
  VERBOSE: [
    "Heap trace: arena 3 fragment 0.12",
    "Shader compile cache hit",
    "TCP keepalive probe sent",
  ],
};

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomLevel(): LogLevel {
  const r = Math.random();
  if (r < 0.08) return "ERROR";
  if (r < 0.22) return "WARN";
  if (r < 0.55) return "INFO";
  if (r < 0.82) return "DEBUG";
  return "VERBOSE";
}

let logSeq = 0;
function nextLog(): LogEntry {
  const level = randomLevel();
  return {
    id: `log-${++logSeq}`,
    ts: Date.now(),
    level,
    source: randomItem(MOCK_SOURCES),
    message: randomItem(MOCK_MESSAGES[level]),
  };
}

export function Dashboard() {
  const { status: wsStatus } = useMockWebSocket();
  const [joints, setJoints] = useState({ j1: 12.34, j2: -4.56, j3: 88.12 });
  const [targets, setTargets] = useState({ j1: "12.50", j2: "-4.50", j3: "88.00" });
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    Array.from({ length: 8 }, () => nextLog()),
  );
  const [showDebug, setShowDebug] = useState(true);
  const [showVerbose, setShowVerbose] = useState(false);

  useEffect(() => {
    const drift = window.setInterval(() => {
      setJoints((j) => ({
        j1: j.j1 + (Math.random() - 0.5) * 0.04,
        j2: j.j2 + (Math.random() - 0.5) * 0.04,
        j3: j.j3 + (Math.random() - 0.5) * 0.03,
      }));
    }, 400);
    return () => window.clearInterval(drift);
  }, []);

  useEffect(() => {
    const push = window.setInterval(() => {
      setLogs((prev) => {
        const next = [...prev, nextLog()];
        return next.length > 200 ? next.slice(-200) : next;
      });
    }, 2800 + Math.random() * 1200);
    return () => window.clearInterval(push);
  }, []);

  const onTargetChange = useCallback((joint: "j1" | "j2" | "j3", value: string) => {
    setTargets((t) => ({ ...t, [joint]: value }));
  }, []);

  const onSendCommand = useCallback(() => {
    const j1 = parseFloat(targets.j1);
    const j2 = parseFloat(targets.j2);
    const j3 = parseFloat(targets.j3);
    if ([j1, j2, j3].some((n) => Number.isNaN(n))) {
      setLogs((p) => [
        ...p,
        {
          id: `log-${++logSeq}`,
          ts: Date.now(),
          level: "WARN" as const,
          source: "ui",
          message: "Invalid target angle — enter numeric degrees for J1–J3",
        },
      ]);
      return;
    }
    setJoints({ j1, j2, j3 });
    setLogs((p) => [
      ...p,
      {
        id: `log-${++logSeq}`,
        ts: Date.now(),
        level: "INFO" as const,
        source: "motion",
        message: `Command queued: J1=${j1.toFixed(2)}° J2=${j2.toFixed(2)}° J3=${j3.toFixed(2)}° (mock)`,
      },
    ]);
  }, [targets]);

  const onEstop = useCallback(() => {
    setLogs((p) => [
      ...p,
      {
        id: `log-${++logSeq}`,
        ts: Date.now(),
        level: "ERROR" as const,
        source: "safety",
        message: "E-STOP asserted — motion halted, laser disabled (mock)",
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100 md:p-6">
      <header className="mb-6 border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50 md:text-2xl">
          Delta manipulator control
        </h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          Delta manipulator · Laser weed removal · Control station
        </p>
      </header>

      <main className="dashboard-grid">
        <section className="dashboard-area-camera">
          <CameraFeedPanel />
        </section>

        <section className="dashboard-area-robot">
          <RobotControlPanel
            wsStatus={wsStatus}
            joints={joints}
            targets={targets}
            onTargetChange={onTargetChange}
            onSendCommand={onSendCommand}
            onEstop={onEstop}
          />
        </section>

        <section className="dashboard-area-logs">
          <LogViewer
            logs={logs}
            showDebug={showDebug}
            showVerbose={showVerbose}
            onToggleDebug={setShowDebug}
            onToggleVerbose={setShowVerbose}
          />
        </section>
      </main>
    </div>
  );
}
