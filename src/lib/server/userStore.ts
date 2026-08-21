import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User, UserAuctionHistory, UserProfile } from "@/types/user";
import { getDb } from "@/lib/server/mongo";

export interface UserRecord extends User {
  passwordHash: string;
  createdAt: string;
}

function avatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0B3D2E&color=C8F560&size=256&bold=true&format=png`;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

function publicUser(doc: UserRecord): User {
  return {
    id: doc.id,
    fullName: doc.fullName,
    username: doc.username,
    email: doc.email,
    avatar: doc.avatar,
    favoriteClub: doc.favoriteClub,
    auctionsHosted: doc.auctionsHosted,
    auctionsJoined: doc.auctionsJoined,
    playersBought: doc.playersBought,
    totalSpending: doc.totalSpending,
  };
}

async function users() {
  return (await getDb()).collection<UserRecord & { _id: string }>("users");
}

export const userStore = {
  async signup(input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    favoriteClub?: string;
  }): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const col = await users();
    const existing = await col.findOne({
      $or: [{ email }, { username }],
    });
    if (existing) {
      throw new Error(
        existing.email === email
          ? "An account with this email already exists"
          : "That username is taken"
      );
    }

    const id = `user-${email.replace(/[^a-z0-9]/g, "-")}`;
    const record: UserRecord & { _id: string } = {
      _id: id,
      id,
      fullName: input.fullName.trim(),
      username,
      email,
      passwordHash: hashPassword(input.password),
      avatar: avatar(input.fullName.trim()),
      favoriteClub: input.favoriteClub?.trim() || undefined,
      auctionsHosted: 0,
      auctionsJoined: 0,
      playersBought: 0,
      totalSpending: 0,
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(record);
    return publicUser(record);
  },

  async login(emailRaw: string, password: string): Promise<User> {
    const email = emailRaw.trim().toLowerCase();
    const col = await users();
    const doc = await col.findOne({ email });
    if (!doc || !verifyPassword(password, doc.passwordHash)) {
      throw new Error("Invalid email or password");
    }
    return publicUser(doc);
  },

  async bumpHosted(userId: string) {
    const col = await users();
    await col.updateOne({ _id: userId }, { $inc: { auctionsHosted: 1 } });
  },

  async bumpJoined(userId: string) {
    const col = await users();
    await col.updateOne({ _id: userId }, { $inc: { auctionsJoined: 1 } });
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await (await users()).findOne({ _id: userId });
    if (!user) throw new Error("User not found");

    const rooms = await (await getDb())
      .collection<{
        auction: UserAuctionHistory & { hostId: string; createdAt: string };
        teams: Array<{
          id: string;
          managerId?: string;
          name: string;
          squad: string[];
          spent: number;
          budget: number;
        }>;
        participants: Array<{ userId: string }>;
      }>("rooms")
      .find({ "participants.userId": userId })
      .sort({ "auction.createdAt": -1 })
      .toArray();

    const auctionHistory: UserAuctionHistory[] = rooms.map((room) => {
      const team = room.teams.find((item) => item.managerId === userId);
      return {
        auctionId: room.auction.auctionId ?? "",
        auctionName: room.auction.auctionName ?? "Auction",
        roomCode: room.auction.roomCode ?? "",
        status: room.auction.status ?? "waiting",
        teamId: team?.id,
        teamName: team?.name,
        squad: team?.squad ?? [],
        spent: team?.spent ?? 0,
        budget: team?.budget ?? 0,
        joinedAt: room.auction.createdAt,
        isHost: room.auction.hostId === userId,
      };
    });

    const currentSquads = auctionHistory.filter(
      (item) => item.status !== "completed" && item.status !== "cancelled"
    );
    const previousSquads = auctionHistory.filter(
      (item) => item.status === "completed" || item.status === "cancelled"
    );
    const playersBought = auctionHistory.reduce((sum, item) => sum + item.squad.length, 0);
    const totalSpending = auctionHistory.reduce((sum, item) => sum + item.spent, 0);

    return {
      ...publicUser(user),
      auctionsHosted: auctionHistory.filter((item) => item.isHost).length,
      auctionsJoined: auctionHistory.length,
      playersBought,
      totalSpending,
      currentSquads,
      previousSquads,
      auctionHistory,
    };
  },
};
