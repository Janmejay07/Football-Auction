"use client";

import { memo, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Participant } from "@/types/auction";
import { formatCurrency } from "@/lib/utils";
import { useMediaStore } from "@/store/mediaStore";
import { useAuthStore } from "@/store/authStore";

interface ParticipantVideoCardProps {
  participant: Participant;
  large?: boolean;
  className?: string;
}

export const ParticipantVideoCard = memo(function ParticipantVideoCard({
  participant,
  large,
  className,
}: ParticipantVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const myId = useAuthStore((s) => s.user?.id);
  const localStream = useMediaStore((s) => s.localStream);
  const remoteStream = useMediaStore((s) => s.remoteStreams[participant.userId]);
  const stream =
    participant.userId === myId ? localStream : remoteStream ?? null;
  const showVideo = Boolean(
    stream?.getVideoTracks().some(
      (track) => track.readyState === "live" && track.enabled
    )
  );
  const isMe = participant.userId === myId;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    el.muted = isMe;
    if (stream) void el.play().catch(() => undefined);
  }, [stream, isMe]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-[#0a1220]",
        participant.isSpeaking && "ring-2 ring-[var(--accent)]",
        participant.lastBidAmount && "ring-2 ring-[var(--warning)]",
        large ? "aspect-video min-h-[160px]" : "aspect-[4/3] min-w-[140px]",
        className
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMe}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          showVideo ? "opacity-100" : "opacity-0"
        )}
      />
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0c1a2e] to-[#05070b]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 font-display text-2xl">
            {participant.name.slice(0, 1)}
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      <div className="absolute left-2 top-2 flex gap-1">
        {participant.isHost && (
          <Badge variant="accent" className="gap-1">
            <Gavel className="h-3 w-3" /> Host
          </Badge>
        )}
        {participant.isSpeaking && <Badge variant="success">Speaking</Badge>}
        {participant.lastBidAmount != null && (
          <Badge variant="warning">
            <Gavel className="h-3 w-3" /> {formatCurrency(participant.lastBidAmount)}
          </Badge>
        )}
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{participant.name}</p>
          <p className="truncate text-[10px] uppercase tracking-wider text-[var(--muted)]">
            {participant.teamName ?? "Spectator"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {participant.isMicOn ? (
            <Mic className="h-3.5 w-3.5 text-[var(--success)]" />
          ) : (
            <MicOff className="h-3.5 w-3.5 text-[var(--muted)]" />
          )}
          {participant.isCameraOn ? (
            <Video className="h-3.5 w-3.5 text-[var(--success)]" />
          ) : (
            <VideoOff className="h-3.5 w-3.5 text-[var(--muted)]" />
          )}
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              participant.isConnected ? "bg-[var(--success)]" : "bg-[var(--destructive)]"
            )}
          />
        </div>
      </div>
    </div>
  );
});
