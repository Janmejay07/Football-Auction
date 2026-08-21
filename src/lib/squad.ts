import type { Player, PlayerPosition } from "@/types/player";

export type PositionGroup = "GK" | "DEF" | "MID" | "FWD";

export const GROUP_LIMITS: Record<PositionGroup, number> = {
  GK: 3,
  DEF: 8,
  MID: 8,
  FWD: 5,
};

export function positionGroup(position: PlayerPosition): PositionGroup {
  if (position === "GK") return "GK";
  if (position === "CB" || position === "LB" || position === "RB") return "DEF";
  if (position === "LW" || position === "RW" || position === "ST" || position === "CF")
    return "FWD";
  return "MID";
}

export function countGroups(players: Player[]): Record<PositionGroup, number> {
  const counts: Record<PositionGroup, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const player of players) {
    counts[positionGroup(player.position)] += 1;
  }
  return counts;
}

export type FormationId = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "4-3-2-1";

export interface PitchSlot {
  id: string;
  label: PlayerPosition | "CM" | "CAM" | "CDM" | "LM" | "RM";
  x: number;
  y: number;
}

export const FORMATIONS: Record<FormationId, PitchSlot[]> = {
  "4-3-3": [
    { id: "st", label: "ST", x: 50, y: 10 },
    { id: "lw", label: "LW", x: 18, y: 22 },
    { id: "rw", label: "RW", x: 82, y: 22 },
    { id: "cm1", label: "CM", x: 32, y: 44 },
    { id: "cm2", label: "CM", x: 50, y: 40 },
    { id: "cm3", label: "CM", x: 68, y: 44 },
    { id: "lb", label: "LB", x: 14, y: 68 },
    { id: "cb1", label: "CB", x: 36, y: 72 },
    { id: "cb2", label: "CB", x: 64, y: 72 },
    { id: "rb", label: "RB", x: 86, y: 68 },
    { id: "gk", label: "GK", x: 50, y: 90 },
  ],
  "4-4-2": [
    { id: "st1", label: "ST", x: 35, y: 12 },
    { id: "st2", label: "ST", x: 65, y: 12 },
    { id: "lm", label: "LM", x: 14, y: 38 },
    { id: "cm1", label: "CM", x: 38, y: 40 },
    { id: "cm2", label: "CM", x: 62, y: 40 },
    { id: "rm", label: "RM", x: 86, y: 38 },
    { id: "lb", label: "LB", x: 14, y: 68 },
    { id: "cb1", label: "CB", x: 36, y: 72 },
    { id: "cb2", label: "CB", x: 64, y: 72 },
    { id: "rb", label: "RB", x: 86, y: 68 },
    { id: "gk", label: "GK", x: 50, y: 90 },
  ],
  "4-2-3-1": [
    { id: "st", label: "ST", x: 50, y: 10 },
    { id: "lw", label: "LW", x: 18, y: 28 },
    { id: "cam", label: "CAM", x: 50, y: 30 },
    { id: "rw", label: "RW", x: 82, y: 28 },
    { id: "cdm1", label: "CDM", x: 35, y: 50 },
    { id: "cdm2", label: "CDM", x: 65, y: 50 },
    { id: "lb", label: "LB", x: 14, y: 68 },
    { id: "cb1", label: "CB", x: 36, y: 72 },
    { id: "cb2", label: "CB", x: 64, y: 72 },
    { id: "rb", label: "RB", x: 86, y: 68 },
    { id: "gk", label: "GK", x: 50, y: 90 },
  ],
  "3-5-2": [
    { id: "st1", label: "ST", x: 38, y: 12 },
    { id: "st2", label: "ST", x: 62, y: 12 },
    { id: "lm", label: "LM", x: 12, y: 40 },
    { id: "cm1", label: "CM", x: 35, y: 38 },
    { id: "cm2", label: "CM", x: 50, y: 44 },
    { id: "cm3", label: "CM", x: 65, y: 38 },
    { id: "rm", label: "RM", x: 88, y: 40 },
    { id: "cb1", label: "CB", x: 28, y: 70 },
    { id: "cb2", label: "CB", x: 50, y: 74 },
    { id: "cb3", label: "CB", x: 72, y: 70 },
    { id: "gk", label: "GK", x: 50, y: 90 },
  ],
  "4-3-2-1": [
    { id: "st", label: "ST", x: 50, y: 10 },
    { id: "cam1", label: "CAM", x: 32, y: 26 },
    { id: "cam2", label: "CAM", x: 68, y: 26 },
    { id: "cm1", label: "CM", x: 28, y: 46 },
    { id: "cm2", label: "CM", x: 50, y: 50 },
    { id: "cm3", label: "CM", x: 72, y: 46 },
    { id: "lb", label: "LB", x: 14, y: 68 },
    { id: "cb1", label: "CB", x: 36, y: 72 },
    { id: "cb2", label: "CB", x: 64, y: 72 },
    { id: "rb", label: "RB", x: 86, y: 68 },
    { id: "gk", label: "GK", x: 50, y: 90 },
  ],
};

const SLOT_PRIORITY: Record<string, PlayerPosition[]> = {
  ST: ["ST", "CF"],
  CF: ["CF", "ST"],
  LW: ["LW", "LM", "ST"],
  RW: ["RW", "RM", "ST"],
  CAM: ["CAM", "CM"],
  CM: ["CM", "CAM", "CDM"],
  CDM: ["CDM", "CM"],
  LM: ["LM", "LW", "CM"],
  RM: ["RM", "RW", "CM"],
  LB: ["LB", "CB"],
  RB: ["RB", "CB"],
  CB: ["CB", "LB", "RB"],
  GK: ["GK"],
};

export function assignFormation(players: Player[], formation: FormationId): (Player | null)[] {
  const slots = FORMATIONS[formation];
  const unused = [...players];
  return slots.map((slot) => {
    const prefs = SLOT_PRIORITY[slot.label] ?? [slot.label as PlayerPosition];
    for (const pos of prefs) {
      const idx = unused.findIndex((p) => p.position === pos);
      if (idx >= 0) {
        const [picked] = unused.splice(idx, 1);
        return picked;
      }
    }
    return unused.shift() ?? null;
  });
}
