"use client";

import Link from "next/link";
import { Volume2, VolumeX, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuctionStore } from "@/store/auctionStore";
import { useUiStore } from "@/store/uiStore";

export function AuctionHeader({ auctionId }: { auctionId: string }) {
  const auction = useAuctionStore((s) => s.auction);
  const status = useAuctionStore((s) => s.auctionStatus);
  const bucketIndex = useAuctionStore((s) => s.currentBucketIndex);
  const soundEnabled = useUiStore((s) => s.soundEnabled);
  const toggleSound = useUiStore((s) => s.toggleSound);
  const buckets = useAuctionStore((s) => s.getEnabledBuckets());

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={`/auction/${auctionId}/lobby`} className="shrink-0 font-display text-lg text-[var(--accent)]">
          ⚽ {auction.name}
        </Link>
        <span className="hidden text-xs uppercase tracking-[0.2em] text-[var(--muted)] sm:inline">
          Round {bucketIndex + 1}
          {buckets[bucketIndex] ? ` · ${buckets[bucketIndex].name}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {status === "live" && (
          <Badge variant="live" className="live-pulse">
            <Radio className="h-3 w-3" /> Live
          </Badge>
        )}
        {status === "paused" && <Badge variant="warning">Paused</Badge>}
        <span className="hidden font-mono text-xs text-[var(--accent)] sm:inline">
          {auction.roomCode}
        </span>
        <Button
          variant="ghost"
          size="icon"
          title={soundEnabled ? "Sound on" : "Sound off"}
          onClick={toggleSound}
          aria-label={soundEnabled ? "Mute sounds" : "Unmute sounds"}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
