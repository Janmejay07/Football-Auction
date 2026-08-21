"use client";

import { create } from "zustand";
import type { ChatMessage } from "@/types/auction";
import { chatService } from "@/lib/services/chatService";

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  loadMessages: (auctionId: string) => Promise<void>;
  sendMessage: (input: {
    auctionId: string;
    content: string;
    senderId: string;
    senderName: string;
  }) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),

  loadMessages: async (auctionId) => {
    const messages = await chatService.getMessages(auctionId);
    set({ messages });
  },

  sendMessage: async (input) => {
    const message = await chatService.sendMessage(input);
    set((state) => ({ messages: [...state.messages, message] }));
  },

  addMessage: (message) =>
    set((state) => ({
      messages: state.messages.some((m) => m.id === message.id)
        ? state.messages
        : [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),
}));
