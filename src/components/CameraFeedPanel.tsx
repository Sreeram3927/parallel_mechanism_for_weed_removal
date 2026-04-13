"use client";

import { Maximize2, Minimize2, Radio, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function CameraFeedPanel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const sync = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFs(true);
      } else {
        await document.exitFullscreen();
        setIsFs(false);
      }
    } catch {
      setIsFs(!!document.fullscreenElement);
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:min-h-0"
    >
      <div className="station-scanlines relative flex flex-1 items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.06)_0%,_transparent_65%)]" />
        <div className="relative z-[1] flex flex-col items-center gap-3 text-zinc-500">
          <Video className="h-14 w-14 opacity-40" strokeWidth={1.25} />
          <div className="text-center font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">
            Intel RealSense
            <br />
            <span className="text-zinc-500">MTX stream placeholder</span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute left-3 top-3 z-[2] flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded border border-red-900/60 bg-red-950/90 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Live
          </span>
        </div>

        <div className="absolute right-3 top-3 z-[2] flex gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded border border-zinc-600/80 bg-zinc-950/90 text-zinc-300 shadow-md transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white"
            aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFs ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[2] flex items-end justify-between gap-2 font-mono text-[10px] text-zinc-500">
          <span className="flex items-center gap-1 opacity-80">
            <Radio className="h-3 w-3 text-cyan-500/80" />
            Ch.0 RGB · 1280×720
          </span>
          <span className="tabular-nums opacity-70">— fps</span>
        </div>
      </div>
    </div>
  );
}
