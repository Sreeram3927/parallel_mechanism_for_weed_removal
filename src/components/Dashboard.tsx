"use client";

import { useCallback, useEffect, useState } from "react";
import { CameraFeedPanel } from "@/components/CameraFeedPanel";
import { LogViewer } from "@/components/LogViewer";
import { MobileRobotControlPanel } from "@/components/MobileRobotControlPanel";
import { RobotControlPanel } from "@/components/RobotControlPanel";
import {
  REALSENSE_RTSP_URL,
  REALSENSE_WHEP_URL,
  ROBOT_WS_URL,
  USE_MOCK_WS,
} from "@/config/bridge";
import { useMockWebSocket } from "@/hooks/useMockWebSocket";
import { useRobotWebSocket } from "@/hooks/useRobotWebSocket";
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

function appendLog(
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  entry: Omit<LogEntry, "id" | "ts"> & { id?: string; ts?: number },
) {
  setLogs((prev) => {
    const next: LogEntry = {
      id: entry.id ?? `log-${++logSeq}`,
      ts: entry.ts ?? Date.now(),
      level: entry.level,
      source: entry.source,
      message: entry.message,
    };
    const merged = [...prev, next];
    return merged.length > 1000 ? merged.slice(-1000) : merged;
  });
}

export function Dashboard() {
  const [commandMode, setCommandMode] = useState<"joint" | "coordinate">("joint");
  const [jogStepDeg, setJogStepDeg] = useState("1.00");
  const [joints, setJoints] = useState(() =>
    USE_MOCK_WS ? { j1: 12.34, j2: -4.56, j3: 88.12 } : { j1: 0, j2: 0, j3: 0 },
  );
  const [targets, setTargets] = useState(() =>
    USE_MOCK_WS
      ? { j1: "12.50", j2: "-4.50", j3: "88.00" }
      : { j1: "0.00", j2: "0.00", j3: "0.00" },
  );
  const [coordinateTargets, setCoordinateTargets] = useState(() =>
    USE_MOCK_WS ? { x: "120.00", y: "0.00", z: "-260.00" } : { x: "0.00", y: "0.00", z: "0.00" },
  );
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    USE_MOCK_WS ? Array.from({ length: 8 }, () => nextLog()) : [],
  );
  const [showDebug, setShowDebug] = useState(true);
  const [showVerbose, setShowVerbose] = useState(false);

  const onTelemetry = useCallback((j: { j1: number; j2: number; j3: number }) => {
    setJoints(j);
  }, []);

  const onLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => {
      const merged = [...prev, entry];
      return merged.length > 200 ? merged.slice(-200) : merged;
    });
  }, []);

  const mockWs = useMockWebSocket(USE_MOCK_WS);
  const { status: realWsStatus, sendMove, sendMoveCoordinate, sendJog, sendEstop, startDriving, stopDriving } =
    useRobotWebSocket({
      enabled: !USE_MOCK_WS,
      url: ROBOT_WS_URL,
      onTelemetry,
      onLog,
    });

  const wsStatus = USE_MOCK_WS ? mockWs.status : realWsStatus;

  useEffect(() => {
    if (!USE_MOCK_WS) return;
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
    if (!USE_MOCK_WS) return;
    const push = window.setInterval(() => {
      setLogs((prev) => {
        const next = [...prev, nextLog()];
        return next.length > 1000 ? next.slice(-1000) : next;
      });
    }, 2800 + Math.random() * 1200);
    return () => window.clearInterval(push);
  }, []);

  const onTargetChange = useCallback((joint: "j1" | "j2" | "j3", value: string) => {
    setTargets((t) => ({ ...t, [joint]: value }));
  }, []);

  const onCoordinateTargetChange = useCallback(
    (axis: "x" | "y" | "z", value: string) => {
      setCoordinateTargets((t) => ({ ...t, [axis]: value }));
    },
    [],
  );

  const onJogJoint = useCallback((joint: "j1" | "j2" | "j3", direction: -1 | 1) => {
    const parsedStep = Number.parseFloat(jogStepDeg);
    const jogStep = Number.isFinite(parsedStep) && parsedStep > 0 ? parsedStep : 1;
    const delta = direction * jogStep;
    const motorIdByJoint: Record<"j1" | "j2" | "j3", string> = {
      j1: "A",
      j2: "B",
      j3: "C",
    };
    const componentByJoint: Record<"j1" | "j2" | "j3", [number, number, number]> = {
      j1: [delta, 0, 0],
      j2: [0, delta, 0],
      j3: [0, 0, delta],
    };
    const [dj1, dj2, dj3] = componentByJoint[joint];

    if (USE_MOCK_WS) {
      setJoints((prev) => {
        const next = { ...prev, [joint]: prev[joint] + delta };
        setTargets({
          j1: next.j1.toFixed(2),
          j2: next.j2.toFixed(2),
          j3: next.j3.toFixed(2),
        });
        return next;
      });
      appendLog(setLogs, {
        level: "INFO",
        source: "motion",
        message: `Jog ${joint.toUpperCase()} ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}° (mock)`,
      });
      return;
    }

    const ok = sendJog(dj1, dj2, dj3, motorIdByJoint[joint]);
    if (!ok) {
      appendLog(setLogs, {
        level: "WARN",
        source: "ui",
        message: `Bridge not connected (${ROBOT_WS_URL}) — jog not sent`,
      });
      return;
    }
    appendLog(setLogs, {
      level: "INFO",
      source: "motion",
      message: `Jog ${joint.toUpperCase()} ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}°`,
    });
  }, [jogStepDeg, sendJog]);

  const onSendCommand = useCallback(() => {
    if (commandMode === "joint") {
      const j1 = parseFloat(targets.j1);
      const j2 = parseFloat(targets.j2);
      const j3 = parseFloat(targets.j3);
      if ([j1, j2, j3].some((n) => Number.isNaN(n))) {
        appendLog(setLogs, {
          level: "WARN",
          source: "ui",
          message: "Invalid joint target — enter numeric degrees for J1–J3",
        });
        return;
      }

      if (USE_MOCK_WS) {
        setJoints({ j1, j2, j3 });
        appendLog(setLogs, {
          level: "INFO",
          source: "motion",
          message: `Joint command queued: J1=${j1.toFixed(2)}° J2=${j2.toFixed(2)}° J3=${j3.toFixed(2)}° (mock)`,
        });
        return;
      }

      const ok = sendMove(j1, j2, j3);
      if (!ok) {
        appendLog(setLogs, {
          level: "WARN",
          source: "ui",
          message: `Bridge not connected (${ROBOT_WS_URL}) — command not sent`,
        });
      }
      return;
    }

    const x = parseFloat(coordinateTargets.x);
    const y = parseFloat(coordinateTargets.y);
    const z = parseFloat(coordinateTargets.z);
    if ([x, y, z].some((n) => Number.isNaN(n))) {
      appendLog(setLogs, {
        level: "WARN",
        source: "ui",
        message: "Invalid coordinate target — enter numeric X/Y/Z values",
      });
      return;
    }

    if (USE_MOCK_WS) {
      appendLog(setLogs, {
        level: "INFO",
        source: "motion",
        message: `Coordinate command queued: X=${x.toFixed(2)} Y=${y.toFixed(2)} Z=${z.toFixed(2)} (mock IK)`,
      });
      return;
    }

    const ok = sendMoveCoordinate(x, y, z);
    if (!ok) {
      appendLog(setLogs, {
        level: "WARN",
        source: "ui",
        message: `Bridge not connected (${ROBOT_WS_URL}) — command not sent`,
      });
    }
  }, [commandMode, coordinateTargets, targets, sendMove, sendMoveCoordinate]);

  const onEstop = useCallback(() => {
    if (USE_MOCK_WS) {
      appendLog(setLogs, {
        level: "ERROR",
        source: "safety",
        message: "E-STOP asserted — motion halted, laser disabled (mock)",
      });
      return;
    }
    const ok = sendEstop();
    if (!ok) {
      appendLog(setLogs, {
        level: "WARN",
        source: "ui",
        message: `Bridge not connected (${ROBOT_WS_URL}) — E-STOP not sent`,
      });
    }
  }, [sendEstop]);

  const onForward = useCallback(() => {
    if (USE_MOCK_WS) {
      appendLog(setLogs, {
        level: "INFO",
        source: "mobile",
        message: "Forward command sent (mock)",
      });
    }

    const ok = startDriving('f');
    if (!ok) {
      appendLog(setLogs, {
      level: "WARN",
      source: "ui",
      message: `Bridge not connected (${ROBOT_WS_URL}) — Arduino command not sent`,
    });
  }
  }, [startDriving]);

  const onBackward = useCallback(() => {
    if (USE_MOCK_WS) {
      appendLog(setLogs, {
        level: "INFO",
        source: "mobile",
        message: "Backward command sent (mock)",
      });
    }
    const ok = startDriving('b');
    if (!ok) {
      appendLog(setLogs, {
        level: "WARN",
        source: "ui",
        message: `Bridge not connected (${ROBOT_WS_URL}) — Arduino command not sent`,
      });
    }
  }, [startDriving]);

  const onLeft = useCallback(() => {
    if (USE_MOCK_WS) {
      appendLog(setLogs, {
        level: "INFO",
        source: "mobile",
        message: "Left command sent (mock)",
      });
    }
    const ok = startDriving('l');
    if (!ok) {
      appendLog(setLogs, {
        level: "WARN",
        source: "ui",
        message: `Bridge not connected (${ROBOT_WS_URL}) — Arduino command not sent`,
      });
    }
  }, [startDriving]);

  const onRight = useCallback(() => {
    if (USE_MOCK_WS) {
      appendLog(setLogs, {
        level: "INFO",
        source: "mobile",
        message: "Right command sent (mock)",
      });
    }
    const ok = startDriving('r');
    if (!ok) {
      appendLog(setLogs, {
        level: "WARN",
        source: "ui",
        message: `Bridge not connected (${ROBOT_WS_URL}) — Arduino command not sent`,
      });
    }
  }, [startDriving]);

  const onMobileRobotStop = useCallback(() => {
    if (USE_MOCK_WS) {
      appendLog(setLogs, {
        level: "INFO",
        source: "mobile",
        message: "Stop command sent (mock)",
      });
    }

    const ok = stopDriving();
    if (!ok) {
      appendLog(setLogs, {
        level: "WARN",
        source: "ui",
        message: `Bridge not connected (${ROBOT_WS_URL}) — Arduino command not sent`,
      });
    }
  }, [stopDriving]);

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100 md:p-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50 md:text-2xl">
            Delta manipulator control
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            Delta manipulator · Laser weed removal · Control station
          </p>
        </div>
        {USE_MOCK_WS ? (
          <span
            className="rounded border border-amber-900/70 bg-amber-950/60 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-400"
            title="Set NEXT_PUBLIC_USE_MOCK_WS=false to use ws://10.42.0.69:8765"
          >
            Mock bridge
          </span>
        ) : (
          <span className="max-w-[min(100%,28rem)] truncate font-mono text-[10px] text-zinc-600">
            WS {ROBOT_WS_URL}
          </span>
        )}
      </header>

      <main className="dashboard-grid">
        <section className="dashboard-area-camera">
          <CameraFeedPanel whepUrl={REALSENSE_WHEP_URL} rtspUrl={REALSENSE_RTSP_URL} />
        </section>

        <section className="dashboard-area-robot">
          <RobotControlPanel
            wsStatus={wsStatus}
            commandMode={commandMode}
            joints={joints}
            targets={targets}
            coordinateTargets={coordinateTargets}
            jogStepDeg={jogStepDeg}
            onCommandModeChange={setCommandMode}
            onTargetChange={onTargetChange}
            onCoordinateTargetChange={onCoordinateTargetChange}
            onJogStepChange={setJogStepDeg}
            onJogJoint={onJogJoint}
            onSendCommand={onSendCommand}
            onEstop={onEstop}
            // onRefresh={onRefresh}
          />
        </section>

        <section className="dashboard-area-mobile-robot">
          <MobileRobotControlPanel
            wsStatus={wsStatus}
            onForward={onForward}
            onBackward={onBackward}
            onLeft={onLeft}
            onRight={onRight}
            onMobileRobotStop={onMobileRobotStop}
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
