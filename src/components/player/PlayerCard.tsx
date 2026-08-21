"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { Player } from "@/types/player";

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  showLink?: boolean;
}

export function positionBadgeColor(pos: string): string {
  switch (pos) {
    case "GK":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "CB":
    case "LB":
    case "RB":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "CDM":
    case "CM":
    case "CAM":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "LW":
    case "RW":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "ST":
    case "CF":
      return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    default:
      return "bg-white/10 text-white border-white/20";
  }
}

export function PlayerCard({ player, onClick, showLink = true }: PlayerCardProps) {
  const cardContent = (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="glass-panel group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 p-3 shadow-lg transition-colors hover:border-[var(--accent)]/50"
      onClick={onClick}
    >
      {/* Top Banner / Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#111e33] to-[#090e18]">
        <Image
          src={player.image}
          alt={player.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090e18] via-transparent to-black/30" />

        {/* Position & Rating Badges */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${positionBadgeColor(
              player.position
            )}`}
          >
            {player.position}
          </span>
        </div>

        <div className="absolute right-2.5 top-2.5 flex flex-col items-center rounded-lg border border-[var(--accent)]/30 bg-black/75 px-2 py-0.5 shadow-md">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">OVR</span>
          <span className="font-display text-xl leading-none text-[var(--accent)]">{player.rating}</span>
        </div>

        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs text-white/90">
          <span className="flex items-center gap-1 font-medium drop-shadow">
            <span>{player.nationalityFlag}</span>
            <span>{player.nationality}</span>
          </span>
          <span className="rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white/80 backdrop-blur">
            {player.currentClub}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-3 flex flex-1 flex-col justify-between space-y-2 px-1">
        <div>
          <h3 className="font-display text-xl tracking-wide text-foreground transition-colors group-hover:text-[var(--accent)]">
            {player.name}
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Age {player.age} · Bucket: <span className="capitalize">{player.bucket}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-xs">
          <div className="rounded-lg bg-white/[0.03] p-1.5">
            <span className="text-[10px] uppercase text-[var(--muted)]">Base Price</span>
            <p className="font-semibold text-white">{formatCurrency(player.basePrice)}</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-1.5">
            <span className="text-[10px] uppercase text-[var(--muted)]">Market Val</span>
            <p className="font-semibold text-[var(--accent)]">{formatCurrency(player.marketValue)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (showLink) {
    return <Link href={`/player/${player.id}`}>{cardContent}</Link>;
  }

  return cardContent;
}
