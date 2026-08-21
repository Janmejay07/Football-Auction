"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel } from "lucide-react";
import type { Bid } from "@/types/bid";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

export const BidHistory = memo(function BidHistory({ bids }: { bids: Bid[] }) {
  const now = Date.now();

  return (
    <div className="glass-panel flex h-full flex-col rounded-xl overflow-hidden">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="font-display text-lg tracking-wide">Live Bids</h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin">
        <AnimatePresence initial={false}>
          {bids.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-[var(--muted)]">
              Waiting for first bid…
            </p>
          )}
          {bids.map((bid, index) => (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {index === 0 && <Gavel className="h-4 w-4 text-[var(--accent)]" />}
                <div>
                  <p className="font-display text-xl leading-none">
                    {formatCurrency(bid.amount)}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{bid.teamName}</p>
                </div>
              </div>
              <span className="text-[10px] text-[var(--muted)]">
                {formatRelativeTime(Math.floor((now - bid.timestamp) / 1000))}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});
