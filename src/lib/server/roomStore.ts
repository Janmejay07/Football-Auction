import type {
  Auction,
  AuctionConfig,
  AuctionHistoryItem,
  ChatMessage,
  Participant,
} from "@/types/auction";
import type { Bid } from "@/types/bid";
import type { LiveSyncState, RoomSnapshot, RtcSignal } from "@/types/room";
import type { Team } from "@/types/team";
import { generateRoomCode } from "@/lib/utils";
import { createAuctionTeams } from "@/lib/teamFactory";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";
import { getDb } from "@/lib/server/mongo";
import { userStore } from "@/lib/server/userStore";

const HOST_HEARTBEAT_EXPIRATION_MS = 90_000;
const SOLD_OVERLAY_MS = 2800;
const BUCKET_OVERLAY_MS = 2200;

export interface RoomRecord {
  auction: Auction;
  teams: Team[];
  participants: Participant[];
  messages: ChatMessage[];
  bids: Bid[];
  history: AuctionHistoryItem[];
  live: LiveSyncState;
  signals: RtcSignal[];
  lastSeen: Record<string, number>;
  rev: number;
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
    currentBid: openingBid(auction, firstId),
    highestBidder: null,
    timeRemaining: auction.rules.biddingTimer,
    timerEpoch: Date.now(),
    soldPlayerIds: [],
    unsoldPlayerIds: [],
    isPaused: false,
    overlay: { type: "none" },
    overlayAt: 0,
  };
}

function enabledBuckets(auction: Auction) {
  return [...auction.buckets]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order);
}

