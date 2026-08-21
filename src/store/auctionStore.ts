"use client";

import { create } from "zustand";
import type { Auction, AuctionHistoryItem, Participant } from "@/types/auction";
import type { Bid } from "@/types/bid";
import type { Player } from "@/types/player";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";
import { bidService } from "@/lib/services/bidService";
import { auctionService } from "@/lib/services/auctionService";
import { useTeamStore } from "@/store/teamStore";
import { playAuctionSound } from "@/hooks/useSound";
import type { LiveSyncState, RoomSnapshot } from "@/types/room";

type OverlayState =
  | { type: "none" }
  | { type: "sold"; player: Player; price: number; teamName: string }
  | { type: "unsold"; player: Player }
  | { type: "bucket"; from: string; to: string };

const EMPTY_AUCTION: Auction = {
  id: "",
  roomCode: "",
  name: "",
  description: "",
  visibility: "private",
  status: "draft",
  hostId: "",
  hostName: "",
  teamCount: 0,
  startingBudget: 0,
  buckets: [],
  rules: {
    baseBid: 0,
    minIncrement: 0,
    biddingTimer: 0,
    maxSquadSize: 0,
    enableTimerReset: false,
    enableAutoBid: false,
    enableVoiceChat: false,
    enableCamera: false,
    enableSpectators: false,
    showPlayerStatistics: false,
    showMarketValue: false,
  },
  participantIds: [],
  teamIds: [],
  currentBucketIndex: 0,
  currentPlayerIndex: 0,
  playersRemaining: 0,
  createdAt: "",
};

interface AuctionState {
  auction: Auction;
  auctionStatus: Auction["status"];
  participants: Participant[];
  currentBucketIndex: number;
  currentPlayerIndex: number;
  currentPlayer: Player | null;
  currentBid: number;
  highestBidder: { teamId: string; teamName: string } | null;
  timeRemaining: number;
  bidHistory: Bid[];
  history: AuctionHistoryItem[];
  overlay: OverlayState;
  overlayAt: number;
  isPaused: boolean;
  simulationActive: boolean;
  soldPlayerIds: string[];
  unsoldPlayerIds: string[];
  syncRev: number;

  initAuction: (auction?: Auction) => void;
  applySnapshot: (snap: RoomSnapshot) => void;
  publishLive: () => Promise<void>;
  startAuction: () => void;
  pauseAuction: (byName?: string) => void;
  resumeAuction: (byName?: string) => void;
  cancelAuction: (byName?: string) => void;
  tick: () => void;
  ensureProgress: () => Promise<void>;
  placeBid: (teamId: string, teamName: string, userId?: string) => Promise<boolean>;
  simulateRivalBid: () => void;
  sellPlayer: () => void;
  markUnsold: () => void;
  nextPlayer: () => void;
  previousPlayer: () => void;
  nextBucket: () => void;
  previousBucket: () => void;
  toggleMic: (participantId: string) => void;
  toggleCamera: (participantId: string) => void;
  setSpeaking: (participantId: string, speaking: boolean) => void;
  clearOverlay: () => void;
  getQueue: () => Player[];
  getEnabledBuckets: () => Auction["buckets"];
}

function getEnabledBuckets(auction: Auction) {
  return [...auction.buckets]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order);
}

function resolvePlayer(
  auction: Auction,
  bucketIndex: number,
  playerIndex: number,
  sold: string[],
  unsold: string[]
): Player | null {
  const buckets = getEnabledBuckets(auction);
  const bucket = buckets[bucketIndex];
  if (!bucket) return null;
  const remaining = bucket.playerIds.filter(
    (id) => !sold.includes(id) && !unsold.includes(id)
  );
  const playerId = remaining[playerIndex];
  if (!playerId) return null;
  return REAL_PLAYERS.find((p) => p.id === playerId) ?? null;
}

