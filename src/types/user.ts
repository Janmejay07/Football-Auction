export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatar?: string;
  favoriteClub?: string;
  auctionsHosted: number;
  auctionsJoined: number;
  playersBought: number;
  totalSpending: number;
}

export interface UserAuctionHistory {
  auctionId: string;
  auctionName: string;
  roomCode: string;
  status: string;
  teamId?: string;
  teamName?: string;
  squad: string[];
  spent: number;
  budget: number;
  joinedAt: string;
  isHost: boolean;
}

export interface UserProfile extends User {
  auctionsHosted: number;
  auctionsJoined: number;
  playersBought: number;
  totalSpending: number;
  currentSquads: UserAuctionHistory[];
  previousSquads: UserAuctionHistory[];
  auctionHistory: UserAuctionHistory[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  favoriteClub?: string;
}
