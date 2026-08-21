import type { Team } from "@/types/team";
import { api } from "@/lib/api";
import type { RoomSnapshot } from "@/types/room";

export const teamService = {
  async getTeams(auctionId?: string): Promise<Team[]> {
    if (!auctionId) return [];
    const room = await api<RoomSnapshot>(`/api/rooms/${auctionId}`);
    return room.teams;
  },

  async getTeam(teamId: string, auctionId?: string): Promise<Team> {
    if (!auctionId) throw new Error("Team not found");
    const teams = await this.getTeams(auctionId);
    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error("Team not found");
    return team;
  },

  async claimTeam(
    auctionId: string,
    teamId: string,
    managerId: string,
    managerName: string
  ): Promise<RoomSnapshot> {
    return api<RoomSnapshot>(`/api/rooms/${auctionId}`, {
      method: "POST",
      body: JSON.stringify({
        action: "claim-team",
        teamId,
        userId: managerId,
        userName: managerName,
      }),
    });
  },
};