function remainingInBucket(
  bucket: Auction["buckets"][number] | undefined,
  sold: string[],
  unsold: string[]
) {
  if (!bucket) return [];
  return bucket.playerIds.filter(
    (id) => !sold.includes(id) && !unsold.includes(id)
  );
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

function playerName(playerId: string) {
  return REAL_PLAYERS.find((p) => p.id === playerId)?.name ?? "Player";
}

function openingBid(auction: Auction, playerId: string | null) {
  if (!playerId) return auction.rules.baseBid;
  const player = REAL_PLAYERS.find((p) => p.id === playerId);
  return player?.basePrice ?? auction.rules.baseBid;
}

function remainingCount(auction: Auction, sold: string[], unsold: string[]) {
  return enabledBuckets(auction).reduce(
    (sum, bucket) => sum + remainingInBucket(bucket, sold, unsold).length,
    0
  );
}

function assignPlayerToTeam(
  room: RoomRecord,
  teamId: string,
  playerId: string,
  amount: number
) {
  room.teams = room.teams.map((t) => {
    if (t.id !== teamId) return t;
    if (t.squad.includes(playerId)) return t;
    return {
      ...t,
      spent: t.spent + amount,
      squad: [...t.squad, playerId],
    };
  });
}

function startPlayerOnBlock(
  room: RoomRecord,
  bucketIndex: number,
  playerId: string
) {
  room.live.currentBucketIndex = bucketIndex;
  room.live.currentPlayerId = playerId;
  room.live.currentBid = openingBid(room.auction, playerId);
  room.live.highestBidder = null;
  room.live.timeRemaining = room.auction.rules.biddingTimer;
  room.live.timerEpoch = Date.now();
  room.live.overlay = { type: "none" };
  room.live.overlayAt = Date.now();
  room.auction.currentBucketIndex = bucketIndex;
  room.auction.playersRemaining = remainingCount(
    room.auction,
    room.live.soldPlayerIds,
    room.live.unsoldPlayerIds
  );
  room.participants = room.participants.map((p) => ({
    ...p,
    lastBidAmount: undefined,
  }));
}

function completeAuction(room: RoomRecord) {
  room.auction = {
    ...room.auction,
    status: "completed",
    completedAt: new Date().toISOString(),
    playersRemaining: 0,
  };
  room.live = {
    ...room.live,
    currentPlayerId: null,
    highestBidder: null,
    isPaused: true,
    overlay: { type: "none" },
    overlayAt: Date.now(),
  };
}

function advanceLot(room: RoomRecord) {
  const buckets = enabledBuckets(room.auction);
  const sold = room.live.soldPlayerIds;
  const unsold = room.live.unsoldPlayerIds;
  let idx = room.live.currentBucketIndex;

  while (idx < buckets.length) {
    const left = remainingInBucket(buckets[idx], sold, unsold);
    if (left.length) {
      if (idx !== room.live.currentBucketIndex) {
        const from = buckets[room.live.currentBucketIndex]?.name ?? "";
        const to = buckets[idx]?.name ?? "";
        startPlayerOnBlock(room, idx, left[0]);
        room.live.overlay = { type: "bucket", from, to };
        room.live.overlayAt = Date.now();
        return;
      }
      startPlayerOnBlock(room, idx, left[0]);
      return;
    }
    idx += 1;
  }

  completeAuction(room);
}

function settleCurrentLot(
  room: RoomRecord,
  mode: "auto" | "sold" | "unsold"
): boolean {
  if (room.auction.status !== "live") return false;
  if (room.live.overlay.type !== "none") return false;

  const playerId = room.live.currentPlayerId;
  if (!playerId) {
    advanceLot(room);
    return true;
  }
  if (
    room.live.soldPlayerIds.includes(playerId) ||
    room.live.unsoldPlayerIds.includes(playerId)
  ) {
    advanceLot(room);
    return true;
  }

  const bidder = room.live.highestBidder;
  const sellToBidder = Boolean(bidder) && mode !== "unsold";

  if (sellToBidder && bidder) {
    const price = room.live.currentBid;
    assignPlayerToTeam(room, bidder.teamId, playerId, price);
    room.live.soldPlayerIds = uniqueIds([...room.live.soldPlayerIds, playerId]);
    room.live.overlay = {
      type: "sold",
      playerId,
      price,
      teamName: bidder.teamName,
      teamId: bidder.teamId,
    };
    room.live.overlayAt = Date.now();
    room.history = [
      {
        playerId,
        playerName: playerName(playerId),
        status: "sold",
        winnerTeamId: bidder.teamId,
        winnerTeamName: bidder.teamName,
        price,
        timestamp: new Date().toISOString(),
      },
      ...room.history,
    ];
    room.messages.push({
      id: `msg-${Date.now()}-sold`,
      auctionId: room.auction.id,
      type: "bid",
      senderId: "system",
      senderName: "System",
      content: `${playerName(playerId)} sold to ${bidder.teamName} for ${price}`,
      timestamp: Date.now(),
    });
  } else {
    room.live.unsoldPlayerIds = uniqueIds([
      ...room.live.unsoldPlayerIds,
      playerId,
    ]);
    room.live.overlay = { type: "unsold", playerId };
    room.live.overlayAt = Date.now();
    room.history = [
      {
        playerId,
        playerName: playerName(playerId),
        status: "unsold",
        timestamp: new Date().toISOString(),
      },
      ...room.history,
    ];
  }

  room.auction.playersRemaining = remainingCount(
    room.auction,
    room.live.soldPlayerIds,
    room.live.unsoldPlayerIds
  );
  room.participants = room.participants.map((p) => ({
    ...p,
    lastBidAmount: undefined,
  }));
  return true;
}

function progressLive(room: RoomRecord): boolean {
  if (room.auction.status !== "live") return false;
  if (room.live.isPaused) return false;

  const overlay = room.live.overlay.type;
  const overlayAt = room.live.overlayAt ?? 0;
  const elapsed = Date.now() - overlayAt;

  if (overlay === "sold" || overlay === "unsold") {
    if (elapsed >= SOLD_OVERLAY_MS) {
      advanceLot(room);
      return true;
    }
    return false;
  }

  if (overlay === "bucket") {
    if (elapsed >= BUCKET_OVERLAY_MS) {
      room.live.overlay = { type: "none" };
      room.live.timeRemaining = room.auction.rules.biddingTimer;
      room.live.timerEpoch = Date.now();
      room.live.overlayAt = Date.now();
      return true;
    }
    return false;
  }

  const remaining = liveWithClock(room).timeRemaining;
  if (remaining > 0) return false;
  return settleCurrentLot(room, "auto");
}

function fromDoc(doc: RoomDoc): RoomRecord {
  return {
    auction: doc.auction,
    teams: (doc.teams ?? []).map((t) => ({
      ...t,
      squad: t.squad ?? [],
      spent: t.spent ?? 0,
    })),
    participants: doc.participants ?? [],
    messages: doc.messages ?? [],
    bids: doc.bids ?? [],
    history: doc.history ?? [],
    live: {
      ...doc.live,
      soldPlayerIds: doc.live?.soldPlayerIds ?? [],
      unsoldPlayerIds: doc.live?.unsoldPlayerIds ?? [],
      overlay: doc.live?.overlay ?? { type: "none" },
      overlayAt: doc.live?.overlayAt ?? 0,
      timerEpoch: doc.live?.timerEpoch ?? Date.now(),
    },
    signals: doc.signals ?? [],
    lastSeen: doc.lastSeen ?? {},
    rev: typeof doc.rev === "number" ? doc.rev : 0,
  };
}

async function persist(room: RoomRecord, expectedRev: number | null) {
  const col = await roomsCol();
  const nextRev = (expectedRev ?? 0) + 1;
  const doc: RoomDoc = {
    _id: room.auction.id,
    ...room,
    rev: nextRev,
    updatedAt: new Date().toISOString(),
  };

  if (expectedRev === null) {
    await col.replaceOne({ _id: room.auction.id }, doc, { upsert: true });
    room.rev = nextRev;
    return true;
  }

  const result = await col.replaceOne(
    {
      _id: room.auction.id,
      $or: [{ rev: expectedRev }, { rev: { $exists: false } }],
    },
    doc
  );
  if ((result.matchedCount ?? 0) === 0) return false;
  room.rev = nextRev;
  return true;
}

async function updateById<T>(
  auctionId: string,
  fn: (room: RoomRecord) => T | Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < 16; attempt++) {
    const room = await getRoomById(auctionId);
    const rev = room.rev;
    const value = await fn(room);
    if (await persist(room, rev)) return stampRev(value, room.rev);
  }
  throw new Error("Could not update the auction. Try again.");
}

