"use client";

import { useAuctionStore } from "@/store/auctionStore";
import { playAuctionSound } from "@/hooks/useSound";
import { toast } from "sonner";

export function useMicrophone(participantId?: string) {
  const toggleMic = useAuctionStore((s) => s.toggleMic);
  const participant = useAuctionStore((s) =>
    s.participants.find((p) => p.id === participantId)
  );

  const toggle = () => {
    if (!participantId) return;
    toggleMic(participantId);
    const nextOn = !participant?.isMicOn;
    toast.success(nextOn ? "Microphone enabled" : "Microphone muted");
    playAuctionSound("notification");
  };

  return { isOn: participant?.isMicOn ?? false, toggle };
}
