import type { Player } from "@/types/player";
import { REAL_PLAYERS, getPlayerById, getPlayersByBucket } from "@/lib/loadRealPlayers";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export interface PlayerFilters {
  search?: string;
  position?: string;
  nationality?: string;
  bucket?: string;
  minRating?: number;
  maxAge?: number;
  maxMarketValue?: number;
}

export const playerService = {
  async getPlayers(filters?: PlayerFilters): Promise<Player[]> {
    await delay();
    let players = [...REAL_PLAYERS];
    if (!filters) return players;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      players = players.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.currentClub.toLowerCase().includes(q) ||
          p.nationality.toLowerCase().includes(q)
      );
    }
    if (filters.position) players = players.filter((p) => p.position === filters.position);
    if (filters.nationality)
      players = players.filter((p) => p.nationality === filters.nationality);
    if (filters.bucket) players = players.filter((p) => p.bucket === filters.bucket);
    if (filters.minRating) players = players.filter((p) => p.rating >= filters.minRating!);
    if (filters.maxAge) players = players.filter((p) => p.age <= filters.maxAge!);
    if (filters.maxMarketValue)
      players = players.filter((p) => p.marketValue <= filters.maxMarketValue!);

    return players;
  },

  async getPlayer(id: string): Promise<Player> {
    await delay(200);
    const player = getPlayerById(id);
    if (!player) throw new Error("Player not found");
    return player;
  },

  async getByBucket(bucket: string): Promise<Player[]> {
    await delay(200);
    return getPlayersByBucket(bucket);
  },
};
