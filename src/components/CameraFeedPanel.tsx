"use client";

import { AlertCircle, Maximize2, Minimize2, Radio, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  /** Browser HLS URL (e.g. MediaMTX). RTSP cannot play in HTML5 video. */
  hlsUrl: string | null;
  /** Shown in UI and if HLS fails (reference for VLC / debugging). */
  rtspUrl: string;
};

export function CameraFeedPanel({ hlsUrl, rtspUrl }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFs, setIsFs] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const sync = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  useEffect(() => {
    setStreamError(null);
    setIsPlaying(false);
    const video = videoRef.current;
    if (!hlsUrl || !video) return;

    let cancelled = false;
    let hls: InstanceType<typeof import("hls.js").default> | null = null;

    const cleanupVideo = () => {
      if (hls) {
        hls.destroy();
        hls = null;
      }
      video.removeAttribute("src");
      video.load();
    };

    import("hls.js")
      .then(({ default: Hls }) => {
        if (cancelled) return;

        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
          });
          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_event: string, data: import("hls.js").ErrorData) => {
            if (data.fatal) {
              setStreamError(
                data.type === "networkError"
                  ? "HLS network error — check MTX / firewall / CORS"
                  : "HLS playback error",
              );
              if (data.type === "networkError") hls?.startLoad();
              else if (data.type === "mediaError") hls?.recoverMediaError();
            }
          });
        } else if (
          video.canPlayType("application/vnd.apple.mpegurl") ||
          video.canPlayType("application/x-mpegURL")
        ) {
          video.src = hlsUrl;
        } else {
          setStreamError("HLS not supported in this browser");
        }
      })
      .catch(() => {
        if (!cancelled) setStreamError("Failed to load HLS player");
      });

    return () => {
      cancelled = true;
      cleanupVideo();
    };
  }, [hlsUrl]);

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

  const showVideo = Boolean(hlsUrl) && !streamError;
  const showLive = showVideo && isPlaying;

  return (
    <div
      ref={wrapRef}
      className="relative flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:min-h-0"
    >
      <div className="station-scanlines relative flex flex-1 items-center justify-center bg-black">
        {showVideo ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-contain"
            autoPlay
            muted
            playsInline
            controls={false}
            onPlaying={() => setIsPlaying(true)}
            onWaiting={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.06)_0%,_transparent_65%)]" />

        {!showVideo || streamError ? (
          <div className="relative z-[1] flex max-w-md flex-col items-center gap-3 px-6 text-center text-zinc-500">
            <Video className="h-14 w-14 opacity-40" strokeWidth={1.25} />
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">
              Intel RealSense
            </div>
            {!hlsUrl ? (
              <p className="font-mono text-[11px] leading-relaxed text-zinc-500">
                HLS playback disabled (
                <code className="text-zinc-400">NEXT_PUBLIC_REALSENSE_HLS=off</code>
                ). RTSP reference:{" "}
                <span className="break-all text-zinc-400">{rtspUrl}</span>
              </p>
            ) : streamError ? (
              <p className="flex items-start gap-2 font-mono text-[11px] leading-relaxed text-amber-400/90">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {streamError}. RTSP (not playable in browser):{" "}
                  <span className="break-all text-zinc-400">{rtspUrl}</span>
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute left-3 top-3 z-[2] flex items-center gap-2">
          {showLive ? (
            <span className="flex items-center gap-1.5 rounded border border-red-900/60 bg-red-950/90 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Live
            </span>
          ) : showVideo ? (
            <span className="rounded border border-zinc-700 bg-zinc-950/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Buffering…
            </span>
          ) : (
            <span className="rounded border border-zinc-700 bg-zinc-950/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Standby
            </span>
          )}
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
          <span className="flex min-w-0 flex-1 items-center gap-1 opacity-80">
            <Radio className="h-3 w-3 shrink-0 text-cyan-500/80" />
            <span className="truncate">
              {hlsUrl ? "HLS preview" : "No stream"} ·{" "}
              <span className="break-all text-zinc-600">{rtspUrl}</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
