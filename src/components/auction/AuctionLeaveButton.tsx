"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { auctionService } from "@/lib/services/auctionService";
import { useAuctionStore } from "@/store/auctionStore";
import { useAuthStore } from "@/store/authStore";

export function AuctionLeaveButton() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const auction = useAuctionStore((state) => state.auction);

  const leave = async () => {
    if (!user || !auction.id) return;

    const isHost = user.id === auction.hostId;
    const confirmed = window.confirm(
      isHost
        ? "Leaving as host will end this auction for everyone. Continue?"
        : "Leave this auction? You can join again while it is open."
    );
    if (!confirmed) return;

    try {
      const room = await auctionService.leaveAuction(auction.id, user.id);
      if (isHost || room.auction.status === "cancelled") {
        router.push(`/auction/${auction.id}/results`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not leave auction");
    }
  };

  if (!user || !auction.id || auction.status === "completed" || auction.status === "cancelled") {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto"
      title="Leave auction"
      onClick={() => void leave()}
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Leave Auction</span>
    </Button>
  );
}
