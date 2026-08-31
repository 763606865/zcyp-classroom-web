function sessionId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function extractAnswerSdp(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  if (typeof record.sdp === "string" && record.sdp) return record.sdp;
  if (Array.isArray(record.sdps) && record.sdps[0] && typeof record.sdps[0] === "object") {
    const sdp = (record.sdps[0] as { sdp?: string }).sdp;
    if (sdp) return sdp;
  }
  const receiver = record.receiverResponse as { answerSdp?: string } | undefined;
  if (receiver?.answerSdp) return receiver.answerSdp;
  return "";
}

function signalFailed(data: unknown) {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  if (typeof record.errcode === "number" && record.errcode !== 0) return true;
  if (typeof record.code === "number" && record.code !== 0 && record.code !== 200) return true;
  return false;
}

async function waitIceComplete(pc: RTCPeerConnection) {
  if (pc.iceGatheringState === "complete") return;
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 1500);
    const onChange = () => {
      if (pc.iceGatheringState !== "complete") return;
      window.clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}

async function postSignal(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`WebRTC 信令失败（${response.status}）`);
  return response.json() as Promise<unknown>;
}

async function negotiate(pc: RTCPeerConnection, streamUrl: string, host: string) {
  const offer = pc.localDescription?.sdp;
  if (!offer) throw new Error("WebRTC offer 为空");
  const sid = sessionId();
  const attempts: Array<() => Promise<unknown>> = [
    () => postSignal(`https://${host}/webrtc/v1/pullstream`, {
      streamurl: streamUrl,
      sessionid: sid,
      clientinfo: navigator.userAgent,
      sdps: [{ sdp: offer, sdpindex: 0 }],
    }),
    () => postSignal(`https://${host}/webrtc/v2/pullstream`, {
      receiverRequest: { offerSdp: offer, streamUrl },
    }),
    () => postSignal(`https://${host}/rtc/v1/play/`, {
      api: `https://${host}/rtc/v1/play/`,
      streamurl: streamUrl,
      sdp: offer,
      tid: sid.slice(0, 16),
    }),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const data = await attempt();
      if (signalFailed(data)) {
        lastError = new Error("WebRTC 信令返回错误");
        continue;
      }
      const sdp = extractAnswerSdp(data);
      if (sdp) return sdp;
      lastError = new Error("WebRTC 信令未返回 SDP");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("WebRTC 协商失败");
}

export async function playTencentWebrtc(video: HTMLVideoElement, streamUrl: string) {
  const parsed = new URL(streamUrl.replace(/^webrtc:\/\//i, "https://"));
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.addTransceiver("audio", { direction: "recvonly" });
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) video.srcObject = stream;
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitIceComplete(pc);

  const answer = await negotiate(pc, streamUrl, parsed.host);
  await pc.setRemoteDescription({ type: "answer", sdp: answer });

  return () => {
    pc.getReceivers().forEach((receiver) => receiver.track.stop());
    pc.close();
    video.srcObject = null;
  };
}
