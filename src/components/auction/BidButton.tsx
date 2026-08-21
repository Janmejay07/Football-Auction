"use client";

import { memo, useMemo } from "react";
import { toast } from "sonner";
import { Check, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useAuctionStore } from "@/store/auctionStore";
import { useTeamStore } from "@/store/teamStore";
import { useAuthStore } from "@/store/authStore";

export const BidButton = memo(function BidButton() {
  const user = useAuthStore((s) => s.user);
  const myTeamId = useTeamStore((s) => s.myTeamId);
  const myTeam = useTeamStore(
    (s) => s.teams.find((t) => t.id === s.myTeamId) ?? null
  );
  const {
    currentBid,
    highestBidder,
    auction,
    auctionStatus,
    placeBid,
    isPaused,
    overlay,
  } = useAuctionStore();

  const nextBid =
    highestBidder === null ? currentBid : currentBid + auction.rules.minIncrement;

  const remaining = myTeam ? myTeam.budget - myTeam.spent : 0;
  const afterBid = remaining - nextBid;
  const isWinning = highestBidder?.teamId === myTeamId;
  const canAfford = remaining >= nextBid;
  const isSquadFull = Boolean(
    myTeam && myTeam.squad.length >= (myTeam.maxSquadSize || auction.rules.maxSquadSize || 18)
  );

  const disabled =
    !canAfford ||
    isWinning ||
    isSquadFull ||
    auctionStatus !== "live" ||
    isPaused ||
    overlay.type !== "none" ||
    !myTeamId;

  const label = useMemo(() => {
    if (!myTeamId) return "Join / Select a Team";
    if (isSquadFull) return "Squad Full";
    if (isWinning) return "You Are Winning";
    if (!canAfford) return "Insufficient Budget";
    if (overlay.type === "sold") return "Player Sold";
    if (overlay.type === "unsold") return "Player Unsold";
    if (overlay.type === "bucket") return "Next Bucket Loading...";
    return `Bid ${formatCurrency(nextBid)}`;
  }, [myTeamId, isSquadFull, isWinning, canAfford, overlay.type, nextBid]);

  const onBid = async () => {
    if (!myTeam || !myTeamId) return;
    const ok = await placeBid(myTeamId, myTeam.name, user?.id);
    if (ok) toast.success(`Bid placed: ${formatCurrency(nextBid)}`);
    else toast.error("Could not place bid");
  };

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Current Bid
          </p>
          <p className="font-display text-3xl text-[var(--accent)]">
            {formatCurrency(currentBid)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Next Bid
          </p>
          <p className="font-display text-2xl">{formatCurrency(nextBid)}</p>
        </div>
      </div>

      <Button
        variant={isWinning ? "secondary" : "bid"}
        className="w-full"
        disabled={disabled}
        onClick={onBid}
      >
        {isWinning ? <Check className="h-5 w-5" /> : <Gavel className="h-5 w-5" />}
        {label}
      </Button>

      <div className="mt-3 flex justify-between text-xs text-[var(--muted)]">
        <span>Your budget: {formatCurrency(remaining)}</span>
        <span className={afterBid < 0 ? "text-[var(--destructive)]" : ""}>
          After bid: {formatCurrency(Math.max(0, afterBid))}
        </span>
      </div>
    </div>
  );
});
