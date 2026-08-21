"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlayerProfileModal } from "@/components/player/PlayerProfileModal";
import {
  FORMATIONS,
  assignFormation,
  type FormationId,
} from "@/lib/squad";
import type { Player } from "@/types/player";

interface SquadPitchProps {
  players: Player[];
  teamName: string;
}

const FORMATION_OPTIONS: FormationId[] = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-5-2",
  "4-3-2-1",
];

export function SquadPitch({ players, teamName }: SquadPitchProps) {
  const [formation, setFormation] = useState<FormationId>("4-3-3");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const slots = FORMATIONS[formation];
  const assignedPlayers = useMemo(
    () => assignFormation(players, formation),
    [players, formation]
  );

  // Determine bench / reserves (players who were not assigned to the starting 11)
  const startingPlayerIds = new Set(
    assignedPlayers.filter((p): p is Player => p !== null).map((p) => p.id)
  );
  const benchPlayers = players.filter((p) => !startingPlayerIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Formation Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <h3 className="font-display text-2xl tracking-wide text-white">Tactical Pitch</h3>
          <p className="text-xs text-[var(--muted)]">
            Active Formation: <span className="text-[var(--accent)] font-semibold">{formation}</span> · Starting XI ({Math.min(11, players.length)}/11)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FORMATION_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormation(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                formation === f
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg shadow-[var(--accent)]/20"
                  : "bg-white/5 text-[var(--muted)] hover:bg-white/10 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Realistic Football Pitch Arena */}
      <div className="relative mx-auto aspect-[3/4] max-w-[640px] overflow-hidden rounded-3xl border-4 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Grass Pattern Background */}
        <div className="absolute inset-0 pitch-pattern" />

        {/* Pitch Markings SVG */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none stroke-white/40 fill-none"
          strokeWidth="2"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
        >
          {/* Outer Border */}
          <rect x="15" y="15" width="270" height="370" />

          {/* Halfway Line */}
          <line x1="15" y1="200" x2="285" y2="200" />

          {/* Center Circle & Spot */}
          <circle cx="150" cy="200" r="35" />
          <circle cx="150" cy="200" r="2.5" fill="rgba(255,255,255,0.7)" />

          {/* Top Penalty Area (Opponent Box) */}
          <rect x="75" y="15" width="150" height="60" />
          <rect x="110" y="15" width="80" height="22" />
          <circle cx="150" cy="52" r="2" fill="rgba(255,255,255,0.7)" />
          <path d="M 120 75 A 30 30 0 0 0 180 75" />

          {/* Bottom Penalty Area (Own Box) */}
          <rect x="75" y="325" width="150" height="60" />
          <rect x="110" y="363" width="80" height="22" />
          <circle cx="150" cy="348" r="2" fill="rgba(255,255,255,0.7)" />
          <path d="M 120 325 A 30 30 0 0 1 180 325" />

          {/* Corner Arcs */}
          <path d="M 15 25 A 10 10 0 0 0 25 15" />
          <path d="M 275 15 A 10 10 0 0 0 285 25" />
          <path d="M 15 375 A 10 10 0 0 1 25 385" />
          <path d="M 275 385 A 10 10 0 0 1 285 375" />
        </svg>

        {/* Pitch Lighting Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/10 to-black/40 pointer-events-none" />

        {/* Slotted Formation Players */}
        {slots.map((slot, index) => {
          const player = assignedPlayers[index];
          return (
            <div
              key={slot.id}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="absolute z-10 flex flex-col items-center"
            >
              {player ? (
                <motion.button
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPlayer(player)}
                  className="group flex flex-col items-center focus:outline-none"
                >
                  <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[var(--accent)] bg-black/90 p-0.5 shadow-xl transition-transform group-hover:border-white">
                    <Image
                      src={player.image}
                      alt={player.name}
                      fill
                      className="rounded-full object-cover"
                      sizes="56px"
                      unoptimized
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] font-display text-[11px] font-bold text-[var(--accent-foreground)] shadow">
                      {player.rating}
                    </div>
                  </div>

                  <div className="mt-1 flex flex-col items-center rounded-md bg-black/85 px-2 py-0.5 backdrop-blur shadow">
                    <span className="max-w-[72px] truncate text-[11px] font-bold text-white leading-tight">
                      {player.name.split(" ").slice(-1)[0]}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {slot.label}
                    </span>
                  </div>
                </motion.button>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-dashed border-white/30 bg-black/40 text-white/50 backdrop-blur">
                    <span className="text-[11px] font-bold">{slot.label}</span>
                  </div>
                  <span className="mt-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white/50">
                    Empty
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Substitutes / Bench Section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--accent)]" />
            <h4 className="font-display text-xl tracking-wide text-white">
              Substitutes & Reserves ({benchPlayers.length})
            </h4>
          </div>
          <span className="text-xs text-[var(--muted)]">Click any player to inspect bio</span>
        </div>

        {benchPlayers.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-[var(--muted)]">
            No reserve players currently on the bench.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {benchPlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => setSelectedPlayer(player)}
                className="glass-panel group flex items-center gap-2.5 rounded-xl p-2.5 text-left transition hover:border-[var(--accent)]/50"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/50">
                  <Image
                    src={player.image}
                    alt={player.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                  <div className="absolute bottom-0 right-0 rounded bg-black/80 px-1 text-[9px] font-display text-[var(--accent)]">
                    {player.rating}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white group-hover:text-[var(--accent)]">
                    {player.name}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] uppercase">
                    {player.position} · {player.nationalityFlag}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <PlayerProfileModal
        player={selectedPlayer}
        open={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}
