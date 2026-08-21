"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  DollarSign,
  Gavel,
  Shield,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SquadPitch } from "@/components/team/SquadPitch";
import { PlayerProfileModal } from "@/components/player/PlayerProfileModal";
import { useTeamStore } from "@/store/teamStore";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";
import { formatCurrency } from "@/lib/utils";
import { countGroups, GROUP_LIMITS } from "@/lib/squad";
import type { Player } from "@/types/player";

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const teams = useTeamStore((s) => s.teams);
  const team = teams.find((t) => t.id === teamId) ?? teams[0];
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const squadPlayers = useMemo(() => {
    if (!team) return [];
    return team.squad
      .map((id) => REAL_PLAYERS.find((p) => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }, [team]);

  const groupCounts = useMemo(() => countGroups(squadPlayers), [squadPlayers]);

  const averageRating = useMemo(() => {
    if (!squadPlayers.length) return 0;
    const sum = squadPlayers.reduce((acc, p) => acc + p.rating, 0);
    return Math.round(sum / squadPlayers.length);
  }, [squadPlayers]);

  const mostExpensivePlayer = useMemo(() => {
    if (!squadPlayers.length) return null;
    return [...squadPlayers].sort((a, b) => b.marketValue - a.marketValue)[0];
  }, [squadPlayers]);

  if (!team) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-4xl text-white">Team Not Found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Could not locate team records.</p>
        <Link href="/dashboard" className="mt-6">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const remainingBudget = Math.max(0, team.budget - team.spent);
  const budgetSpentPercent = Math.min(100, Math.round((team.spent / team.budget) * 100));

  return (
    <div className="min-h-screen pb-20">
      {/* Breadcrumb Header */}
      <div className="border-b border-white/5 bg-black/40 px-4 py-3 text-xs text-[var(--muted)]">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <Link href="/dashboard" className="hover:text-[var(--accent)]">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white font-medium">{team.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* Team Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1a2f] via-[#09111e] to-[#05070b] p-6 sm:p-8">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl p-2 shadow-2xl border border-white/10"
                style={{ backgroundColor: team.color || "#1e293b" }}
              >
                <Image
                  src={team.logo}
                  alt={team.name}
                  width={72}
                  height={72}
                  className="rounded-xl object-contain drop-shadow-md"
                  unoptimized
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="accent">Team Headquarters</Badge>
                  <Badge variant="muted">Squad OVR {averageRating}</Badge>
                </div>
                <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-white">
                  {team.name}
                </h1>
                <p className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                  <User className="h-3.5 w-3.5" />
                  <span>Manager: <strong className="text-white">{team.managerName ?? "Unassigned Slot"}</strong></span>
                </p>
              </div>
            </div>

            {/* Quick Financial Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Remaining</span>
                <p className="font-display text-2xl text-[var(--accent)] sm:text-3xl">
                  {formatCurrency(remainingBudget)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Spent ({budgetSpentPercent}%)</span>
                <p className="font-display text-2xl text-white sm:text-3xl">
                  {formatCurrency(team.spent)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Squad Size</span>
                <p className="font-display text-2xl text-white sm:text-3xl">
                  {squadPlayers.length}/{team.maxSquadSize}
                </p>
              </div>
            </div>
          </div>

          {/* Budget Progress Meter */}
          <div className="mt-6 space-y-1.5 border-t border-white/10 pt-4">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Budget Utilization</span>
              <span>{formatCurrency(team.spent)} of {formatCurrency(team.budget)} used</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent)] to-emerald-400 transition-all duration-500"
                style={{ width: `${budgetSpentPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Position Counters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["GK", "DEF", "MID", "FWD"] as const).map((pos) => {
            const count = groupCounts[pos];
            const limit = GROUP_LIMITS[pos];
            return (
              <div key={pos} className="glass-panel flex items-center justify-between rounded-2xl p-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{pos} Slots</span>
                  <p className="font-display text-2xl text-white mt-0.5">
                    {count} <span className="text-xs text-[var(--muted)] font-sans">/ {limit}</span>
                  </p>
                </div>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-display text-xs font-bold ${
                  count > 0 ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "bg-white/5 text-white/40"
                }`}>
                  {pos}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tactical Pitch & Squad Roster Grid */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SquadPitch players={squadPlayers} teamName={team.name} />
          </div>

          <div className="space-y-6">
            {/* Squad List */}
            <Card className="space-y-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl">Complete Roster ({squadPlayers.length})</CardTitle>
                <Link href="/player">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Browse All
                  </Button>
                </Link>
              </CardHeader>

              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
                {squadPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => setSelectedPlayer(player)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-[var(--accent)]/40 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black/40">
                        <Image
                          src={player.image}
                          alt={player.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{player.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {player.nationalityFlag} {player.position} · {player.currentClub}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display text-lg text-[var(--accent)]">{player.rating}</span>
                      <p className="text-[10px] text-[var(--muted)]">
                        {formatCurrency(player.marketValue)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Team Stats */}
            <Card className="space-y-4">
              <CardHeader>
                <CardTitle className="text-2xl">Team Analytics</CardTitle>
              </CardHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Average Player Rating</span>
                  <span className="font-display text-xl text-[var(--accent)]">{averageRating} OVR</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Most Valuable Player</span>
                  <span className="font-medium text-white">
                    {mostExpensivePlayer ? `${mostExpensivePlayer.name} (${formatCurrency(mostExpensivePlayer.marketValue)})` : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Average Player Cost</span>
                  <span className="font-medium text-white">
                    {formatCurrency(squadPlayers.length ? Math.round(team.spent / squadPlayers.length) : 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <PlayerProfileModal
        player={selectedPlayer}
        open={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}
