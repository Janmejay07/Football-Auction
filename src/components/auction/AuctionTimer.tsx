"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuctionTimerProps {
  seconds: number;
  dangerThreshold?: number;
}

export const AuctionTimer = memo(function AuctionTimer({
  seconds,
  dangerThreshold = 3,
}: AuctionTimerProps) {
  const danger = seconds <= dangerThreshold;

  return (
    <motion.div
      key={seconds}
      initial={{ scale: danger ? 1.12 : 1.04, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("text-center", danger && "timer-danger")}
    >
      <div
        className={cn(
          "font-display text-7xl leading-none md:text-8xl",
          danger ? "text-[var(--live)]" : "text-foreground"
        )}
      >
        {String(seconds).padStart(2, "0")}
      </div>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
        Seconds
      </p>
    </motion.div>
  );
});
