import type { Player } from "@/types/player";
import playerData from "../../json/premier-league-2026-27.json";

type PlayerPosition =
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

const positionMap: Record<string, PlayerPosition> = {
  Goalkeeper: "GK",
  Defender: "CB",
  Midfielder: "CM",
  Forward: "ST",
};

const bucketMap: Record<string, string> = {
  GK: "goalkeepers",
  CB: "defenders",
  LB: "defenders",
  RB: "defenders",
  CDM: "midfielders",
  CM: "midfielders",
  CAM: "midfielders",
  LM: "midfielders",
  RM: "midfielders",
  LW: "wingers",
  RW: "wingers",
  ST: "forwards",
  CF: "forwards",
};

interface RawPlayer {
  playerId: number;
  playerName: string;
  firstName: string;
  lastName: string;
  position: string;
  age: number | null;
  nationality: string | null;
  imageUrl: string;
}

interface RawClub {
  clubName: string;
  logoUrl: string;
  players: RawPlayer[];
}

interface RawData {
  clubs: RawClub[];
}

export function loadRealPlayers(): Player[] {
  const data = playerData as RawData;
  const players: Player[] = [];

  data.clubs.forEach((club: RawClub) => {
    club.players.forEach((rawPlayer: RawPlayer) => {
      const position = positionMap[rawPlayer.position] || "CM";
      const bucket = bucketMap[position] || "midfielders";

      const player: Player = {
        id: `p-${rawPlayer.playerId}`,
        name: rawPlayer.playerName,
        image: rawPlayer.imageUrl,
        nationality: rawPlayer.nationality || "Unknown",
        nationalityFlag: "🌍",
        position: position as PlayerPosition,
        rating: 75 + Math.floor(Math.random() * 15), // Generate rating between 75-90
        age: rawPlayer.age || 25,
        currentClub: club.clubName,
        marketValue: 20 + Math.floor(Math.random() * 80), // Generate market value between 20-100
        basePrice: 5 + Math.floor(Math.random() * 45), // Generate base price between 5-50
        bucket,
        stats: {
          appearances: Math.floor(Math.random() * 200) + 50,
          goals: position === "ST" || position === "CF" ? Math.floor(Math.random() * 100) + 10 : Math.floor(Math.random() * 30),
          assists: Math.floor(Math.random() * 50),
          minutes: Math.floor(Math.random() * 5000) + 1000,
          cleanSheets: position === "GK" ? Math.floor(Math.random() * 50) : undefined,
        },
      };

      players.push(player);
    });
  });

  return players;
}

export function getPlayerById(id: string): Player | undefined {
  return loadRealPlayers().find((p) => p.id === id);
}

export function getPlayersByBucket(bucket: string): Player[] {
  return loadRealPlayers().filter((p) => p.bucket === bucket);
}

export const REAL_PLAYERS = loadRealPlayers();
