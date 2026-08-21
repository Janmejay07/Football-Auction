"use client";

import { create } from "zustand";

interface UiState {
  soundEnabled: boolean;
  chatDrawerOpen: boolean;
  bidHistoryOpen: boolean;
  participantsOpen: boolean;
  selectedPlayerId: string | null;
  confirmModal: {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm?: () => void;
  };
  toggleSound: () => void;
  setChatDrawerOpen: (open: boolean) => void;
  setBidHistoryOpen: (open: boolean) => void;
  setParticipantsOpen: (open: boolean) => void;
  setSelectedPlayerId: (id: string | null) => void;
  openConfirm: (opts: {
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }) => void;
  closeConfirm: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  soundEnabled: true,
  chatDrawerOpen: false,
  bidHistoryOpen: false,
  participantsOpen: false,
  selectedPlayerId: null,
  confirmModal: {
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
  },

  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  setChatDrawerOpen: (open) => set({ chatDrawerOpen: open }),
  setBidHistoryOpen: (open) => set({ bidHistoryOpen: open }),
  setParticipantsOpen: (open) => set({ participantsOpen: open }),
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),

  openConfirm: ({ title, description, confirmLabel = "Confirm", onConfirm }) =>
    set({
      confirmModal: { open: true, title, description, confirmLabel, onConfirm },
    }),

  closeConfirm: () =>
    set((s) => ({
      confirmModal: { ...s.confirmModal, open: false, onConfirm: undefined },
    })),
}));
