import type { ChatMessage } from "@/types/auction";
import { api } from "@/lib/api";
import type { RoomSnapshot } from "@/types/room";

export const chatService = {
  async getMessages(auctionId: string): Promise<ChatMessage[]> {
    const room = await api<RoomSnapshot>(`/api/rooms/${auctionId}`);
    return room.messages;
  },

  async sendMessage(input: {
    auctionId: string;
    content: string;
    senderId: string;
    senderName: string;
    type?: ChatMessage["type"];
  }): Promise<ChatMessage> {
    const data = await api<{ message: ChatMessage }>(`/api/rooms/${input.auctionId}`, {
      method: "POST",
      body: JSON.stringify({ action: "chat", ...input }),
    });
    return data.message;
  },

  async sendSystemMessage(auctionId: string, content: string): Promise<ChatMessage> {
    return this.sendMessage({
      auctionId,
      content,
      senderId: "system",
      senderName: "System",
      type: "system",
    });
  },
};
