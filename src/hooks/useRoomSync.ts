"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAuctionStore } from "@/store/auctionStore";
import { useChatStore } from "@/store/chatStore";
import { useTeamStore } from "@/store/teamStore";
import { auctionService } from "@/lib/services/auctionService";
import type { RoomSnapshot } from "@/types/room";
import type { RtcSignal } from "@/types/room";

type SignalHandler = (signals: RtcSignal[]) => void;

const signalListeners = new Set<SignalHandler>();

export function subscribeSignals(handler: SignalHandler) {
  signalListeners.add(handler);
  return () => {
    signalListeners.delete(handler);
  };
}

function applySnapshot(snap: RoomSnapshot, userId?: string) {
  const isHost = Boolean(userId && snap.auction.hostId === userId);
  const live = snap.auction.status === "live" || snap.auction.status === "paused";

  if (isHost && live) {
    useAuctionStore.setState({
      auction: snap.auction,
      auctionStatus: snap.auction.status,
      participants: snap.participants,
      currentBid: snap.live.currentBid,
      highestBidder: snap.live.highestBidder,
      bidHistory: snap.bids.filter((b) => b.playerId === snap.live.currentPlayerId),
      isPaused: snap.live.isPaused,
      timeRemaining: snap.live.isPaused
        ? snap.live.timeRemaining
        : useAuctionStore.getState().timeRemaining,
      simulationActive:
        snap.auction.status === "live" &&
        !snap.live.isPaused &&
        snap.live.overlay.type === "none",
    });
  } else {
    useAuctionStore.getState().applySnapshot(snap);
  }

  useChatStore.getState().setMessages(snap.messages);
  const myTeam =
    snap.teams.find((t) => t.managerId === userId) ??
    snap.teams.find((t) => t.id === useTeamStore.getState().myTeamId);
  useTeamStore.getState().setTeams(snap.teams);
  if (myTeam) useTeamStore.getState().setMyTeamId(myTeam.id);
}

export function useRoomSync(auctionId: string) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const userId = user?.id;

  useEffect(() => {
    if (!auctionId) return;
    let cancelled = false;

    const beat = async () => {
      if (!userId) return;
      try {
        await auctionService.postAction(auctionId, {
          action: "presence",
          userId,
        });
      } catch {
        /* ignore */
      }
    };
    void beat();
    const beatId = window.setInterval(() => void beat(), 4000);

    const poll = async () => {
      try {
        const snap = await auctionService.getAuction(auctionId, userId);
        if (cancelled) return;
        applySnapshot(snap, userId);
        if (snap.signals.length) {
          signalListeners.forEach((fn) => fn(snap.signals));
        }
        const onLobby = pathname?.includes("/lobby");
        if (snap.auction.status === "live" && onLobby) {
          router.push(`/auction/${auctionId}/live`);
        }
      } catch {
        /* room may still be creating */
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), 700);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(beatId);
    };
  }, [auctionId, userId, pathname, router]);
}
