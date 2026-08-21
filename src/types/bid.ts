export interface Bid {
  id: string;
  auctionId: string;
  playerId: string;
  teamId: string;
  teamName: string;
  amount: number;
  timestamp: number;
  userId?: string;
}

export interface BidResult {
  success: boolean;
  bid?: Bid;
  error?: string;
}
