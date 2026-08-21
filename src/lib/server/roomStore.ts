import type {
  Auction,
  AuctionConfig,
  ChatMessage,
  Participant,
} from "@/types/auction";
import type { Bid } from "@/types/bid";
import type { LiveSyncState, RoomSnapshot, RtcSignal } from "@/types/room";
import type { Team } from "@/types/team";
import { generateRoomCode } from "@/lib/utils";
import { createAuctionTeams } from "@/lib/teamFactory";
import { getDb } from "@/lib/server/mongo";
import { userStore } from "@/lib/server/userStore";

const HOST_HEARTBEAT_EXPIRATION_MS = 30_000;

export interface RoomRecord {
  auction: Auction;
  teams: Team[];
  participants: Participant[];
  messages: ChatMessage[];
  bids: Bid[];
  live: LiveSyncState;
  signals: RtcSignal[];
  lastSeen: Record<string, number>;
}

type RoomDoc = RoomRecord & { _id: string; updatedAt: string };

async function roomsCol() {
  return (await getDb()).collection<RoomDoc>("rooms");
}

function avatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0B3D2E&color=C8F560&size=256&bold=true&format=png`;
}

function makeParticipant(input: {
  userId: string;
  name: string;
  isHost: boolean;
  team?: Team;
}): Participant {
  return {
    id: `part-${input.userId}`,
    userId: input.userId,
    name: input.name,
    avatar: avatar(input.name),
    teamId: input.team?.id,
    teamName: input.team?.name,
    isHost: input.isHost,
    isMicOn: false,
    isCameraOn: false,
    isSpeaking: false,
    isConnected: true,
  };
}

function defaultLive(auction: Auction): LiveSyncState {
  const buckets = [...auction.buckets]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order);
  const firstId = buckets[0]?.playerIds[0] ?? null;
  return {
    currentBucketIndex: 0,
    currentPlayerId: firstId,
    currentBid: auction.rules.baseBid,
    highestBidder: null,
    timeRemaining: auction.rules.biddingTimer,
    timerEpoch: Date.now(),
    soldPlayerIds: [],
    unsoldPlayerIds: [],
    isPaused: false,
    overlay: { type: "none" },
  };
}

function fromDoc(doc: RoomDoc): RoomRecord {
  return {
    auction: doc.auction,
    teams: doc.teams ?? [],
    participants: doc.participants ?? [],
    messages: doc.messages ?? [],
    bids: doc.bids ?? [],
    live: doc.live,
    signals: doc.signals ?? [],
    lastSeen: doc.lastSeen ?? {},
  };
}

async function saveRoom(room: RoomRecord) {
  const col = await roomsCol();
  const doc: RoomDoc = {
    _id: room.auction.id,
    ...room,
    updatedAt: new Date().toISOString(),
  };
  await col.replaceOne({ _id: room.auction.id }, doc, { upsert: true });
}

async function getRoomById(auctionId: string): Promise<RoomRecord> {
  const col = await roomsCol();
  const doc = await col.findOne({ _id: auctionId });
  if (!doc) throw new Error("Auction not found");
  return fromDoc(doc);
}

async function getRoomByCode(code: string): Promise<RoomRecord> {
  const col = await roomsCol();
  const doc = await col.findOne({
    "auction.roomCode": code.trim().toUpperCase(),
  });
  if (!doc) throw new Error("Invalid or expired auction code");
  return fromDoc(doc);
}

function withPresence(room: RoomRecord): Participant[] {
  const now = Date.now();
  return room.participants.map((p) => ({
    ...p,
    isConnected: now - (room.lastSeen[p.userId] ?? 0) < 12_000,
  }));
}

function liveWithClock(room: RoomRecord): LiveSyncState {
  const live = room.live;
  if (room.auction.status !== "live" || live.isPaused || live.overlay.type !== "none") {
    return live;
  }
  const elapsed = Math.floor((Date.now() - live.timerEpoch) / 1000);
  return {
    ...live,
    timeRemaining: Math.max(0, live.timeRemaining - elapsed),
  };
}

async function cancelIfHostOffline(room: RoomRecord): Promise<boolean> {
  if (!["lobby", "live", "paused"].includes(room.auction.status)) return false;
  const hostLastSeen = room.lastSeen[room.auction.hostId] ?? 0;
  if (Date.now() - hostLastSeen <= HOST_HEARTBEAT_EXPIRATION_MS) return false;

  room.auction = {
    ...room.auction,
    status: "cancelled",
    completedAt: new Date().toISOString(),
  };
  room.live = { ...room.live, isPaused: true, overlay: { type: "none" } };
  room.messages.push({
    id: `msg-${Date.now()}`,
    auctionId: room.auction.id,
    type: "system",
    senderId: "system",
    senderName: "System",
    content: "The host went offline. This auction has ended.",
    timestamp: Date.now(),
  });
  await saveRoom(room);
  return true;
}

function snapshot(
  room: RoomRecord,
  forUserId?: string,
  drainSignals = false
): RoomSnapshot {
  let signals: RtcSignal[] = [];
  if (forUserId) {
    signals = room.signals.filter((s) => s.to === forUserId);
    if (drainSignals) {
      room.signals = room.signals.filter((s) => s.to !== forUserId);
    } else {
      signals = [];
    }
  }
  return {
    auction: room.auction,
    teams: room.teams,
    participants: withPresence(room),
    messages: room.messages,
    bids: room.bids,
    live: liveWithClock(room),
    signals,
  };
}

export const roomStore = {
  async list(): Promise<Auction[]> {
    const col = await roomsCol();
    const docs = await col.find({}).sort({ updatedAt: -1 }).limit(80).toArray();
    return docs.map((d) => d.auction);
  },

  async get(
    auctionId: string,
    forUserId?: string,
    drainSignals = true
  ): Promise<RoomSnapshot> {
    const room = await getRoomById(auctionId);
    await cancelIfHostOffline(room);
    const before = room.signals.length;
    const snap = snapshot(room, forUserId, drainSignals);
    if (drainSignals && forUserId && room.signals.length !== before) {
      await saveRoom(room);
    }
    return snap;
  },

  async getByCode(
    code: string,
    forUserId?: string,
    drainSignals = false
  ): Promise<RoomSnapshot> {
    const room = await getRoomByCode(code);
    await cancelIfHostOffline(room);
    const snap = snapshot(room, forUserId, drainSignals);
    if (drainSignals && forUserId) await saveRoom(room);
    return snap;
  },

  async create(
    config: AuctionConfig,
    hostId: string,
    hostName: string
  ): Promise<RoomSnapshot> {
    const roomCode = generateRoomCode();
    const auctionId = `auc-${Date.now()}`;
    const teams = createAuctionTeams(
      config.teamCount,
      config.startingBudget,
      config.rules.maxSquadSize,
      auctionId
    );

    const hostTeam = teams[0];
    if (hostTeam) {
      hostTeam.isAvailable = false;
      hostTeam.managerId = hostId;
      hostTeam.managerName = hostName;
    }

    const auction: Auction = {
      id: auctionId,
      roomCode,
      name: config.name,
      description: config.description,
      visibility: config.visibility,
      status: "lobby",
      hostId,
      hostName,
      teamCount: config.teamCount,
      startingBudget: config.startingBudget,
      buckets: config.buckets,
      rules: config.rules,
      participantIds: [hostId],
      teamIds: teams.map((t) => t.id),
      currentBucketIndex: 0,
      currentPlayerIndex: 0,
      playersRemaining: config.buckets
        .filter((b) => b.enabled)
        .reduce((sum, b) => sum + b.playerIds.length, 0),
      createdAt: new Date().toISOString(),
    };

    const host = makeParticipant({
      userId: hostId,
      name: hostName,
      isHost: true,
      team: hostTeam,
    });

    const room: RoomRecord = {
      auction,
      teams,
      participants: [host],
      messages: [
        {
          id: `msg-${Date.now()}`,
          auctionId,
          type: "system",
          senderId: "system",
          senderName: "System",
          content: `${hostName} created the room. Code ${roomCode}`,
          timestamp: Date.now(),
        },
      ],
      bids: [],
      live: defaultLive(auction),
      signals: [],
      lastSeen: { [hostId]: Date.now() },
    };

    await saveRoom(room);
    await userStore.bumpHosted(hostId).catch(() => undefined);
    return snapshot(room, hostId);
  },

  async join(input: {
    code: string;
    userId: string;
    userName: string;
    teamId?: string;
    teamName?: string;
  }): Promise<RoomSnapshot> {
    const room = await getRoomByCode(input.code);

    const existing = room.participants.find((p) => p.userId === input.userId);
    if (existing) {
      room.lastSeen[input.userId] = Date.now();
      if (input.teamId && !existing.teamId) {
        return this.claimTeam(
          room.auction.id,
          input.teamId,
          input.userId,
          input.userName,
          input.teamName
        );
      }
      await saveRoom(room);
      return snapshot(room, input.userId);
    }

    if (
      room.auction.status === "completed" ||
      room.auction.status === "cancelled"
    ) {
      throw new Error("This auction has ended");
    }

    let team: Team | undefined;
    if (input.teamId) {
      team = room.teams.find((t) => t.id === input.teamId);
      if (!team) throw new Error("Team not found");
      if (!team.isAvailable) throw new Error("That club is already taken");
      team.isAvailable = false;
      team.managerId = input.userId;
      team.managerName = input.userName;
      team.name = input.teamName?.trim() || team.name;
    }

    const participant = makeParticipant({
      userId: input.userId,
      name: input.userName,
      isHost: input.userId === room.auction.hostId,
      team,
    });

    room.participants.push(participant);
    room.auction.participantIds = room.participants.map((p) => p.userId);
    room.auction.status =
      room.auction.status === "waiting" ? "lobby" : room.auction.status;
    room.lastSeen[input.userId] = Date.now();
    room.messages.push({
      id: `msg-${Date.now()}`,
      auctionId: room.auction.id,
      type: "system",
      senderId: "system",
      senderName: "System",
      content: team
        ? `${input.userName} joined as ${team.name}`
        : `${input.userName} joined the lobby`,
      timestamp: Date.now(),
    });

    await saveRoom(room);
    await userStore.bumpJoined(input.userId).catch(() => undefined);
    return snapshot(room, input.userId);
  },

  async claimTeam(
    auctionId: string,
    teamId: string,
    userId: string,
    userName: string,
    teamName?: string
  ): Promise<RoomSnapshot> {
    const room = await getRoomById(auctionId);
    const team = room.teams.find((t) => t.id === teamId);
    if (!team) throw new Error("Team not found");
    if (!team.isAvailable && team.managerId !== userId) {
      throw new Error("That club is already taken");
    }

    room.teams = room.teams.map((t) =>
      t.managerId === userId
        ? { ...t, isAvailable: true, managerId: undefined, managerName: undefined }
        : t
    );

    const claimed = room.teams.find((t) => t.id === teamId);
    if (!claimed) throw new Error("Team not found");
    claimed.isAvailable = false;
    claimed.managerId = userId;
    claimed.managerName = userName;
    claimed.name = teamName?.trim() || claimed.name;

    room.participants = room.participants.map((p) =>
      p.userId === userId
        ? { ...p, teamId: claimed.id, teamName: claimed.name }
        : p
    );

    await saveRoom(room);
    return snapshot(room, userId);
  },

  async leave(auctionId: string, userId: string): Promise<RoomSnapshot> {
    const room = await getRoomById(auctionId);
    const participant = room.participants.find((p) => p.userId === userId);
    if (!participant) return snapshot(room, userId);

    if (room.auction.hostId === userId) {
      room.auction = {
        ...room.auction,
        status: "cancelled",
        completedAt: new Date().toISOString(),
      };
      room.live = {
        ...room.live,
        isPaused: true,
        overlay: { type: "none" },
      };
      room.messages.push({
        id: `msg-${Date.now()}`,
        auctionId,
        type: "system",
        senderId: "system",
        senderName: "System",
        content: "The host left. This auction has ended.",
        timestamp: Date.now(),
      });
    } else {
      room.participants = room.participants.filter((p) => p.userId !== userId);
      room.auction.participantIds = room.participants.map((p) => p.userId);
      room.teams = room.teams.map((team) =>
        team.managerId === userId
          ? { ...team, isAvailable: true, managerId: undefined, managerName: undefined }
          : team
      );
      room.messages.push({
        id: `msg-${Date.now()}`,
        auctionId,
        type: "system",
        senderId: "system",
        senderName: "System",
        content: `${participant.name} left the auction.`,
        timestamp: Date.now(),
      });
    }

    delete room.lastSeen[userId];
    await saveRoom(room);
    return snapshot(room, userId);
  },

  async start(auctionId: string, userId: string): Promise<RoomSnapshot> {
    const room = await getRoomById(auctionId);
    if (room.auction.hostId !== userId) {
      throw new Error("Only the host can start the auction");
    }
    if (room.auction.status === "cancelled") {
      throw new Error("This auction was cancelled");
    }
    if (room.auction.status === "completed") {
      throw new Error("This auction has ended");
    }
    room.auction = {
      ...room.auction,
      status: "live",
      startedAt: new Date().toISOString(),
    };
    room.live = {
      ...defaultLive(room.auction),
      timerEpoch: Date.now(),
    };
    room.messages.push({
      id: `msg-${Date.now()}`,
      auctionId,
      type: "system",
      senderId: "system",
      senderName: "System",
      content: "The auction is live. Good luck.",
      timestamp: Date.now(),
    });
    await saveRoom(room);
    return snapshot(room, userId);
  },

  async chat(input: {
    auctionId: string;
    content: string;
    senderId: string;
    senderName: string;
    type?: ChatMessage["type"];
  }): Promise<ChatMessage> {
    const room = await getRoomById(input.auctionId);
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      auctionId: input.auctionId,
      type: input.type ?? "normal",
      senderId: input.senderId,
      senderName: input.senderName,
      content: input.content.trim(),
      timestamp: Date.now(),
    };
    if (!message.content) throw new Error("Message cannot be empty");
    room.messages.push(message);
    await saveRoom(room);
    return message;
  },

  async presence(input: {
    auctionId: string;
    userId: string;
    isMicOn?: boolean;
    isCameraOn?: boolean;
    isSpeaking?: boolean;
  }): Promise<RoomSnapshot> {
    const room = await getRoomById(input.auctionId);
    room.lastSeen[input.userId] = Date.now();
    room.participants = room.participants.map((p) =>
      p.userId === input.userId
        ? {
            ...p,
            isMicOn: input.isMicOn ?? p.isMicOn,
            isCameraOn: input.isCameraOn ?? p.isCameraOn,
            isSpeaking: input.isSpeaking ?? p.isSpeaking,
          }
        : p
    );
    await saveRoom(room);
    return snapshot(room, input.userId);
  },

  async signal(auctionId: string, signal: Omit<RtcSignal, "id">): Promise<void> {
    const room = await getRoomById(auctionId);
    room.signals.push({
      ...signal,
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    if (room.signals.length > 400) {
      room.signals = room.signals.slice(-200);
    }
    await saveRoom(room);
  },

  async placeBid(input: {
    auctionId: string;
    playerId: string;
    teamId: string;
    teamName: string;
    amount: number;
    userId?: string;
  }): Promise<Bid> {
    const room = await getRoomById(input.auctionId);
    if (room.auction.status !== "live") throw new Error("Auction is not live");
    if (room.live.isPaused) throw new Error("Auction is paused");
    if (room.live.currentPlayerId !== input.playerId) {
      throw new Error("This player is not on the block");
    }
    if (
      room.live.highestBidder &&
      input.amount < room.live.currentBid + room.auction.rules.minIncrement
    ) {
      throw new Error("Bid too low");
    }

    const bid: Bid = {
      id: `bid-${Date.now()}`,
      auctionId: input.auctionId,
      playerId: input.playerId,
      teamId: input.teamId,
      teamName: input.teamName,
      amount: input.amount,
      timestamp: Date.now(),
      userId: input.userId,
    };
    room.bids = [bid, ...room.bids];
    room.live.currentBid = input.amount;
    room.live.highestBidder = { teamId: input.teamId, teamName: input.teamName };
    if (room.auction.rules.enableTimerReset) {
      room.live.timeRemaining = room.auction.rules.biddingTimer;
    }
    room.live.timerEpoch = Date.now();
    room.live.overlay = { type: "none" };
    room.participants = room.participants.map((p) =>
      p.teamId === input.teamId
        ? { ...p, lastBidAmount: input.amount }
        : { ...p, lastBidAmount: undefined }
    );
    await saveRoom(room);
    return bid;
  },

  async pushLive(
    auctionId: string,
    live: Partial<LiveSyncState>
  ): Promise<RoomSnapshot> {
    const room = await getRoomById(auctionId);
    const isSamePlayer =
      live.currentPlayerId !== undefined &&
      live.currentPlayerId === room.live.currentPlayerId;
    const isNewerBid =
      live.currentBid !== undefined && live.currentBid >= room.live.currentBid;

    // A host timer update can arrive after a friend's bid. Preserve the
    // server's newer bid when both snapshots refer to the same player.
    const shouldApplyBidState = !isSamePlayer || isNewerBid;
    room.live = {
      ...room.live,
      ...live,
      ...(shouldApplyBidState
        ? {}
        : {
            currentBid: room.live.currentBid,
            highestBidder: room.live.highestBidder,
          }),
      timerEpoch: Date.now(),
    };
    if (live.soldPlayerIds) {
      room.auction.playersRemaining = Math.max(0, room.auction.playersRemaining);
    }
    await saveRoom(room);
    return snapshot(room);
  },

  async updateAuctionStatus(
    auctionId: string,
    status: Auction["status"]
  ): Promise<RoomSnapshot> {
    const room = await getRoomById(auctionId);
    if (status === "paused") {
      const remaining = liveWithClock(room).timeRemaining;
      room.live = {
        ...room.live,
        isPaused: true,
        timeRemaining: remaining,
        timerEpoch: Date.now(),
      };
    }
    if (status === "live") {
      room.live = {
        ...room.live,
        isPaused: false,
        timerEpoch: Date.now(),
      };
    }
    room.auction = { ...room.auction, status };
    if (status === "completed") {
      room.auction.completedAt = new Date().toISOString();
    }
    if (status === "cancelled") {
      room.live = { ...room.live, isPaused: true, overlay: { type: "none" } };
    }
    await saveRoom(room);
    return snapshot(room);
  },

  async updateTeamSpend(
    auctionId: string,
    teamId: string,
    amount: number,
    playerId: string
  ): Promise<void> {
    const room = await getRoomById(auctionId);
    room.teams = room.teams.map((t) =>
      t.id === teamId
        ? { ...t, spent: t.spent + amount, squad: [...t.squad, playerId] }
        : t
    );
    await saveRoom(room);
  },
};
