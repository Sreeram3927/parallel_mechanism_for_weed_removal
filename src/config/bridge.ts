/**
 * Bridge / video URLs (NEXT_PUBLIC_* are inlined at build time).
 *
 * Mock WebSocket: set NEXT_PUBLIC_USE_MOCK_WS=true (see .env.example).
 */

function envBool(name: string): boolean {
  const v = process.env[name]?.toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes";
}

/** When true, telemetry/logs/commands use local simulation; no connection to :8765. */
export const USE_MOCK_WS = envBool("NEXT_PUBLIC_USE_MOCK_WS");

export const ROBOT_WS_URL =
  process.env.NEXT_PUBLIC_ROBOT_WS_URL ?? "ws://10.42.0.69:8765";

/** Shown in UI; browsers cannot play RTSP — use HLS (or WebRTC) from your MTX server. */
export const REALSENSE_RTSP_URL =
  process.env.NEXT_PUBLIC_REALSENSE_RTSP ??
  "rtsp://10.42.0.69:8554/realsense";

const hlsRaw = process.env.NEXT_PUBLIC_REALSENSE_HLS?.trim();

/**
 * HLS playlist URL for <video> (e.g. MediaMTX: http://HOST:8888/realsense/index.m3u8).
 * Set NEXT_PUBLIC_REALSENSE_HLS=off to skip playback and show the placeholder only.
 */
export const REALSENSE_HLS_URL: string | null =
  hlsRaw && (hlsRaw === "off" || hlsRaw === "disabled")
    ? null
    : (hlsRaw || "http://10.42.0.69:8888/realsense/index.m3u8");
