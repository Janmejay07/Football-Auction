"use client";

import { useRouter } from "next/navigation";
import {
  Pause,
  Play,
  Gavel,
  SkipForward,
  SkipBack,
  Ban,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuctionStore } from "@/store/auctionStore";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { toast } from "sonner";

export function AuctionControls({ isHost }: { isHost: boolean }) {
  const router = useRouter();
  const {
    pauseAuction,
    resumeAuction,
    cancelAuction,
    sellPlayer,
    markUnsold,
    nextPlayer,
    previousPlayer,
    nextBucket,
    previousBucket,
    isPaused,
    auctionStatus,
    auction,
  } = useAuctionStore();
  const user = useAuthStore((s) => s.user);
  const openConfirm = useUiStore((s) => s.openConfirm);
  const paused = isPaused || auctionStatus === "paused";
  const ended = auctionStatus === "cancelled" || auctionStatus === "completed";

  const onPause = () => {
    pauseAuction(user?.fullName);
    toast("Auction paused");
  };

  const onResume = () => {
    resumeAuction(user?.fullName);
    toast("Auction resumed");
  };

  const onCancel = () => {
    cancelAuction(user?.fullName);
    toast.success("Auction cancelled");
    router.push(`/auction/${auction.id}/results`);
  };

  return (
    <div className="glass-panel rounded-xl p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {isHost ? "Auctioneer Controls" : "Room Controls"}
      </p>
      <div className="flex flex-wrap gap-2">
        {paused ? (
          <Button size="sm" onClick={onResume} disabled={ended}>
            <Play className="h-3.5 w-3.5" /> Resume
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onPause} disabled={ended}>
            <Pause className="h-3.5 w-3.5" /> Pause
          </Button>
        )}
        {isHost && (
          <>
            <Button
              size="sm"
              disabled={ended}
              onClick={() =>
                openConfirm({
                  title: "Sell Player",
                  description: "Confirm sale to the current highest bidder?",
                  confirmLabel: "Sold",
                  onConfirm: () => {
                    sellPlayer();
                    toast.success("Player sold");
                  },
                })
              }
            >
              <Gavel className="h-3.5 w-3.5" /> Sold
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={ended}
              onClick={() =>
                openConfirm({
                  title: "Mark Unsold",
                  description: "Move this player to the unsold list?",
                  confirmLabel: "Unsold",
                  onConfirm: markUnsold,
                })
              }
            >
              <Ban className="h-3.5 w-3.5" /> Unsold
            </Button>
            <Button size="sm" variant="outline" onClick={previousPlayer} disabled={ended}>
              <SkipBack className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button size="sm" variant="outline" onClick={nextPlayer} disabled={ended}>
              <SkipForward className="h-3.5 w-3.5" /> Next
            </Button>
            <Button size="sm" variant="ghost" onClick={previousBucket} disabled={ended}>
              <ChevronLeft className="h-3.5 w-3.5" /> Bucket
            </Button>
            <Button size="sm" variant="ghost" onClick={nextBucket} disabled={ended}>
              Bucket <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={auctionStatus === "cancelled"}
              onClick={() =>
                openConfirm({
                  title: "Cancel Auction",
                  description: "This will end the auction for everyone. This cannot be undone.",
                  confirmLabel: "Cancel Auction",
                  onConfirm: onCancel,
                })
              }
            >
              Cancel Auction
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
