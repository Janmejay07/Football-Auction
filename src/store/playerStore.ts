"use client";

import { create } from "zustand";
import type { Player } from "@/types/player";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";
import { playerService, type PlayerFilters } from "@/lib/services/playerService";

interface PlayerState {
  players: Player[];
  selectedPlayer: Player | null;
  isLoading: boolean;
  loadPlayers: (filters?: PlayerFilters) => Promise<void>;
  selectPlayer: (player: Player | null) => void;
  getPlayerById: (id: string) => Player | undefined;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  players: REAL_PLAYERS,
  selectedPlayer: null,
  isLoading: false,

  loadPlayers: async (filters) => {
    set({ isLoading: true });
    const players = await playerService.getPlayers(filters);
    set({ players, isLoading: false });
  },

  selectPlayer: (player) => set({ selectedPlayer: player }),

  getPlayerById: (id) => get().players.find((p) => p.id === id),
}));
