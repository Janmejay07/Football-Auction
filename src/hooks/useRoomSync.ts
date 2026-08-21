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
  useAuctionStore.getState().applySnapshot(snap);
  useChatStore.getState().setMessages(snap.messages);
  const myTeam =
    snap.teams.find((t) => t.managerId === userId) ??
    snap.teams.find((t) => t.id === useTeamStore.getState().myTeamId);
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
        const onLobby = pathname?.includes("/lobby");
        if (snap.auction.status === "live" && onLobby) {
          router.push(`/auction/${auctionId}/live`);
        }
      } catch {
        /* room may still be creating */
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), 1000);

    const pullSignals = async () => {
      if (!userId) return;
      try {
        const res = await fetch(
          `/api/rooms/${auctionId}/signals?for=${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { signals?: RtcSignal[] };
        if (cancelled || !data.signals?.length) return;
        signalListeners.forEach((fn) => fn(data.signals ?? []));
      } catch {
        /* ignore */
      }
    };
    void pullSignals();
    const signalId = window.setInterval(() => void pullSignals(), 400);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(beatId);
      window.clearInterval(signalId);
    };
  }, [auctionId, userId, pathname, router]);
}
