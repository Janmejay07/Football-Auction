"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, ShieldCheck, Trophy, Zap } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { positionBadgeColor } from "@/components/player/PlayerCard";
import type { Player } from "@/types/player";

interface PlayerProfileModalProps {
  player: Player | null;
  open: boolean;
  onClose: () => void;
}

type TabType = "overview" | "career" | "stats";

export function PlayerProfileModal({ player, open, onClose }: PlayerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (!player) return null;

  // Generate tactical attributes based on position & rating
  const isAttacker = ["ST", "CF", "LW", "RW"].includes(player.position);
  const isMidfielder = ["CM", "CAM", "CDM"].includes(player.position);
  const isDefender = ["CB", "LB", "RB"].includes(player.position);
  const isGk = player.position === "GK";

  const pace = isAttacker ? player.rating + 2 : isMidfielder ? player.rating - 4 : isDefender ? player.rating - 6 : 50;
  const shooting = isAttacker ? player.rating : isMidfielder ? player.rating - 8 : 45;
  const passing = isMidfielder ? player.rating + 2 : isAttacker ? player.rating - 6 : isDefender ? player.rating - 12 : 65;
  const dribbling = isAttacker || player.position === "CAM" ? player.rating + 1 : player.rating - 7;
  const defending = isDefender ? player.rating + 3 : isMidfielder ? player.rating - 15 : 35;
  const physical = isDefender || player.position === "ST" ? player.rating : player.rating - 6;

  return (
    <Modal open={open} onClose={onClose} title="Player Profile" className="max-w-2xl">
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#0c1626] to-[#080d16] p-5 sm:flex-row sm:items-center">
          <div className="relative h-32 w-28 shrink-0 overflow-hidden rounded-xl bg-black/40 shadow-xl">
            <Image
              src={player.image}
              alt={player.name}
              fill
              className="object-cover"
              sizes="120px"
              unoptimized
            />
            <div className="absolute right-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 font-display text-sm text-[var(--accent)]">
              {player.rating}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${positionBadgeColor(
                  player.position
                )}`}
              >
                {player.position}
              </span>
              <span className="text-xs text-[var(--muted)] capitalize">Bucket: {player.bucket}</span>
            </div>

            <h2 className="font-display text-3xl leading-tight tracking-wide text-white sm:text-4xl">
              {player.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1 font-medium text-white">
                <span>{player.nationalityFlag}</span>
                <span>{player.nationality}</span>
              </span>
              <span>•</span>
              <span>{player.currentClub}</span>
              <span>•</span>
              <span>Age {player.age}</span>
            </div>

            <div className="flex items-center gap-3 pt-2 text-sm">
              <div>
                <span className="text-[10px] uppercase text-[var(--muted)]">Base Bid:</span>{" "}
                <span className="font-semibold text-white">{formatCurrency(player.basePrice)}</span>
              </div>
              <div className="h-3 w-px bg-white/20" />
              <div>
                <span className="text-[10px] uppercase text-[var(--muted)]">Market Val:</span>{" "}
                <span className="font-bold text-[var(--accent)]">{formatCurrency(player.marketValue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10">
          {(["overview", "career", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 border-b-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Core Attributes (OVR {player.rating})
              </p>
              {isGk ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    ["Diving", player.rating + 1],
                    ["Handling", player.rating - 2],
                    ["Kicking", player.rating - 3],
                    ["Reflexes", player.rating + 2],
                    ["Speed", 55],
                    ["Positioning", player.rating],
                  ].map(([lbl, val]) => (
                    <div key={lbl as string} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                      <span className="text-[10px] uppercase text-[var(--muted)]">{lbl}</span>
                      <p className="font-display text-2xl text-[var(--accent)]">{val}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    ["Pace", pace],
                    ["Shooting", shooting],
                    ["Passing", passing],
                    ["Dribbling", dribbling],
                    ["Defending", defending],
                    ["Physical", physical],
                  ].map(([lbl, val]) => (
                    <div key={lbl as string} className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                      <span className="text-[10px] uppercase text-[var(--muted)]">{lbl}</span>
                      <p className="font-display text-2xl text-[var(--accent)]">{Math.min(99, Math.max(40, val as number))}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-[var(--muted)]">
              <p className="leading-relaxed">
                {player.name} is a premier {player.position} playing for {player.currentClub}. With an overall rating of{" "}
                <strong className="text-white">{player.rating}</strong>, he represents elite talent in the{" "}
                <strong className="text-[var(--accent)] capitalize">{player.bucket}</strong> pool.
              </p>
            </div>
          </div>
        )}

        {activeTab === "career" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Trophy className="h-4 w-4 text-[var(--warning)]" />
                  <span>Current Club Status</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{player.currentClub}</p>
                <p className="text-xs text-[var(--muted)]">Contract active · First Team Squad</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
                  <span>International Duty</span>
                </div>
                <p className="mt-2 text-sm font-semibold">
                  {player.nationalityFlag} {player.nationality} National Team
                </p>
                <p className="text-xs text-[var(--muted)]">Senior international appearances</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs space-y-2">
              <span className="font-semibold text-white uppercase tracking-wider text-[10px]">Draft Assessment</span>
              <p className="text-[var(--muted)]">
                Estimated base valuation at €{player.basePrice}M. High-impact acquisition with top-tier technical and physical output for any tactical formation.
              </p>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <span className="text-[10px] uppercase text-[var(--muted)]">Appearances</span>
                <p className="font-display text-2xl text-white">{player.stats.appearances}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <span className="text-[10px] uppercase text-[var(--muted)]">Goals</span>
                <p className="font-display text-2xl text-[var(--accent)]">{player.stats.goals}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <span className="text-[10px] uppercase text-[var(--muted)]">Assists</span>
                <p className="font-display text-2xl text-white">{player.stats.assists}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <span className="text-[10px] uppercase text-[var(--muted)]">Minutes</span>
                <p className="font-display text-2xl text-white">{player.stats.minutes.toLocaleString()}</p>
              </div>
            </div>

            {player.stats.cleanSheets !== undefined && (
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <span className="text-[10px] uppercase text-[var(--muted)]">Clean Sheets</span>
                <p className="font-display text-3xl text-[var(--success)]">{player.stats.cleanSheets}</p>
              </div>
            )}
          </div>
        )}

        {/* Action button */}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Link href={`/player/${player.id}`} onClick={onClose}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <span>Full Player Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
