"use client";

import { useRoomSync } from "@/hooks/useRoomSync";
import { useRoomMedia } from "@/hooks/useRoomMedia";

export function AuctionRoomSync({ auctionId }: { auctionId: string }) {
  useRoomSync(auctionId);
  useRoomMedia(auctionId);
  return null;
}
