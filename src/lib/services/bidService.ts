import type { Bid, BidResult } from "@/types/bid";
import { api } from "@/lib/api";

export interface PlaceBidInput {
  auctionId: string;
  playerId: string;
  teamId: string;
  teamName: string;
  amount: number;
  userId?: string;
}

export const bidService = {
  async placeBid(input: PlaceBidInput): Promise<BidResult> {
    try {
      const data = await api<{ success: boolean; bid: Bid; error?: string }>(
        `/api/rooms/${input.auctionId}`,
        {
          method: "POST",
          body: JSON.stringify({ action: "bid", ...input }),
        }
      );
      if (!data.success || !data.bid) {
        return { success: false, error: data.error || "Bid failed" };
      }
      return { success: true, bid: data.bid };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Bid failed",
      };
    }
  },

  async getBidHistory(_auctionId: string, _playerId?: string): Promise<Bid[]> {
    void _auctionId;
    void _playerId;
    return [];
  },
};
