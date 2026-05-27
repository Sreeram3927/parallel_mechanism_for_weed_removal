"use client";

import { useEffect, useRef } from "react";
import type { LogEntry, LogLevel } from "@/types/logs";
import { logLevelClass } from "@/lib/logColors";

type Props = {
  logs: LogEntry[];
  showDebug: boolean;
  showVerbose: boolean;
  onToggleDebug: (v: boolean) => void;
  onToggleVerbose: (v: boolean) => void;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const t = d.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const ms = d.getMilliseconds().toString().padStart(3, "0");
  return `${t}.${ms}`;
}

function shouldShow(
  level: LogLevel,
  showDebug: boolean,
  showVerbose: boolean,
): boolean {
  if (level === "DEBUG" && !showDebug) return false;
  if (level === "VERBOSE" && !showVerbose) return false;
  return true;
}

export function LogViewer({
  logs,
  showDebug,
  showVerbose,
  onToggleDebug,
  onToggleVerbose,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visible = logs.filter((l) => shouldShow(l.level, showDebug, showVerbose));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs, showDebug, showVerbose]);

  return (
    <div className="flex min-h-[200px] flex-1 flex-col rounded-lg border border-zinc-700/80 bg-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          System log
        </h2>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] text-zinc-500">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => onToggleDebug(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-cyan-600 focus:ring-cyan-500/40"
            />
            <span className={showDebug ? "text-zinc-300" : ""}>DEBUG</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={showVerbose}
              onChange={(e) => onToggleVerbose(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-cyan-600 focus:ring-cyan-500/40"
            />
            <span className={showVerbose ? "text-zinc-300" : ""}>VERBOSE</span>
          </label>
        </div>
      </div>

      <div className="station-scanlines relative flex-1 overflow-hidden rounded-b-lg">
        <div className="relative max-h-[280px] min-h-[180px] overflow-y-auto overscroll-contain bg-black/70 p-3 font-mono text-[11px] leading-relaxed sm:max-h-[320px]">
          {visible.length === 0 ? (
            <p className="text-zinc-600">No log lines match the current filters.</p>
          ) : (
            <ul className="space-y-0.5">
              {visible.map((line) => (
                <li key={line.id} className="flex flex-wrap gap-x-2 break-all">
                  <span className="shrink-0 text-zinc-600 tabular-nums">
                    [{formatTime(line.ts)}]
                  </span>
                  <span
                    className={`shrink-0 font-semibold uppercase ${logLevelClass(line.level)}`}
                  >
                    {line.level}
                  </span>
                  <span className="text-zinc-500">{line.source}</span>
                  <span className="min-w-0 text-zinc-300">{line.message}</span>
                </li>
              ))}
            </ul>
          )}
          <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
        </div>
      </div>
    </div>
  );
}
