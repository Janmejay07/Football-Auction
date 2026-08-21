import { ObjectId } from "mongodb";

/**
 * MongoDB Collection Schemas
 * Defines the structure of documents in each collection
 */

// ============================================================================
// AUCTIONS Collection
// ============================================================================
export interface AuctionDocument {
  _id?: ObjectId;
  roomCode: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  status: "draft" | "waiting" | "lobby" | "live" | "paused" | "completed" | "cancelled";
  hostId: string;
  hostName: string;
  teamCount: number;
  startingBudget: number;
  buckets: PlayerBucketDocument[];
  rules: AuctionRulesDocument;
  participantIds: string[];
  teamIds: string[];
  currentBucketIndex: number;
  currentPlayerIndex: number;
  playersRemaining: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  winnerTeamId?: string;
}

export interface PlayerBucketDocument {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  playerIds: string[];
}

export interface AuctionRulesDocument {
  baseBid: number;
  minIncrement: number;
  biddingTimer: number;
  maxSquadSize: number;
  enableTimerReset: boolean;
  enableAutoBid: boolean;
  enableVoiceChat: boolean;
  enableCamera: boolean;
  enableSpectators: boolean;
  showPlayerStatistics: boolean;
  showMarketValue: boolean;
}

// ============================================================================
// TEAMS Collection
// ============================================================================
export interface TeamDocument {
  _id?: ObjectId;
  auctionId: string;
  name: string;
  logo: string;
  color: string;
  managerName?: string;
  managerId?: string;
  budget: number;
  spent: number;
  squad: string[]; // Player IDs
  maxSquadSize: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PLAYERS Collection
// ============================================================================
export interface PlayerDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  position: string;
  club: string;
  clubLogo: string;
  age: number;
  jersey: number;
  marketValue: number;
  basePrice: number;
  stats: {
    goals: number;
    assists: number;
    appearances: number;
    rating: number;
  };
  bucket: "goalkeepers" | "defenders" | "midfielders" | "wingers" | "forwards";
  createdAt: Date;
}

// ============================================================================
// BIDS Collection
// ============================================================================
export interface BidDocument {
  _id?: ObjectId;
  auctionId: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: Date;
  isWinningBid: boolean;
}

// ============================================================================
// USERS Collection
// ============================================================================
export interface UserDocument {
  _id?: ObjectId;
  id: string;
  email: string;
  fullName: string;
  username?: string;
  password?: string; // hashed
  avatar?: string;
  favoriteClub?: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

// ============================================================================
// AUCTION HISTORY Collection
// ============================================================================
export interface AuctionHistoryDocument {
  _id?: ObjectId;
  auctionId: string;
  playerId: string;
  playerName: string;
  status: "sold" | "unsold";
  winnerTeamId?: string;
  winnerTeamName?: string;
  finalPrice?: number;
  bidsCount: number;
  duration: number; // in seconds
  timestamp: Date;
}

// ============================================================================
// CHAT MESSAGES Collection
// ============================================================================
export interface ChatMessageDocument {
  _id?: ObjectId;
  auctionId: string;
  type: "normal" | "system" | "bid";
  senderId?: string;
  senderName?: string;
  content: string;
  timestamp: Date;
}
