"use client";

import { useAuctionStore } from "@/store/auctionStore";
import { playAuctionSound } from "@/hooks/useSound";
import { toast } from "sonner";

export function useCamera(participantId?: string) {
  const toggleCamera = useAuctionStore((s) => s.toggleCamera);
  const participant = useAuctionStore((s) =>
    s.participants.find((p) => p.id === participantId)
  );

  const toggle = () => {
    if (!participantId) return;
    toggleCamera(participantId);
    const nextOn = !participant?.isCameraOn;
    toast.success(nextOn ? "Camera enabled" : "Camera off");
    playAuctionSound("notification");
  };

  return { isOn: participant?.isCameraOn ?? false, toggle };
}
