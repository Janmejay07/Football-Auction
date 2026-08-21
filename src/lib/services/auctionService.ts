import type { Auction, AuctionConfig } from "@/types/auction";
import type { RoomSnapshot } from "@/types/room";
import { api } from "@/lib/api";

export const auctionService = {
  async listAuctions(): Promise<Auction[]> {
    const data = await api<{ auctions: Auction[] }>("/api/rooms");
    return data.auctions;
  },

  async getAuction(auctionId: string, userId?: string): Promise<RoomSnapshot> {
    const q = userId ? `?for=${encodeURIComponent(userId)}` : "";
    return api<RoomSnapshot>(`/api/rooms/${auctionId}${q}`);
  },

  async getByCode(code: string, userId?: string): Promise<RoomSnapshot> {
    const q = userId ? `?for=${encodeURIComponent(userId)}` : "";
    return api<RoomSnapshot>(`/api/rooms/code/${encodeURIComponent(code.trim())}${q}`);
  },

  async createAuction(
    config: AuctionConfig,
    hostId: string,
    hostName: string
  ): Promise<RoomSnapshot> {
    return api<RoomSnapshot>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ config, hostId, hostName }),
    });
  },

  async joinAuction(input: {
    code: string;
    userId: string;
    userName: string;
    teamId?: string;
    teamName?: string;
  }): Promise<RoomSnapshot> {
    const lookup = await this.getByCode(input.code);
    return api<RoomSnapshot>(`/api/rooms/${lookup.auction.id}`, {
      method: "POST",
      body: JSON.stringify({ action: "join", ...input }),
    });
  },

  async startAuction(auctionId: string, userId: string): Promise<RoomSnapshot> {
    return api<RoomSnapshot>(`/api/rooms/${auctionId}`, {
      method: "POST",
      body: JSON.stringify({ action: "start", userId }),
    });
  },

  async leaveAuction(auctionId: string, userId: string): Promise<RoomSnapshot> {
    return api<RoomSnapshot>(`/api/rooms/${auctionId}`, {
      method: "POST",
      body: JSON.stringify({ action: "leave", userId }),
    });
  },

  async postAction(auctionId: string, body: Record<string, unknown>) {
    return api<RoomSnapshot>(`/api/rooms/${auctionId}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

};
