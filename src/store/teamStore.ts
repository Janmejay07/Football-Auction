"use client";

import { create } from "zustand";
import type { Team } from "@/types/team";
import { teamService } from "@/lib/services/teamService";

interface TeamState {
  teams: Team[];
  myTeamId: string | null;
  setTeams: (teams: Team[]) => void;
  setMyTeamId: (id: string | null) => void;
  loadTeams: (auctionId?: string) => Promise<void>;
  claimTeam: (
    auctionId: string,
    teamId: string,
    managerId: string,
    managerName: string
  ) => Promise<void>;
  updateTeamSpend: (teamId: string, amount: number, playerId: string) => void;
  getMyTeam: () => Team | null;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  myTeamId: null,

  setTeams: (teams) => set({ teams }),
  setMyTeamId: (id) => set({ myTeamId: id }),

  loadTeams: async (auctionId?: string) => {
    if (!auctionId) {
      set({ teams: [] });
      return;
    }
    const teams = await teamService.getTeams(auctionId);
    set({ teams });
  },

  claimTeam: async (auctionId, teamId, managerId, managerName) => {
    const room = await teamService.claimTeam(auctionId, teamId, managerId, managerName);
    set({
      teams: room.teams,
      myTeamId: teamId,
    });
  },

  updateTeamSpend: (teamId, amount, playerId) => {
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === teamId
          ? {
              ...t,
              spent: t.spent + amount,
              squad: [...t.squad, playerId],
            }
          : t
      ),
    }));
  },

  getMyTeam: () => {
    const { teams, myTeamId } = get();
    return teams.find((t) => t.id === myTeamId) ?? null;
  },
}));
