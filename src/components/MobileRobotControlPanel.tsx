"use client";

export function MobileRobotControlPanel() {
  return (
    <div className="flex min-h-[180px] flex-col rounded-lg border border-zinc-700/80 bg-zinc-900/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-4 border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
          Mobile robot control
        </h2>
        <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
          Base motion controls
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3">
        <button
          type="button"
          className="flex h-12 items-center justify-center rounded border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100 shadow-md transition hover:from-zinc-600 hover:to-zinc-800"
        >
          Forward
        </button>
        <button
          type="button"
          className="flex h-12 items-center justify-center rounded border border-zinc-600 bg-gradient-to-b from-zinc-700 to-zinc-900 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100 shadow-md transition hover:from-zinc-600 hover:to-zinc-800"
        >
          Backward
        </button>
      </div>
    </div>
  );
}
