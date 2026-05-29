"use client";

import { Crosshair } from "lucide-react";
import type { VisionTarget } from "@/types/vision";

type Props = {
  targets: VisionTarget[];
  updatedAt: number | null;
};

function formatCoord(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatConf(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

function formatUpdatedAt(ts: number | null) {
  if (ts === null) return "—";
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TargetLocationsPanel({ targets, updatedAt }: Props) {
  return (
    <div className="rounded-lg border border-emerald-950/50 bg-gradient-to-b from-zinc-950/80 to-black/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-200">
            <Crosshair className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            Vision targets
          </h3>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
            Live detections from vision thread
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded border border-emerald-900/50 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-emerald-300">
            {targets.length} hit{targets.length === 1 ? "" : "s"}
          </span>
          <span className="font-mono text-[9px] text-zinc-600">
            {formatUpdatedAt(updatedAt)}
          </span>
        </div>
      </div>

      {targets.length === 0 ? (
        <p className="rounded border border-dashed border-zinc-800 bg-black/30 px-3 py-6 text-center font-mono text-[11px] text-zinc-500">
          No targets in the latest frame
        </p>
      ) : (
        <div className="max-h-40 overflow-auto rounded border border-zinc-800/80">
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 bg-zinc-950/95 text-zinc-500">
              <tr>
                <th className="border-b border-zinc-800 px-2 py-1.5 text-left font-semibold uppercase tracking-wider">
                  #
                </th>
                <th className="border-b border-zinc-800 px-2 py-1.5 text-right font-semibold uppercase tracking-wider">
                  X
                </th>
                <th className="border-b border-zinc-800 px-2 py-1.5 text-right font-semibold uppercase tracking-wider">
                  Y
                </th>
                <th className="border-b border-zinc-800 px-2 py-1.5 text-right font-semibold uppercase tracking-wider">
                  Conf
                </th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t, i) => (
                <tr
                  key={`${i}-${t.x}-${t.y}-${t.conf}`}
                  className="border-b border-zinc-900/80 text-zinc-300 last:border-0 odd:bg-black/20"
                >
                  <td className="px-2 py-1.5 text-zinc-500">{i + 1}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-cyan-300/90">
                    {formatCoord(t.x)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-cyan-300/90">
                    {formatCoord(t.y)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-emerald-300/90">
                    {formatConf(t.conf)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
