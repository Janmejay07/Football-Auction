export interface Team {
  id: string;
  auctionId?: string;
  name: string;
  logo: string;
  color: string;
  managerName?: string;
  managerId?: string;
  budget: number;
  spent: number;
  squad: string[];
  maxSquadSize: number;
  isAvailable: boolean;
}

export interface TeamPerformance {
  teamId: string;
  playersCount: number;
  budgetUsedPercent: number;
  bestPurchase?: { playerId: string; price: number };
  mostExpensive?: { playerId: string; price: number };
  averageCost: number;
  rank: number;
}
