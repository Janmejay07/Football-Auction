"use client";

import { useEffect, useRef } from "react";
import { useAuctionStore } from "@/store/auctionStore";
import { playAuctionSound } from "@/hooks/useSound";

/**
 * Hook to drive the auction countdown tick when enabled.
 */
export function useAuctionTimer(enabled: boolean = true) {
  const tick = useAuctionStore((s) => s.tick);
  const simulationActive = useAuctionStore((s) => s.simulationActive);
  const isPaused = useAuctionStore((s) => s.isPaused);
  const auctionStatus = useAuctionStore((s) => s.auctionStatus);

  useEffect(() => {
    if (!enabled || !simulationActive || isPaused || auctionStatus !== "live") return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [enabled, tick, simulationActive, isPaused, auctionStatus]);
}

/** Isolated ticker component — does not subscribe to bid/player state. */
export function AuctionTicker() {
  useAuctionTimer(true);
  return null;
}

export function CountdownSoundWatcher() {
  const timeRemaining = useAuctionStore((s) => s.timeRemaining);
  const auctionStatus = useAuctionStore((s) => s.auctionStatus);
  const prev = useRef(timeRemaining);

  useEffect(() => {
    if (auctionStatus === "live" && timeRemaining <= 3 && timeRemaining > 0 && timeRemaining !== prev.current) {
      playAuctionSound("countdown");
    }
    prev.current = timeRemaining;
  }, [timeRemaining, auctionStatus]);

  return null;
}
