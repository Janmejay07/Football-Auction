import type { PlayerBucketId } from "./player";

export type AuctionStatus =
  | "draft"
  | "waiting"
  | "lobby"
  | "live"
  | "paused"
  | "completed"
  | "cancelled";

export type AuctionVisibility = "public" | "private";

export type CancellationReason =
  | "heartbeat_timeout"
  | "host_left"
  | "host_cancelled";

export interface PlayerBucket {
  id: PlayerBucketId;
  name: string;
  enabled: boolean;
  order: number;
  playerIds: string[];
}

export interface AuctionRules {
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

export interface AuctionConfig {
  name: string;
  description: string;
  visibility: AuctionVisibility;
  teamCount: number;
  startingBudget: number;
  buckets: PlayerBucket[];
  rules: AuctionRules;
}

export interface Participant {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  teamId?: string;
  teamName?: string;
  isHost: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  isConnected: boolean;
  lastBidAmount?: number;
}

export interface Auction {
  id: string;
  roomCode: string;
  name: string;
  description: string;
  visibility: AuctionVisibility;
  status: AuctionStatus;
  hostId: string;
  hostName: string;
  teamCount: number;
  startingBudget: number;
  buckets: PlayerBucket[];
  rules: AuctionRules;
  participantIds: string[];
  teamIds: string[];
  currentBucketIndex: number;
  currentPlayerIndex: number;
  playersRemaining: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  cancellationReason?: CancellationReason;
  winnerTeamId?: string;
}

export interface ChatMessage {
  id: string;
  auctionId: string;
  type: "normal" | "system" | "bid";
  senderId?: string;
  senderName?: string;
  content: string;
  timestamp: number;
}

export interface AuctionHistoryItem {
  playerId: string;
  playerName: string;
  status: "sold" | "unsold";
  winnerTeamId?: string;
  winnerTeamName?: string;
  price?: number;
  timestamp: string;
}

export interface AuctionStats {
  mostExpensivePlayer?: { playerId: string; name: string; price: number };
  mostBids?: { playerId: string; name: string; bidCount: number };
  mostActiveTeam?: { teamId: string; name: string };
  biggestSpending?: { teamId: string; name: string; spent: number };
  averagePlayerPrice: number;
  totalSpending: number;
  playersSold: number;
  playersUnsold: number;
}
