/**
 * WHEP (WebRTC-HTTP Egress Protocol) client for MediaMTX and compatible servers.
 * POST SDP offer → receive SDP answer, attach remote track to <video>.
 */

function waitIceGatheringComplete(
  pc: RTCPeerConnection,
  timeoutMs: number,
): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    const timer = window.setTimeout(done, timeoutMs);
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export type WhepConnectOptions = {
  /** Full WHEP URL, e.g. http://10.42.0.69:8889/realsense/whep */
  whepUrl: string;
  video: HTMLVideoElement;
  iceServers?: RTCIceServer[];
  signal?: AbortSignal;
};

/**
 * Establishes WebRTC playback via WHEP. Returns cleanup (close PC, clear video).
 */
export async function connectWhep(
  opts: WhepConnectOptions,
): Promise<() => void> {
  const { whepUrl, video, iceServers = DEFAULT_ICE_SERVERS, signal } = opts;

  const pc = new RTCPeerConnection({ iceServers });

  pc.addTransceiver("video", { direction: "recvonly" });

  const streamCleanup = () => {
    video.srcObject = null;
  };

  pc.ontrack = (ev) => {
    const [stream] = ev.streams;
    if (stream) {
      video.srcObject = stream;
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitIceGatheringComplete(pc, 2500);

  const sdp = pc.localDescription?.sdp;
  if (!sdp) {
    pc.close();
    throw new Error("Missing local SDP after offer");
  }

  const res = await fetch(whepUrl, {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: sdp,
    mode: "cors",
    signal,
  });

  const answerText = await res.text();
  if (!res.ok) {
    pc.close();
    throw new Error(
      `WHEP ${res.status}: ${answerText.slice(0, 400) || res.statusText}`,
    );
  }

  try {
    await pc.setRemoteDescription({ type: "answer", sdp: answerText });
  } catch (e) {
    streamCleanup();
    pc.close();
    throw e;
  }

  return () => {
    streamCleanup();
    pc.close();
  };
}
