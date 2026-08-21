import type { PlayerBucket } from "@/types/auction";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";

export const DEFAULT_BUCKETS: PlayerBucket[] = [
  {
    id: "goalkeepers",
    name: "Goalkeepers",
    enabled: true,
    order: 1,
    playerIds: REAL_PLAYERS.filter((p) => p.bucket === "goalkeepers").map((p) => p.id),
  },
  {
    id: "defenders",
    name: "Defenders",
    enabled: true,
    order: 2,
    playerIds: REAL_PLAYERS.filter((p) => p.bucket === "defenders").map((p) => p.id),
  },
  {
    id: "midfielders",
    name: "Midfielders",
    enabled: true,
    order: 3,
    playerIds: REAL_PLAYERS.filter((p) => p.bucket === "midfielders").map((p) => p.id),
  },
  {
    id: "wingers",
    name: "Wingers",
    enabled: true,
    order: 4,
    playerIds: REAL_PLAYERS.filter((p) => p.bucket === "wingers").map((p) => p.id),
  },
  {
    id: "forwards",
    name: "Forwards",
    enabled: true,
    order: 5,
    playerIds: REAL_PLAYERS.filter((p) => p.bucket === "forwards").map((p) => p.id),
  },
];
