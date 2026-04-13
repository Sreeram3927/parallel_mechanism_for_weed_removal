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

/** Shown in UI; browsers cannot play RTSP directly — use WebRTC (WHEP) below. */
export const REALSENSE_RTSP_URL =
  process.env.NEXT_PUBLIC_REALSENSE_RTSP ??
  "rtsp://10.42.0.69:8554/realsense";

const whepRaw = process.env.NEXT_PUBLIC_REALSENSE_WHEP?.trim();

/**
 * MediaMTX WHEP read URL (WebRTC in the browser).
 * Default: HTTP WebRTC port 8889 + path segment + /whep
 * Set NEXT_PUBLIC_REALSENSE_WHEP=off to disable video and show the placeholder only.
 */
export const REALSENSE_WHEP_URL: string | null =
  whepRaw && (whepRaw === "off" || whepRaw === "disabled")
    ? null
    : (whepRaw || "http://10.42.0.69:8889/realsense/whep");
