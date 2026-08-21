import type { Auction, AuctionHistoryItem, ChatMessage, Participant } from "./auction";
import type { Bid } from "./bid";
import type { Team } from "./team";

export interface LiveSyncState {
  currentBucketIndex: number;
  currentPlayerId: string | null;
  currentBid: number;
  highestBidder: { teamId: string; teamName: string } | null;
  timeRemaining: number;
  timerEpoch: number;
  overlayAt?: number;
  soldPlayerIds: string[];
  unsoldPlayerIds: string[];
  isPaused: boolean;
  overlay:
    | { type: "none" }
    | { type: "sold"; playerId: string; price: number; teamName: string; teamId?: string }
    | { type: "unsold"; playerId: string }
    | { type: "bucket"; from: string; to: string };
}

export interface RtcSignal {
  id: string;
  from: string;
  to: string;
  type: "offer" | "answer" | "ice";
  payload: unknown;
}

export interface RoomSnapshot {
  rev: number;
  auction: Auction;
  teams: Team[];
  participants: Participant[];
  messages: ChatMessage[];
  bids: Bid[];
  history: AuctionHistoryItem[];
  live: LiveSyncState;
  signals: RtcSignal[];
}
