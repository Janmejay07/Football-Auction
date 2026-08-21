"use client";

import { create } from "zustand";

interface MediaState {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (userId: string, stream: MediaStream | null) => void;
  clearRemotes: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  localStream: null,
  remoteStreams: {},
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (userId, stream) =>
    set((s) => {
      const next = { ...s.remoteStreams };
      if (stream) next[userId] = stream;
      else delete next[userId];
      return { remoteStreams: next };
    }),
  clearRemotes: () => set({ remoteStreams: {} }),
}));
