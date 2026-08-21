import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(millions: number): string {
  if (millions >= 1000) {
    return `€${(millions / 1000).toFixed(1)}B`;
  }
  if (Number.isInteger(millions)) {
    return `€${millions}M`;
  }
  return `€${millions.toFixed(1)}M`;
}

export function generateRoomCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatRelativeTime(secondsAgo: number): string {
  if (secondsAgo < 1) return "just now";
  if (secondsAgo < 60) return `${secondsAgo} sec ago`;
  const mins = Math.floor(secondsAgo / 60);
  return `${mins} min ago`;
}

export function authRedirectPath(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