export const useAuctionStore = create<AuctionState>((set, get) => ({
  auction: EMPTY_AUCTION,
  auctionStatus: "lobby",
  participants: [],
  currentBucketIndex: 0,
  currentPlayerIndex: 0,
  currentPlayer: REAL_PLAYERS[0] ?? null,
  currentBid: REAL_PLAYERS[0]?.basePrice ?? 5,
  highestBidder: null,
  timeRemaining: 0,
  bidHistory: [],
  history: [],
  overlay: { type: "none" },
  overlayAt: 0,
  isPaused: false,
  simulationActive: false,
  soldPlayerIds: [],
  unsoldPlayerIds: [],
  syncRev: 0,

  initAuction: (auction) => {
    if (!auction) return;
    const a = auction;
    const player = resolvePlayer(a, 0, 0, [], []);
    set({
      auction: a,
      auctionStatus: a.status,
      currentBucketIndex: 0,
      currentPlayerIndex: 0,
      currentPlayer: player,
      currentBid: player?.basePrice ?? a.rules.baseBid,
      highestBidder: null,
      timeRemaining: a.rules.biddingTimer,
      bidHistory: [],
      overlay: { type: "none" },
      overlayAt: 0,
      isPaused: false,
      simulationActive: false,
      soldPlayerIds: [],
      unsoldPlayerIds: [],
      syncRev: 0,
    });
  },

  applySnapshot: (snap) => {
    if (typeof snap.rev === "number" && snap.rev < get().syncRev) return;

    const prevState = get();
    const live = snap.live;
    const player = live.currentPlayerId
      ? REAL_PLAYERS.find((p) => p.id === live.currentPlayerId) ?? null
      : resolvePlayer(snap.auction, live.currentBucketIndex, 0, live.soldPlayerIds, live.unsoldPlayerIds);

    let overlay: OverlayState = { type: "none" };
    const liveOverlay = live.overlay;
    if (liveOverlay.type === "sold") {
      const p = REAL_PLAYERS.find((x) => x.id === liveOverlay.playerId);
      if (p) overlay = { type: "sold", player: p, price: liveOverlay.price, teamName: liveOverlay.teamName };
    } else if (liveOverlay.type === "unsold") {
      const p = REAL_PLAYERS.find((x) => x.id === liveOverlay.playerId);
      if (p) overlay = { type: "unsold", player: p };
    } else if (liveOverlay.type === "bucket") {
      overlay = { type: "bucket", from: liveOverlay.from, to: liveOverlay.to };
    }

    // Audio cue triggers based on state transitions
    if (overlay.type === "sold" && prevState.overlay.type !== "sold") {
      playAuctionSound("sold");
    } else if (overlay.type === "unsold" && prevState.overlay.type !== "unsold") {
      playAuctionSound("unsold");
    } else if (
      player &&
      prevState.currentPlayer &&
      player.id !== prevState.currentPlayer.id &&
      overlay.type === "none" &&
      snap.auction.status === "live"
    ) {
      playAuctionSound("start");
    } else if (
      prevState.highestBidder &&
      live.highestBidder &&
      prevState.highestBidder.teamId !== live.highestBidder.teamId
    ) {
      const myTeamId = useTeamStore.getState().myTeamId;
      if (myTeamId && prevState.highestBidder.teamId === myTeamId && live.highestBidder.teamId !== myTeamId) {
        playAuctionSound("outbid");
      }
    }

    set({
      auction: snap.auction,
      auctionStatus: snap.auction.status,
      participants: snap.participants,
      currentBucketIndex: live.currentBucketIndex,
      currentPlayer: player,
      currentBid: live.currentBid,
      highestBidder: live.highestBidder,
      timeRemaining: live.timeRemaining,
      bidHistory: snap.bids.filter((b) => b.playerId === live.currentPlayerId),
      history: snap.history ?? [],
      soldPlayerIds: live.soldPlayerIds ?? [],
      unsoldPlayerIds: live.unsoldPlayerIds ?? [],
      isPaused: live.isPaused,
      overlay,
      overlayAt: live.overlayAt ?? 0,
      syncRev: typeof snap.rev === "number" ? snap.rev : get().syncRev,
      simulationActive:
        snap.auction.status === "live" && !live.isPaused && live.overlay.type === "none",
    });
    useTeamStore.getState().setTeams(snap.teams);
  },

  publishLive: async () => {
    const s = get();
    if (!s.auction.id.startsWith("auc-")) return;
    const overlay: LiveSyncState["overlay"] =
      s.overlay.type === "sold"
        ? {
            type: "sold",
            playerId: s.overlay.player.id,
            price: s.overlay.price,
            teamName: s.overlay.teamName,
          }
        : s.overlay.type === "unsold"
          ? { type: "unsold", playerId: s.overlay.player.id }
          : s.overlay.type === "bucket"
            ? { type: "bucket", from: s.overlay.from, to: s.overlay.to }
            : { type: "none" };
    await auctionService.postAction(s.auction.id, {
      action: "live",
      live: {
        currentBucketIndex: s.currentBucketIndex,
        currentPlayerId: s.currentPlayer?.id ?? null,
        currentBid: s.currentBid,
        highestBidder: s.highestBidder,
        timeRemaining: s.timeRemaining,
        soldPlayerIds: s.soldPlayerIds,
        unsoldPlayerIds: s.unsoldPlayerIds,
        isPaused: s.isPaused,
        overlay,
      },
    });
  },

  startAuction: () => {
    const { auction, soldPlayerIds, unsoldPlayerIds } = get();
    const player = resolvePlayer(auction, 0, 0, soldPlayerIds, unsoldPlayerIds);
    set({
      auctionStatus: "live",
      auction: { ...auction, status: "live", startedAt: new Date().toISOString() },
      currentBucketIndex: 0,
      currentPlayerIndex: 0,
      currentPlayer: player,
      currentBid: player?.basePrice ?? auction.rules.baseBid,
      highestBidder: null,
      timeRemaining: auction.rules.biddingTimer,
      bidHistory: [],
      simulationActive: true,
      isPaused: false,
      overlay: { type: "none" },
    });
    void get().publishLive();
  },

  pauseAuction: (byName) => {
    const { auction } = get();
    set({ isPaused: true, auctionStatus: "paused", simulationActive: false });
    if (!auction.id.startsWith("auc-")) return;
    void auctionService
      .postAction(auction.id, { action: "status", status: "paused" })
      .catch(() => undefined);
    if (byName) {
      void auctionService
        .postAction(auction.id, {
          action: "chat",
          content: `${byName} paused the auction`,
          senderId: "system",
          senderName: "System",
          type: "system",
        })
        .catch(() => undefined);
    }
  },
  resumeAuction: (byName) => {
    const { auction } = get();
    set({ isPaused: false, auctionStatus: "live", simulationActive: true });
    if (!auction.id.startsWith("auc-")) return;
    void auctionService
      .postAction(auction.id, { action: "status", status: "live" })
      .catch(() => undefined);
    if (byName) {
      void auctionService
        .postAction(auction.id, {
          action: "chat",
          content: `${byName} resumed the auction`,
          senderId: "system",
          senderName: "System",
          type: "system",
        })
        .catch(() => undefined);
    }
  },

  cancelAuction: (byName) => {
    const { auction } = get();
    set({
      auctionStatus: "cancelled",
      simulationActive: false,
      isPaused: true,
      auction: { ...auction, status: "cancelled" },
    });
    if (!auction.id.startsWith("auc-")) return;
    void auctionService
      .postAction(auction.id, { action: "status", status: "cancelled" })
      .catch(() => undefined);
    void auctionService
      .postAction(auction.id, {
        action: "chat",
        content: byName ? `${byName} cancelled the auction` : "The auction was cancelled",
        senderId: "system",
        senderName: "System",
        type: "system",
      })
      .catch(() => undefined);
  },

  tick: () => {
    const state = get();
    if (!state.simulationActive || state.isPaused || state.auctionStatus !== "live") return;
    if (state.overlay.type !== "none") return;
    if (state.timeRemaining <= 0) return;
    set({ timeRemaining: state.timeRemaining - 1 });
  },

  ensureProgress: async () => {
    const state = get();
    if (!state.auction.id.startsWith("auc-")) return;
    try {
      const snap = await auctionService.getAuction(state.auction.id);
      get().applySnapshot(snap);
    } catch {
      /* ignore */
    }
  },

  placeBid: async (teamId, teamName, userId) => {
    const state = get();
    if (!state.currentPlayer || state.auctionStatus !== "live" || state.isPaused) {
      return false;
    }

    const myTeam = useTeamStore.getState().teams.find((t) => t.id === teamId);
    const nextAmount =
      state.highestBidder === null
        ? state.currentBid
        : state.currentBid + state.auction.rules.minIncrement;

    if (myTeam && myTeam.budget - myTeam.spent < nextAmount) {
      return false;
    }

    if (state.highestBidder?.teamId === teamId) {
      return false;
    }

    const result = await bidService.placeBid({
      auctionId: state.auction.id,
      playerId: state.currentPlayer.id,
      teamId,
      teamName,
      amount: nextAmount,
      userId,
    });

    if (!result.success || !result.bid) return false;

    if (result.snapshot) {
      get().applySnapshot(result.snapshot);
      return true;
    }

    const confirmedAmount = result.bid.amount;

    set((s) => ({
      currentBid: confirmedAmount,
      highestBidder: { teamId, teamName },
      bidHistory: [result.bid!, ...s.bidHistory],
      timeRemaining: s.auction.rules.enableTimerReset
        ? s.auction.rules.biddingTimer
        : s.timeRemaining,
      participants: s.participants.map((p) =>
        p.teamId === teamId ? { ...p, lastBidAmount: confirmedAmount } : p
      ),
    }));

    return true;
  },

  simulateRivalBid: () => {
    const state = get();
    const rivals = state.participants.filter(
      (p) => p.teamId && p.teamId !== state.highestBidder?.teamId && !p.isHost
    );
    if (!rivals.length || !state.currentPlayer) return;
    const rival = rivals[Math.floor(Math.random() * rivals.length)];
    if (!rival.teamId || !rival.teamName) return;

    const nextAmount =
      state.highestBidder === null
        ? state.currentBid
        : state.currentBid + state.auction.rules.minIncrement;

    const bid: Bid = {
      id: `bid-sim-${Date.now()}`,
      auctionId: state.auction.id,
      playerId: state.currentPlayer.id,
      teamId: rival.teamId,
      teamName: rival.teamName,
      amount: nextAmount,
      timestamp: Date.now(),
      userId: rival.userId,
    };

    set((s) => ({
      currentBid: nextAmount,
      highestBidder: { teamId: rival.teamId!, teamName: rival.teamName! },
      bidHistory: [bid, ...s.bidHistory],
      timeRemaining: s.auction.rules.enableTimerReset
        ? s.auction.rules.biddingTimer
        : s.timeRemaining,
      participants: s.participants.map((p) =>
        p.id === rival.id ? { ...p, lastBidAmount: nextAmount } : { ...p, lastBidAmount: undefined }
      ),
    }));
  },

  sellPlayer: () => {
    const state = get();
    if (!state.auction.id.startsWith("auc-")) return;
    void auctionService
      .postAction(state.auction.id, { action: "settle", mode: "sold" })
      .then((snap) => get().applySnapshot(snap))
      .catch(() => undefined);
  },

  markUnsold: () => {
    const state = get();
    if (!state.auction.id.startsWith("auc-")) return;
    void auctionService
      .postAction(state.auction.id, { action: "settle", mode: "unsold" })
      .then((snap) => get().applySnapshot(snap))
      .catch(() => undefined);
  },

  nextPlayer: () => {
    const state = get();
    if (!state.auction.id.startsWith("auc-")) return;
    const run = async () => {
      if (state.overlay.type !== "none") {
        const snap = await auctionService.postAction(state.auction.id, {
          action: "advance",
        });
        get().applySnapshot(snap);
      } else {
        const snap = await auctionService.postAction(state.auction.id, {
          action: "settle",
          mode: "auto",
        });
        get().applySnapshot(snap);
      }
    };
    void run().catch(() => undefined);
  },

  previousPlayer: () => {
    // Host utility: keep the current player when advancing within a bucket.
  },

  nextBucket: () => {
    const state = get();
    if (!state.auction.id.startsWith("auc-")) return;
    void auctionService
      .postAction(state.auction.id, { action: "advance" })
      .then((snap) => get().applySnapshot(snap))
      .catch(() => undefined);
  },

  previousBucket: () => {
    // Lot order is server-owned; going back would desync other managers.
  },

  toggleMic: (participantId) => {
    set((s) => ({
      participants: s.participants.map((p) =>
        p.id === participantId ? { ...p, isMicOn: !p.isMicOn, isSpeaking: false } : p
      ),
    }));
    const p = get().participants.find((x) => x.id === participantId);
    if (p) {
      void auctionService.postAction(get().auction.id, {
        action: "presence",
        userId: p.userId,
        isMicOn: p.isMicOn,
        isCameraOn: p.isCameraOn,
      }).catch(() => undefined);
    }
  },

  toggleCamera: (participantId) => {
    set((s) => ({
      participants: s.participants.map((p) =>
        p.id === participantId ? { ...p, isCameraOn: !p.isCameraOn } : p
      ),
    }));
    const p = get().participants.find((x) => x.id === participantId);
    if (p) {
      void auctionService.postAction(get().auction.id, {
        action: "presence",
        userId: p.userId,
        isMicOn: p.isMicOn,
        isCameraOn: p.isCameraOn,
      }).catch(() => undefined);
    }
  },

  setSpeaking: (participantId, speaking) =>
    set((s) => ({
      participants: s.participants.map((p) =>
        p.id === participantId ? { ...p, isSpeaking: speaking } : p
      ),
    })),

  clearOverlay: () => set({ overlay: { type: "none" } }),

  getQueue: () => {
    const state = get();
    const buckets = getEnabledBuckets(state.auction);
    const bucket = buckets[state.currentBucketIndex];
    if (!bucket || !state.currentPlayer) return [];
    const remaining = bucket.playerIds.filter(
      (id) =>
        !state.soldPlayerIds.includes(id) &&
        !state.unsoldPlayerIds.includes(id) &&
        id !== state.currentPlayer?.id
    );
    return remaining
      .slice(0, 4)
      .map((id) => REAL_PLAYERS.find((p) => p.id === id))
      .filter(Boolean) as Player[];
  },

  getEnabledBuckets: () => getEnabledBuckets(get().auction),
}));
