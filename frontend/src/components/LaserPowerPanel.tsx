"use client";

import { Crosshair, Skull, Zap, ZapOff } from "lucide-react";

type Props = {
  armed: boolean;
  onArmedChange: (armed: boolean) => void;
  power: number;
  onPowerChange: (power: number) => void;
  /** Tighter layout when embedded in the robot control column */
  compact?: boolean;
};

function clampPower(n: number) {
  return Math.round(Math.min(100, Math.max(0, n)));
}

export function LaserPowerPanel({
  armed,
  onArmedChange,
  power,
  onPowerChange,
  compact,
}: Props) {
  const displayPower = clampPower(power);

  return (
    <div
      className={`rounded-lg border bg-gradient-to-b from-zinc-950/80 to-black/50 transition-colors ${
        armed
          ? "border-rose-700/70 shadow-[0_0_12px_rgba(225,29,72,0.15)]"
          : "border-rose-950/50"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-200">
              <Zap className="h-3.5 w-3.5 text-rose-400" aria-hidden />
              Laser power
            </h3>
            {armed ? (
              <span className="rounded border border-rose-800/60 bg-rose-950/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-rose-300">
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
            {armed
              ? `Publishing L${displayPower} @ 10 Hz`
              : "Arm to stream L0–L100"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <label className="flex cursor-pointer items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
              Arm
            </span>
            <span className="relative inline-flex h-5 w-9 items-center">
              <input
                type="checkbox"
                checked={armed}
                onChange={(e) => onArmedChange(e.target.checked)}
                className="peer sr-only"
                aria-label="Arm laser — enables continuous L power publishing"
              />
              <span
                className="absolute inset-0 rounded-full border border-zinc-600 bg-zinc-800 transition peer-checked:border-rose-700 peer-checked:bg-rose-950 peer-focus-visible:ring-1 peer-focus-visible:ring-rose-500/50"
                aria-hidden
              />
              <span
                className="relative ml-0.5 h-3.5 w-3.5 rounded-full bg-zinc-400 shadow transition peer-checked:translate-x-4 peer-checked:bg-rose-400"
                aria-hidden
              />
            </span>
          </label>
          <span className="digital-readout rounded border border-rose-900/40 bg-black/50 px-2 py-0.5 font-mono text-sm font-medium text-rose-300 tabular-nums">
            {displayPower}%
          </span>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="sr-only">Laser power slider</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={displayPower}
          onChange={(e) => onPowerChange(clampPower(Number(e.target.value)))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-rose-500 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-rose-400 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-400"
          style={{
            background: `linear-gradient(to right, rgb(225 29 72) 0%, rgb(225 29 72) ${displayPower}%, rgb(39 39 42) ${displayPower}%, rgb(39 39 42) 100%)`,
          }}
        />
        <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-wider text-zinc-600">
          <span>0%</span>
          <span>100%</span>
        </div>
      </label>

      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"}`}>
        <button
          type="button"
          onClick={() => onPowerChange(10)}
          className="flex h-10 items-center justify-center gap-1.5 rounded border border-amber-900/50 bg-gradient-to-b from-amber-900/40 to-amber-950/60 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-200 transition hover:from-amber-800/50 hover:to-amber-900/70"
        >
          <Crosshair className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Target (10%)
        </button>
        <button
          type="button"
          onClick={() => onPowerChange(100)}
          className="flex h-10 items-center justify-center gap-1.5 rounded border border-rose-800/60 bg-gradient-to-b from-rose-800/50 to-rose-950/80 font-mono text-[10px] font-semibold uppercase tracking-wider text-rose-100 transition hover:from-rose-700/60 hover:to-rose-900/90"
        >
          <Skull className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Eradicate (100%)
        </button>
        <button
          type="button"
          onClick={() => {
            onArmedChange(false);
            onPowerChange(0);
          }}
          className={`flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-600 bg-gradient-to-b from-red-700 to-red-950 font-mono font-bold uppercase tracking-widest text-white shadow-[0_3px_0_rgb(127,29,29),inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:from-red-600 hover:to-red-900 active:translate-y-0.5 active:shadow-[0_1px_0_rgb(127,29,29)] ${
            compact ? "col-span-1 h-12 text-[10px]" : "col-span-1 h-11 text-[10px] sm:col-span-3 sm:h-12 sm:text-xs"
          }`}
        >
          <ZapOff className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          LASER OFF (0%)
        </button>
      </div>
    </div>
  );
}
