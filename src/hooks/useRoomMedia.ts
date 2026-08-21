"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useAuctionStore } from "@/store/auctionStore";
import { useMediaStore } from "@/store/mediaStore";
import { subscribeSignals } from "@/hooks/useRoomSync";
import { api } from "@/lib/api";
import type { RtcSignal } from "@/types/room";

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

function postSignal(
  auctionId: string,
  signal: { from: string; to: string; type: RtcSignal["type"]; payload: unknown }
) {
  return api(`/api/rooms/${auctionId}`, {
    method: "POST",
    body: JSON.stringify({ action: "signal", ...signal }),
  });
}

async function captureMedia(wantAudio: boolean, wantVideo: boolean) {
  if (!wantAudio && !wantVideo) {
    return new MediaStream();
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: wantAudio,
      video: wantVideo ? { facingMode: "user" } : false,
    });
  } catch {
    if (wantAudio && wantVideo) {
      return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
    throw new Error("media-denied");
  }
}

export function useRoomMedia(auctionId: string) {
  const user = useAuthStore((s) => s.user);
  const participants = useAuctionStore((s) => s.participants);
  const rules = useAuctionStore((s) => s.auction.rules);
  const setLocalStream = useMediaStore((s) => s.setLocalStream);
  const setRemoteStream = useMediaStore((s) => s.setRemoteStream);
  const clearRemotes = useMediaStore((s) => s.clearRemotes);
  const [mediaReady, setMediaReady] = useState(false);
  const userId = user?.id;
  const me = participants.find((p) => p.userId === userId);

  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const pendingSignalsRef = useRef<RtcSignal[]>([]);
  const makingOfferRef = useRef(new Set<string>());
  const streamRef = useRef<MediaStream | null>(null);
  const userIdRef = useRef(userId);
  const auctionIdRef = useRef(auctionId);

  useEffect(() => {
    userIdRef.current = userId;
    auctionIdRef.current = auctionId;
  }, [auctionId, userId]);

  const attachLocalTracks = (pc: RTCPeerConnection) => {
    const stream = streamRef.current;
    if (!stream) return;
    const senders = pc.getSenders();
    for (const track of stream.getTracks()) {
      const existing = senders.find((s) => s.track?.kind === track.kind);
      if (existing) void existing.replaceTrack(track);
      else pc.addTrack(track, stream);
    }
  };

  const flushIce = async (peerId: string, pc: RTCPeerConnection) => {
    const queued = pendingIceRef.current.get(peerId) ?? [];
    pendingIceRef.current.set(peerId, []);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* ignore stale candidates */
      }
    }
  };

  const getPeer = (peerId: string) => {
    const meId = userIdRef.current;
    const roomId = auctionIdRef.current;
    if (!meId || !roomId) throw new Error("not ready");

    let pc = peersRef.current.get(peerId);
    if (pc && pc.connectionState !== "closed") return pc;

    pc = new RTCPeerConnection(ICE);
    peersRef.current.set(peerId, pc);
    attachLocalTracks(pc);

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      void postSignal(roomId, {
        from: meId,
        to: peerId,
        type: "ice",
        payload: ev.candidate.toJSON(),
      });
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0] ?? new MediaStream([ev.track]);
      setRemoteStream(peerId, stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        try {
          void pc.restartIce();
        } catch {
          /* ignore */
        }
      }
    };

    return pc;
  };

  useEffect(() => {
    if (!userId || !auctionId) return;
    let stopped = false;

    const processSignals = async (signals: RtcSignal[]) => {
      const meId = userIdRef.current;
      const roomId = auctionIdRef.current;
      if (!meId || !roomId || stopped || !streamRef.current) {
        pendingSignalsRef.current.push(...signals);
        return;
      }

      const queued = [...pendingSignalsRef.current, ...signals];
      pendingSignalsRef.current = [];

      for (const signal of queued) {
        if (signal.to !== meId || signal.from === meId) continue;
        const polite = meId > signal.from;
        const pc = getPeer(signal.from);
        try {
          if (signal.type === "offer") {
            const offerCollision =
              makingOfferRef.current.has(signal.from) || pc.signalingState !== "stable";
            if (offerCollision && !polite) continue;
            if (offerCollision && polite) {
              await pc.setLocalDescription({ type: "rollback" });
            }
            await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
            await flushIce(signal.from, pc);
            attachLocalTracks(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await postSignal(roomId, {
              from: meId,
              to: signal.from,
              type: "answer",
              payload: pc.localDescription,
            });
          } else if (signal.type === "answer") {
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
              await flushIce(signal.from, pc);
            }
          } else if (signal.type === "ice") {
            const candidate = signal.payload as RTCIceCandidateInit;
            if (pc.remoteDescription) {
              await pc.addIceCandidate(candidate);
            } else {
              const queued = pendingIceRef.current.get(signal.from) ?? [];
              queued.push(candidate);
              pendingIceRef.current.set(signal.from, queued);
            }
          }
        } catch {
          /* ignore negotiation races */
        }
      }
    };

    const unsub = subscribeSignals((signals) => {
      void processSignals(signals);
    });

    (async () => {
      const insecureLan =
        typeof window !== "undefined" &&
        !window.isSecureContext &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1";
      if (insecureLan) {
        toast.error(
          "Camera and mic need HTTPS. Ask the host for the https invite link, then allow the certificate."
        );
      }
      try {
        const stream = await captureMedia(
          rules.enableVoiceChat !== false,
          rules.enableCamera !== false
        );
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.getTracks().forEach((t) => {
          t.enabled = false;
        });
        streamRef.current = stream;
        setLocalStream(stream);
        setRemoteStream(userId, stream);
        for (const pc of peersRef.current.values()) attachLocalTracks(pc);
        setMediaReady(true);
        if (pendingSignalsRef.current.length) {
          const leftover = pendingSignalsRef.current;
          pendingSignalsRef.current = [];
          void processSignals(leftover);
        }
      } catch {
        if (!stopped) {
          toast.error("Allow camera and microphone so friends can see and hear you");
        }
      }
    })();

    return () => {
      stopped = true;
      unsub();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setLocalStream(null);
      clearRemotes();
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      pendingIceRef.current.clear();
      pendingSignalsRef.current = [];
      makingOfferRef.current.clear();
      setMediaReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, userId]);

  useEffect(() => {
    if (!userId || !mediaReady || !streamRef.current) return;
    for (const p of participants) {
      if (p.userId === userId) continue;
      const shouldOffer = userId < p.userId;
      if (!shouldOffer) continue;
      if (makingOfferRef.current.has(p.userId)) continue;
      const existing = peersRef.current.get(p.userId);
      if (existing && existing.signalingState !== "stable") continue;
      makingOfferRef.current.add(p.userId);
      void (async () => {
        try {
          const pc = getPeer(p.userId);
          attachLocalTracks(pc);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await postSignal(auctionId, {
            from: userId,
            to: p.userId,
            type: "offer",
            payload: pc.localDescription,
          });
        } catch {
          makingOfferRef.current.delete(p.userId);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, userId, auctionId, mediaReady]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream || !me) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = Boolean(me.isMicOn);
    });
    stream.getVideoTracks().forEach((t) => {
      t.enabled = Boolean(me.isCameraOn);
    });
  }, [me?.isMicOn, me?.isCameraOn]);
}
