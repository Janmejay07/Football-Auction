"use client";

import { useAuctionStore } from "@/store/auctionStore";
import { useTeamStore } from "@/store/teamStore";
import { useAuthStore } from "@/store/authStore";
import { playAuctionSound } from "@/hooks/useSound";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export function useBid() {
  const user = useAuthStore((s) => s.user);
  const myTeamId = useTeamStore((s) => s.myTeamId);
  const teams = useTeamStore((s) => s.teams);
  const myTeam = teams.find((t) => t.id === myTeamId) ?? null;
  const currentBid = useAuctionStore((s) => s.currentBid);
  const highestBidder = useAuctionStore((s) => s.highestBidder);
  const minIncrement = useAuctionStore((s) => s.auction.rules.minIncrement);
  const placeBid = useAuctionStore((s) => s.placeBid);

  const nextBid = highestBidder === null ? currentBid : currentBid + minIncrement;

  const bid = async () => {
    if (!myTeam || !myTeamId) return false;
    const ok = await placeBid(myTeamId, myTeam.name, user?.id);
    if (ok) {
      playAuctionSound("bid");
      toast.success(`Bid placed: ${formatCurrency(nextBid)}`);
    } else {
      toast.error("Could not place bid");
    }
    return ok;
  };

  return { nextBid, currentBid, myTeam, myTeamId, highestBidder, bid };
}
