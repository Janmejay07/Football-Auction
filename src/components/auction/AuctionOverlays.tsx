"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gavel } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import type { Player } from "@/types/player";
import { Button } from "@/components/ui/button";

export function SoldOverlay({
  open,
  player,
  price,
  teamName,
  onContinue,
}: {
  open: boolean;
  player?: Player;
  price?: number;
  teamName?: string;
  onContinue?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && player && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
          >
            <motion.div
              initial={{ rotate: -20, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              className="mb-4 flex justify-center"
            >
              <Gavel className="h-16 w-16 text-[var(--accent)]" />
            </motion.div>
            <p className="font-display text-6xl text-[var(--accent)] md:text-8xl">Sold!</p>
            <div className="relative mx-auto mt-6 h-40 w-32 overflow-hidden rounded-xl">
              <Image src={player.image} alt={player.name} fill className="object-cover" unoptimized />
            </div>
            <h3 className="font-display mt-4 text-4xl md:text-5xl">{player.name}</h3>
            <p className="mt-2 font-display text-3xl text-[var(--accent)]">
              {formatCurrency(price ?? 0)}
            </p>
            <p className="mt-1 text-lg uppercase tracking-widest text-[var(--muted)]">
              {teamName}
            </p>
            <p className="mt-4 text-sm font-semibold text-[var(--success)]">
              ✓ Added to {teamName} Squad
            </p>
            {onContinue && (
              <Button className="mt-6" onClick={onContinue}>
                Next Player →
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function UnsoldOverlay({
  open,
  player,
  onContinue,
}: {
  open: boolean;
  player?: Player;
  onContinue: () => void;
}) {
  return (
    <AnimatePresence>
      {open && player && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="glass-panel max-w-md rounded-2xl p-8 text-center">
            <p className="font-display text-5xl text-[var(--warning)]">Unsold</p>
            <p className="mt-2 text-sm text-[var(--muted)]">No bids received.</p>
            <p className="mt-4 font-display text-3xl">{player.name}</p>
            <Button className="mt-6" onClick={onContinue}>
              Continue
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BucketTransitionOverlay({
  open,
  from,
  to,
}: {
  open: boolean;
  from?: string;
  to?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <p className="font-display text-4xl text-[var(--muted)] md:text-5xl">
              {from} Complete
            </p>
            <motion.p
              className="mt-4 font-display text-6xl text-[var(--accent)] md:text-8xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              {to}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
