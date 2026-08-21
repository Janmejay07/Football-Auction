"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useAuctionStore } from "@/store/auctionStore";
import { useMediaStore } from "@/store/mediaStore";
import { subscribeSignals } from "@/hooks/useRoomSync";
import { api } from "@/lib/api";
import type { RtcSignal } from "@/types/room";

const DEFAULT_ICE: RTCConfiguration = {
  bundlePolicy: "max-bundle",
  iceCandidatePoolSize: 8,
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

type IcePayload = RTCIceCandidateInit | RTCIceCandidateInit[];

function postSignals(
  auctionId: string,
  signals: { from: string; to: string; type: RtcSignal["type"]; payload: unknown }[]
) {
  return api(`/api/rooms/${auctionId}/signals`, {
    method: "POST",
    body: JSON.stringify({ signals }),
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
  const [reconnectAt, setReconnectAt] = useState(0);
  const userId = user?.id;
  const me = participants.find((p) => p.userId === userId);

  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const pendingSignalsRef = useRef<RtcSignal[]>([]);
  const makingOfferRef = useRef(new Set<string>());
  const iceBufferRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const iceFlushRef = useRef(new Map<string, number>());
  const streamRef = useRef<MediaStream | null>(null);
  const userIdRef = useRef(userId);
  const auctionIdRef = useRef(auctionId);
  const iceRef = useRef<RTCConfiguration>(DEFAULT_ICE);
  const warnedRef = useRef(false);

  useEffect(() => {
    userIdRef.current = userId;
    auctionIdRef.current = auctionId;
  }, [auctionId, userId]);

  const flushIceBuffer = (peerId: string) => {
    const timer = iceFlushRef.current.get(peerId);
    if (timer) window.clearTimeout(timer);
    iceFlushRef.current.delete(peerId);
    const meId = userIdRef.current;
    const roomId = auctionIdRef.current;
    const queued = iceBufferRef.current.get(peerId) ?? [];
    iceBufferRef.current.set(peerId, []);
    if (!meId || !roomId || !queued.length) return;
    void postSignals(
      roomId,
      queued.map((payload) => ({
        from: meId,
        to: peerId,
        type: "ice",
        payload,
      }))
    );
  };

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

  const queueRemoteIce = async (peerId: string, pc: RTCPeerConnection) => {
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

  const dropPeer = (peerId: string, pc?: RTCPeerConnection) => {
    const current = pc ?? peersRef.current.get(peerId);
    if (current) {
      try {
        current.close();
      } catch {
        /* ignore */
      }
      if (peersRef.current.get(peerId) === current) {
        peersRef.current.delete(peerId);
      }
    }
    makingOfferRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
    flushIceBuffer(peerId);
  };

  const getPeer = (peerId: string) => {
    const meId = userIdRef.current;
    const roomId = auctionIdRef.current;
    if (!meId || !roomId) throw new Error("not ready");

    let pc = peersRef.current.get(peerId);
    if (
      pc &&
      pc.connectionState !== "closed" &&
      pc.connectionState !== "failed"
    ) {
      return pc;
    }
    if (pc) dropPeer(peerId, pc);

    pc = new RTCPeerConnection(iceRef.current);
    peersRef.current.set(peerId, pc);
    attachLocalTracks(pc);

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      const list = iceBufferRef.current.get(peerId) ?? [];
      list.push(ev.candidate.toJSON());
      iceBufferRef.current.set(peerId, list);
      const existing = iceFlushRef.current.get(peerId);
      if (existing) return;
      iceFlushRef.current.set(
        peerId,
        window.setTimeout(() => flushIceBuffer(peerId), 80)
      );
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0] ?? new MediaStream([ev.track]);
      setRemoteStream(peerId, stream);
    };

    const scheduleRetry = () => {
      window.setTimeout(() => {
        if (
          pc.connectionState === "connected" ||
          pc.connectionState === "connecting"
        ) {
          return;
        }
        dropPeer(peerId, pc);
        setReconnectAt(Date.now());
      }, 2000);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        try {
          void pc.restartIce();
        } catch {
          /* ignore */
        }
        scheduleRetry();
      }
      if (pc.connectionState === "connected") {
        warnedRef.current = false;
        makingOfferRef.current.delete(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
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
              makingOfferRef.current.has(signal.from) ||
              pc.signalingState !== "stable";
            if (offerCollision && !polite) continue;
            if (offerCollision && polite) {
              try {
                await pc.setLocalDescription({ type: "rollback" });
              } catch {
                /* Safari has no rollback */
              }
            }
            await pc.setRemoteDescription(
              signal.payload as RTCSessionDescriptionInit
            );
            await queueRemoteIce(signal.from, pc);
            attachLocalTracks(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await postSignals(roomId, [
              {
                from: meId,
                to: signal.from,
                type: "answer",
                payload: pc.localDescription,
              },
            ]);
          } else if (signal.type === "answer") {
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(
                signal.payload as RTCSessionDescriptionInit
              );
              await queueRemoteIce(signal.from, pc);
            }
          } else if (signal.type === "ice") {
            const raw = signal.payload as IcePayload;
            const candidates = Array.isArray(raw) ? raw : [raw];
            for (const candidate of candidates) {
              if (pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(candidate);
                } catch {
                  /* ignore */
                }
              } else {
                const waiting = pendingIceRef.current.get(signal.from) ?? [];
                waiting.push(candidate);
                pendingIceRef.current.set(signal.from, waiting);
              }
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
      try {
        const res = await fetch("/api/ice", { cache: "no-store" });
        const data = (await res.json()) as { iceServers?: RTCIceServer[] };
        if (data.iceServers?.length) {
          iceRef.current = {
            bundlePolicy: "max-bundle",
            iceCandidatePoolSize: 8,
            iceServers: data.iceServers,
          };
        }
      } catch {
        /* keep default STUN */
      }
      const insecureLan =
        typeof window !== "undefined" &&
        !window.isSecureContext &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1";
      if (insecureLan) {
        toast.error(
          "Camera and mic need HTTPS. Ask the host for the public invite link."
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
          toast.error(
            "Allow camera and microphone so friends can see and hear you"
          );
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
      for (const peerId of [...peersRef.current.keys()]) dropPeer(peerId);
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
      if (existing) {
        const { connectionState, iceConnectionState, signalingState } = existing;
        if (
          connectionState === "connected" ||
          connectionState === "connecting" ||
          iceConnectionState === "checking" ||
          iceConnectionState === "connected" ||
          iceConnectionState === "completed"
        ) {
          continue;
        }
        if (signalingState !== "stable") continue;
        const failed =
          connectionState === "failed" ||
          connectionState === "closed" ||
          iceConnectionState === "failed" ||
          iceConnectionState === "disconnected";
        if (!failed && connectionState !== "new") continue;
      }

      makingOfferRef.current.add(p.userId);
      void (async () => {
        try {
          const pc = getPeer(p.userId);
          attachLocalTracks(pc);
          const restart =
            existing?.iceConnectionState === "disconnected" ||
            existing?.iceConnectionState === "failed";
          const offer = await pc.createOffer(
            restart ? { iceRestart: true } : undefined
          );
          await pc.setLocalDescription(offer);
          await postSignals(auctionId, [
            {
              from: userId,
              to: p.userId,
              type: "offer",
              payload: pc.localDescription,
            },
          ]);
        } catch {
          makingOfferRef.current.delete(p.userId);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, userId, auctionId, mediaReady, reconnectAt]);

  useEffect(() => {
    if (!mediaReady) return;
    const id = window.setInterval(() => {
      let stuck = false;
      for (const [peerId, pc] of peersRef.current) {
        if (pc.connectionState === "connected") continue;
        stuck = true;
        if (
          pc.connectionState === "failed" ||
          pc.iceConnectionState === "failed"
        ) {
          dropPeer(peerId, pc);
        } else {
          makingOfferRef.current.delete(peerId);
        }
      }
      if (stuck) {
        setReconnectAt(Date.now());
        if (!warnedRef.current) {
          warnedRef.current = true;
          toast.message(
            "Still connecting camera/mic across networks. Both of you should stay on the public https invite link, allow camera/mic, and wait a few seconds for TURN relay."
          );
        }
      }
    }, 8000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaReady]);

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
