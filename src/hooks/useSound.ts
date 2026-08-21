"use client";

import { useUiStore } from "@/store/uiStore";

export type AuctionSound =
  | "bid"
  | "outbid"
  | "countdown"
  | "sold"
  | "unsold"
  | "start"
  | "notification";

let audioCtx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function beep(freq: number, duration: number, type: OscillatorType = "triangle", gain = 0.05) {
  const ctx = context();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

export function playAuctionSound(kind: AuctionSound) {
  if (!useUiStore.getState().soundEnabled) return;
  switch (kind) {
    case "bid":
      beep(520, 0.12, "triangle", 0.06);
      break;
    case "outbid":
      beep(280, 0.18, "sawtooth", 0.04);
      break;
    case "countdown":
      beep(880, 0.08, "square", 0.035);
      break;
    case "sold":
      beep(220, 0.12);
      setTimeout(() => beep(330, 0.16), 90);
      setTimeout(() => beep(440, 0.22), 180);
      break;
    case "unsold":
      beep(180, 0.25, "sine", 0.04);
      break;
    case "start":
      beep(392, 0.15);
      setTimeout(() => beep(523, 0.2), 140);
      break;
    case "notification":
      beep(660, 0.1, "sine", 0.04);
      break;
  }
}

export function useSoundEnabled() {
  return useUiStore((s) => s.soundEnabled);
}
