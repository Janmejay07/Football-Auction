export type PlayerPosition =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "ST"
  | "CF";

export type PlayerBucketId =
  | "goalkeepers"
  | "defenders"
  | "midfielders"
  | "wingers"
  | "forwards"
  | string;

export interface PlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  minutes: number;
  cleanSheets?: number;
}

export interface Player {
  id: string;
  name: string;
  image: string;
  nationality: string;
  nationalityFlag: string;
  position: PlayerPosition;
  rating: number;
  age: number;
  currentClub: string;
  marketValue: number;
  basePrice: number;
  bucket: PlayerBucketId;
  stats: PlayerStats;
}

export interface SoldPlayer {
  playerId: string;
  teamId: string;
  price: number;
  soldAt: string;
}
