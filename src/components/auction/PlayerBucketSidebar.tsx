"use client";

import { Check, Circle, ArrowRight } from "lucide-react";
import Image from "next/image";
import { cn, formatCurrency } from "@/lib/utils";
import type { PlayerBucket } from "@/types/auction";
import type { Player } from "@/types/player";

export function PlayerBucketSidebar({
  buckets,
  currentIndex,
  queue,
  progressLabel,
}: {
  buckets: PlayerBucket[];
  currentIndex: number;
  queue: Player[];
  progressLabel: string;
}) {
  return (
    <aside className="glass-panel flex h-full flex-col rounded-xl p-4">
      <h3 className="font-display text-lg tracking-wide">Player Buckets</h3>
      <p className="mb-4 text-xs text-[var(--muted)]">{progressLabel}</p>

      <ul className="space-y-2">
        {buckets.map((bucket, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          return (
            <li
              key={bucket.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
                current && "bg-[var(--accent-dim)] text-[var(--accent)]",
                done && "text-[var(--muted)]"
              )}
            >
              {done ? (
                <Check className="h-4 w-4 text-[var(--success)]" />
              ) : current ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-[var(--muted)]" />
              )}
              <span className="font-semibold uppercase tracking-wide">{bucket.name}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 border-t border-white/10 pt-4">
        <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Up Next
        </h4>
        <ul className="space-y-2">
          {queue.length === 0 && (
            <li className="text-xs text-[var(--muted)]">No more in this bucket</li>
          )}
          {queue.map((player, i) => (
            <li key={player.id} className="flex items-center gap-2">
              <span className="w-4 text-xs text-[var(--muted)]">{i + 1}.</span>
              <Image
                src={player.image}
                alt=""
                width={28}
                height={28}
                className="rounded-md"
                unoptimized
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{player.name}</p>
                <p className="text-[10px] text-[var(--muted)]">
                  {player.position} · {formatCurrency(player.basePrice)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
