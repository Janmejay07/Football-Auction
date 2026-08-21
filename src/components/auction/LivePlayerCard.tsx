"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Player } from "@/types/player";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface LivePlayerCardProps {
  player: Player;
  currentBid: number;
  showMarketValue?: boolean;
  highlight?: boolean;
  onOpenProfile?: () => void;
}

export const LivePlayerCard = memo(function LivePlayerCard({
  player,
  currentBid,
  showMarketValue,
  highlight,
  onOpenProfile,
}: LivePlayerCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onOpenProfile}
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: highlight
          ? "0 0 0 2px rgba(200,245,96,0.8)"
          : "0 0 0 0 rgba(0,0,0,0)",
      }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.45 }}
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 text-left"
    >
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80"
          alt=""
          fill
          className="object-cover opacity-40"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-[#05070b]/75 to-transparent" />
      </div>

      <div className="relative grid gap-4 p-5 md:grid-cols-[200px_1fr] md:p-8">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#0c121c]">
          <Image
            src={player.image}
            alt={player.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute left-2 top-2">
            <Badge variant="accent">{player.position}</Badge>
          </div>
          <div className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 font-display text-xl text-[var(--accent)]">
            {player.rating}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {player.nationalityFlag} {player.nationality} · {player.currentClub}
          </p>
          <h2 className="font-display mt-1 text-4xl leading-none md:text-6xl lg:text-7xl">
            {player.name}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {player.position} · {player.rating} OVR · Age {player.age}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Base</p>
              <p className="font-display text-2xl md:text-3xl">
                {formatCurrency(player.basePrice)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Current Bid
              </p>
              <motion.p
                key={currentBid}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                className="font-display text-2xl text-[var(--accent)] md:text-4xl"
              >
                {formatCurrency(currentBid)}
              </motion.p>
            </div>
            {showMarketValue && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  Market
                </p>
                <p className="font-display text-2xl md:text-3xl">
                  {formatCurrency(player.marketValue)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
});
