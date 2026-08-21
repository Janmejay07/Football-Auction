"use client";

import { formatCurrency } from "@/lib/utils";
import type { Team } from "@/types/team";
import type { Player } from "@/types/player";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";

function posCount(squad: string[], positions: string[]) {
  return squad.filter((id) => {
    const p = REAL_PLAYERS.find((x) => x.id === id);
    return p && positions.includes(p.position);
  }).length;
}

export function TeamBudgetPanel({ team }: { team: Team | null }) {
  if (!team) {
    return (
      <div className="glass-panel rounded-xl p-4 text-sm text-[var(--muted)]">
        Select a team to see budget.
      </div>
    );
  }

  const remaining = team.budget - team.spent;
  const gk = posCount(team.squad, ["GK"]);
  const def = posCount(team.squad, ["CB", "LB", "RB"]);
  const mid = posCount(team.squad, ["CDM", "CM", "CAM", "LM", "RM"]);
  const fwd = posCount(team.squad, ["LW", "RW", "ST", "CF"]);

  return (
    <div className="glass-panel rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Your Team</p>
      <h3 className="font-display text-2xl" style={{ color: team.color }}>
        {team.name}
      </h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-[var(--muted)]">Budget</p>
          <p className="font-display text-lg">{formatCurrency(team.budget)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--muted)]">Spent</p>
          <p className="font-display text-lg">{formatCurrency(team.spent)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--muted)]">Left</p>
          <p className="font-display text-lg text-[var(--accent)]">
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-[var(--muted)]">
        Squad {team.squad.length} / {team.maxSquadSize}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px] uppercase tracking-wider text-[var(--muted)]">
        <span>GK {gk}/3</span>
        <span>DEF {def}/8</span>
        <span>MID {mid}/8</span>
        <span>FWD {fwd}/5</span>
      </div>
    </div>
  );
}

export function SquadList({
  team,
  onPlayerClick,
}: {
  team: Team | null;
  onPlayerClick?: (player: Player) => void;
}) {
  if (!team) return null;
  const players = team.squad
    .map((id) => REAL_PLAYERS.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  const groups: Record<string, Player[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };

  for (const p of players) {
    if (p.position === "GK") groups.GK.push(p);
    else if (["CB", "LB", "RB"].includes(p.position)) groups.DEF.push(p);
    else if (["LW", "RW", "ST", "CF"].includes(p.position)) groups.FWD.push(p);
    else groups.MID.push(p);
  }

  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className="font-display mb-3 text-lg">My Squad</h3>
      {players.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No players purchased yet.</p>
      )}
      {Object.entries(groups).map(([label, list]) =>
        list.length ? (
          <div key={label} className="mb-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {label}
            </p>
            <ul className="space-y-1">
              {list.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1 text-left text-sm hover:bg-white/5"
                    onClick={() => onPlayerClick?.(p)}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}