async function updateByCode<T>(
  code: string,
  fn: (room: RoomRecord) => T | Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < 16; attempt++) {
    const room = await getRoomByCode(code);
    const rev = room.rev;
    const value = await fn(room);
    if (await persist(room, rev)) return stampRev(value, room.rev);
  }
  throw new Error("Could not update the auction. Try again.");
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

function applyClaim(
  room: RoomRecord,
  teamId: string,
  userId: string,
  userName: string,
  teamName?: string
) {
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

function cancelIfHostOffline(room: RoomRecord): boolean {
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
    rev: room.rev,
    auction: room.auction,
    teams: room.teams,
    participants: withPresence(room),
    messages: room.messages,
    bids: room.bids,
    history: room.history ?? [],
    live: liveWithClock(room),
    signals,
  };
}

function stampRev<T>(value: T, rev: number): T {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if ("auction" in record && "live" in record) {
    (record as unknown as RoomSnapshot).rev = rev;
  }
  if (record.snapshot && typeof record.snapshot === "object") {
    (record.snapshot as RoomSnapshot).rev = rev;
  }
  return value;
}

export const roomStore = {
  async list(): Promise<Auction[]> {
    const col = await roomsCol();
    const docs = await col.find({}).sort({ updatedAt: -1 }).limit(80).toArray();
    return docs.map((d) => d.auction);
  },

  async pullSignals(auctionId: string, userId: string): Promise<RtcSignal[]> {
    const col = await roomsCol();
    // Atomically take this user's queued signals so presence/live polls
    // cannot clobber WebRTC offers under concurrent writes.
    const result = await col.findOneAndUpdate(
      { _id: auctionId, "signals.to": userId },
      [
        {
          $set: {
            _drain: {
              $filter: {
                input: { $ifNull: ["$signals", []] },
                as: "s",
                cond: { $eq: ["$$s.to", userId] },
              },
            },
            signals: {
              $filter: {
                input: { $ifNull: ["$signals", []] },
                as: "s",
                cond: { $ne: ["$$s.to", userId] },
              },
            },
            rev: { $add: [{ $ifNull: ["$rev", 0] }, 1] },
            updatedAt: new Date().toISOString(),
          },
        },
      ],
      { returnDocument: "after" }
    );
    const doc = result as (RoomDoc & { _drain?: RtcSignal[] }) | null;
    if (!doc) {
      const exists = await col.findOne({ _id: auctionId }, { projection: { _id: 1 } });
      if (!exists) throw new Error("Auction not found");
      return [];
    }
    const mine = doc._drain ?? [];
    if (mine.length) {
      await col.updateOne({ _id: auctionId }, { $unset: { _drain: "" } });
    }
    return mine;
  },

  async get(
    auctionId: string,
    forUserId?: string,
    drainSignals = false
  ): Promise<RoomSnapshot> {
    for (let attempt = 0; attempt < 16; attempt++) {
      const room = await getRoomById(auctionId);
      const rev = room.rev;
      const progressed = progressLive(room);
      const cancelled = cancelIfHostOffline(room);
      const before = room.signals.length;
      const snap = snapshot(room, forUserId, drainSignals);
      const dirty =
        progressed ||
        cancelled ||
        Boolean(drainSignals && forUserId && room.signals.length !== before);
      if (!dirty) return snap;
      if (await persist(room, rev)) return stampRev(snap, room.rev);
    }
    throw new Error("Could not update the auction. Try again.");
  },

  async getByCode(
    code: string,
    forUserId?: string,
    drainSignals = false
  ): Promise<RoomSnapshot> {
    for (let attempt = 0; attempt < 16; attempt++) {
      const room = await getRoomByCode(code);
      const rev = room.rev;
      const progressed = progressLive(room);
      const cancelled = cancelIfHostOffline(room);
      const before = room.signals.length;
      const snap = snapshot(room, forUserId, drainSignals);
      const dirty =
        progressed ||
        cancelled ||
        Boolean(drainSignals && forUserId && room.signals.length !== before);
      if (!dirty) return snap;
      if (await persist(room, rev)) return stampRev(snap, room.rev);
    }
    throw new Error("Could not update the auction. Try again.");
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
      history: [],
      live: defaultLive(auction),
      signals: [],
      lastSeen: { [hostId]: Date.now() },
      rev: 0,
    };

    await persist(room, null);
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
    const result = await updateByCode(input.code, async (room) => {
      const existing = room.participants.find((p) => p.userId === input.userId);
      if (existing) {
        room.lastSeen[input.userId] = Date.now();
        if (input.teamId && !existing.teamId) {
          applyClaim(
            room,
            input.teamId,
            input.userId,
            input.userName,
            input.teamName
          );
        }
        return { snap: snapshot(room, input.userId), isNew: false };
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

      return { snap: snapshot(room, input.userId), isNew: true };
    });
    if (result.isNew) {
      await userStore.bumpJoined(input.userId).catch(() => undefined);
    }
    return result.snap;
  },

  async claimTeam(
    auctionId: string,
    teamId: string,
    userId: string,
    userName: string,
    teamName?: string
  ): Promise<RoomSnapshot> {
    return updateById(auctionId, (room) => {
      applyClaim(room, teamId, userId, userName, teamName);
      return snapshot(room, userId);
    });
  },

  async leave(auctionId: string, userId: string): Promise<RoomSnapshot> {
    return updateById(auctionId, (room) => {
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
      return snapshot(room, userId);
    });
  },

  async start(auctionId: string, userId: string): Promise<RoomSnapshot> {
    return updateById(auctionId, (room) => {
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
      return snapshot(room, userId);
    });
  },

  async chat(input: {
    auctionId: string;
    content: string;
    senderId: string;
    senderName: string;
    type?: ChatMessage["type"];
  }): Promise<ChatMessage> {
    return updateById(input.auctionId, (room) => {
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
      return message;
    });
  },

  async presence(input: {
    auctionId: string;
    userId: string;
    isMicOn?: boolean;
    isCameraOn?: boolean;
    isSpeaking?: boolean;
  }): Promise<RoomSnapshot> {
    return updateById(input.auctionId, (room) => {
      progressLive(room);
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
      return snapshot(room, input.userId);
    });
  },

  async signal(
    auctionId: string,
    signal: Omit<RtcSignal, "id"> | Omit<RtcSignal, "id">[]
  ): Promise<void> {
    const incoming = Array.isArray(signal) ? signal : [signal];
    await updateById(auctionId, (room) => {
      for (const item of incoming) {
        room.signals.push({
          ...item,
          id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        });
      }
      if (room.signals.length > 500) {
        room.signals = room.signals.slice(-250);
      }
    });
  },

  async placeBid(input: {
    auctionId: string;
    playerId: string;
    teamId: string;
    teamName: string;
    amount: number;
    userId?: string;
  }): Promise<{ bid: Bid; snapshot: RoomSnapshot }> {
    return updateById(input.auctionId, (room) => {
      progressLive(room);
      if (room.auction.status !== "live") throw new Error("Auction is not live");
      if (room.live.isPaused) throw new Error("Auction is paused");
      if (room.live.overlay.type !== "none") {
        throw new Error("Wait for the next player");
      }
      if (room.live.currentPlayerId !== input.playerId) {
        throw new Error("This player is not on the block");
      }
      if (room.live.highestBidder?.teamId === input.teamId) {
        throw new Error("You are already winning");
      }
      const team = room.teams.find((t) => t.id === input.teamId);
      if (!team) throw new Error("Team not found");
      if (input.userId && team.managerId && team.managerId !== input.userId) {
        throw new Error("That is not your team");
      }
      if (team.squad.length >= team.maxSquadSize) {
        throw new Error("Squad is full");
      }
      const minAmount = room.live.highestBidder
        ? room.live.currentBid + room.auction.rules.minIncrement
        : room.live.currentBid;
      const amount = Number.isFinite(input.amount)
        ? Math.max(input.amount, minAmount)
        : minAmount;
      if (team.budget - team.spent < amount) {
        throw new Error("Insufficient budget");
      }

      const bid: Bid = {
        id: `bid-${Date.now()}`,
        auctionId: input.auctionId,
        playerId: input.playerId,
        teamId: input.teamId,
        teamName: team.name || input.teamName,
        amount,
        timestamp: Date.now(),
        userId: input.userId,
      };
      room.bids = [bid, ...room.bids];
      const clock = liveWithClock(room);
      room.live.currentBid = amount;
      room.live.highestBidder = {
        teamId: input.teamId,
        teamName: team.name || input.teamName,
      };
      room.live.timeRemaining = room.auction.rules.enableTimerReset
        ? room.auction.rules.biddingTimer
        : Math.max(5, clock.timeRemaining);
      room.live.timerEpoch = Date.now();
      room.live.overlay = { type: "none" };
      room.participants = room.participants.map((p) =>
        p.teamId === input.teamId
          ? { ...p, lastBidAmount: amount }
          : { ...p, lastBidAmount: undefined }
      );
      return { bid, snapshot: snapshot(room) };
    });
  },

  async pushLive(
    auctionId: string,
    live: Partial<LiveSyncState>
  ): Promise<RoomSnapshot> {
    return updateById(auctionId, (room) => {
      progressLive(room);
      // Lot state (player, bids, sold list, overlay) is server-owned so a
      // host timer publish cannot rewind a friend's winning bid.
      if (typeof live.isPaused === "boolean") {
        room.live = {
          ...room.live,
          isPaused: live.isPaused,
          timerEpoch: Date.now(),
          timeRemaining: live.isPaused
            ? liveWithClock(room).timeRemaining
            : room.live.timeRemaining,
        };
      }
      return snapshot(room);
    });
  },

  async settleLot(
    auctionId: string,
    mode: "auto" | "sold" | "unsold" = "auto"
  ): Promise<RoomSnapshot> {
    return updateById(auctionId, (room) => {
      if (room.auction.status !== "live") {
        throw new Error("Auction is not live");
      }
      progressLive(room);
      settleCurrentLot(room, mode);
      return snapshot(room);
    });
  },

  async forceAdvance(auctionId: string): Promise<RoomSnapshot> {
    return updateById(auctionId, (room) => {
      if (room.auction.status !== "live") {
        throw new Error("Auction is not live");
      }
      progressLive(room);
      if (room.live.overlay.type === "sold" || room.live.overlay.type === "unsold") {
        advanceLot(room);
      } else if (room.live.overlay.type === "bucket") {
        room.live.overlay = { type: "none" };
        room.live.timeRemaining = room.auction.rules.biddingTimer;
        room.live.timerEpoch = Date.now();
        room.live.overlayAt = Date.now();
      } else if (room.live.overlay.type === "none") {
        settleCurrentLot(room, "auto");
      }
      return snapshot(room);
    });
  },

  async updateAuctionStatus(
    auctionId: string,
    status: Auction["status"]
  ): Promise<RoomSnapshot> {
    return updateById(auctionId, (room) => {
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
      return snapshot(room);
    });
  },

  async updateTeamSpend(
    auctionId: string,
    teamId: string,
    amount: number,
    playerId: string
  ): Promise<void> {
    await updateById(auctionId, (room) => {
      assignPlayerToTeam(room, teamId, playerId, amount);
    });
  },
};
