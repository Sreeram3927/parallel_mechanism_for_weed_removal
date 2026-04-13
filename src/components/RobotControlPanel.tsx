"use client";

import { AlertOctagon, Send, Wifi, WifiOff } from "lucide-react";
import type { BridgeStatus } from "@/types/bridge";

type Props = {
  wsStatus: BridgeStatus;
  commandMode: "joint" | "coordinate";
  joints: { j1: number; j2: number; j3: number };
  targets: { j1: string; j2: string; j3: string };
  coordinateTargets: { x: string; y: string; z: string };
  onCommandModeChange: (mode: "joint" | "coordinate") => void;
  onTargetChange: (joint: "j1" | "j2" | "j3", value: string) => void;
  onCoordinateTargetChange: (axis: "x" | "y" | "z", value: string) => void;
  onJogJoint: (joint: "j1" | "j2" | "j3", direction: -1 | 1) => void;
  onSendCommand: () => void;
  onEstop: () => void;
};

function formatAngle(n: number) {
  return n.toFixed(2);
}

export function RobotControlPanel({
  wsStatus,
  commandMode,
  joints,
  targets,
  coordinateTargets,
  onCommandModeChange,
  onTargetChange,
  onCoordinateTargetChange,
  onJogJoint,
  onSendCommand,
  onEstop,
}: Props) {
  const wsLabel =
    wsStatus === "connected"
      ? "Bridge online"
      : wsStatus === "connecting"
        ? "Connecting…"
        : wsStatus === "error"
          ? "Bridge fault"
          : "Idle";

  return (
    <div className="flex min-h-[220px] flex-1 flex-col rounded-lg border border-zinc-700/80 bg-zinc-900/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:min-h-0">
      <div className="mb-4 flex items-start justify-between gap-2 border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
            Robot state & control
          </h2>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
            NEMA23 · J1–J3 · Delta laser weed unit
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
            wsStatus === "connected"
              ? "border-emerald-900/60 bg-emerald-950/50 text-emerald-400"
              : wsStatus === "connecting"
                ? "border-amber-900/60 bg-amber-950/50 text-amber-400"
                : "border-zinc-700 bg-zinc-950 text-zinc-500"
          }`}
        >
          {wsStatus === "connected" ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 opacity-70" />
          )}
          {wsLabel}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
        <section>
          <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Telemetry (°)
          </h3>
          <ul className="space-y-2 font-mono">
            {(
              [
                ["J1", joints.j1],
                ["J2", joints.j2],
                ["J3", joints.j3],
              ] as const
            ).map(([label, val]) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 rounded border border-cyan-950/60 bg-black/40 px-3 py-2.5"
              >
                <span className="w-7 text-xs text-zinc-500">{label}</span>
                <span className="digital-readout inline-block min-w-[5.5rem] flex-1 text-right text-lg font-medium text-cyan-300 tabular-nums">
                  {formatAngle(val)}°
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onJogJoint(`j${label[1]}` as "j1" | "j2" | "j3", -1)}
                    className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800"
                    aria-label={`Jog ${label} negative`}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => onJogJoint(`j${label[1]}` as "j1" | "j2" | "j3", 1)}
                    className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800"
                    aria-label={`Jog ${label} positive`}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Command mode
          </h3>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onCommandModeChange("joint")}
              className={`rounded border px-2 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
                commandMode === "joint"
                  ? "border-cyan-700 bg-cyan-950/40 text-cyan-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Joint command
            </button>
            <button
              type="button"
              onClick={() => onCommandModeChange("coordinate")}
              className={`rounded border px-2 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
                commandMode === "coordinate"
                  ? "border-cyan-700 bg-cyan-950/40 text-cyan-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Coordinate command
            </button>
          </div>

          {commandMode === "joint" ? (
            <>
              <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Target (deg)
              </h3>
              <div className="space-y-2">
                {(["j1", "j2", "j3"] as const).map((key, i) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 font-mono text-xs text-zinc-400"
                  >
                    <span className="w-6 text-zinc-500">J{i + 1}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={targets[key]}
                      onChange={(e) => onTargetChange(key, e.target.value)}
                      className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100 tabular-nums outline-none ring-cyan-500/30 focus:border-cyan-600 focus:ring-1"
                    />
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Target coordinates
              </h3>
              <div className="space-y-2">
                {(["x", "y", "z"] as const).map((axis) => (
                  <label
                    key={axis}
                    className="flex items-center gap-2 font-mono text-xs text-zinc-400"
                  >
                    <span className="w-6 text-zinc-500 uppercase">{axis}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={coordinateTargets[axis]}
                      onChange={(e) => onCoordinateTargetChange(axis, e.target.value)}
                      className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100 tabular-nums outline-none ring-cyan-500/30 focus:border-cyan-600 focus:ring-1"
                    />
                  </label>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onEstop}
          className="flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-red-700 bg-gradient-to-b from-red-700 to-red-900 font-mono text-sm font-bold uppercase tracking-widest text-white shadow-[0_4px_0_rgb(127,29,29),inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:from-red-600 hover:to-red-800 active:translate-y-0.5 active:shadow-[0_2px_0_rgb(127,29,29)]"
        >
          <AlertOctagon className="h-5 w-5" strokeWidth={2.25} />
          E-STOP
        </button>
        <button
          type="button"
          onClick={onSendCommand}
          className="flex h-14 items-center justify-center gap-2 rounded-lg border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 font-mono text-sm font-semibold uppercase tracking-wider text-zinc-100 shadow-md transition hover:from-zinc-600 hover:to-zinc-800"
        >
          <Send className="h-4 w-4" />
          Send command
        </button>
      </div>
    </div>
  );
}
