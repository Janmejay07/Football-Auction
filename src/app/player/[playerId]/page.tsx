"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Flame,
  Globe,
  Gavel,
  Shield,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { REAL_PLAYERS, getPlayerById } from "@/lib/loadRealPlayers";
import { formatCurrency } from "@/lib/utils";
import { positionBadgeColor } from "@/components/player/PlayerCard";
import { PlayerCard } from "@/components/player/PlayerCard";

export default function PlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = use(params);
  const player = getPlayerById(playerId);
  const [activeTab, setActiveTab] = useState<"overview" | "career" | "stats">("overview");

  if (!player) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-4xl text-white">Player Not Found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The requested player profile could not be located.
        </p>
        <Link href="/player" className="mt-6">
          <Button>Browse Player Database</Button>
        </Link>
      </div>
    );
  }

  // Related bucket players
  const relatedPlayers = REAL_PLAYERS.filter(
    (p) => p.bucket === player.bucket && p.id !== player.id
  ).slice(0, 4);

  const isAttacker = ["ST", "CF", "LW", "RW"].includes(player.position);
  const isMidfielder = ["CM", "CAM", "CDM"].includes(player.position);
  const isDefender = ["CB", "LB", "RB"].includes(player.position);
  const isGk = player.position === "GK";

  const pace = isAttacker ? player.rating + 2 : isMidfielder ? player.rating - 4 : isDefender ? player.rating - 6 : 52;
  const shooting = isAttacker ? player.rating : isMidfielder ? player.rating - 8 : 45;
  const passing = isMidfielder ? player.rating + 2 : isAttacker ? player.rating - 6 : isDefender ? player.rating - 12 : 68;
  const dribbling = isAttacker || player.position === "CAM" ? player.rating + 1 : player.rating - 7;
  const defending = isDefender ? player.rating + 3 : isMidfielder ? player.rating - 15 : 35;
  const physical = isDefender || player.position === "ST" ? player.rating : player.rating - 6;

  return (
    <div className="min-h-screen pb-16">
      {/* Top Breadcrumb Header */}
      <div className="border-b border-white/5 bg-black/40 px-4 py-3 text-xs text-[var(--muted)]">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Link href="/dashboard" className="hover:text-[var(--accent)]">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/player" className="hover:text-[var(--accent)]">
            Players
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white font-medium">{player.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Main Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1628] via-[#09101c] to-[#05070b] p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--accent)]/5 blur-3xl" />
          
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
            {/* Big Player Card Frame */}
            <div className="relative h-60 w-48 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--accent)]/40 bg-gradient-to-b from-[#15253e] to-[#0a111e] shadow-2xl">
              <Image
                src={player.image}
                alt={player.name}
                fill
                className="object-cover"
                sizes="200px"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              
              <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg bg-black/85 px-2.5 py-1 backdrop-blur">
                <span className="font-display text-2xl leading-none text-[var(--accent)]">{player.rating}</span>
                <span className="text-[10px] font-bold uppercase text-[var(--muted)]">{player.position}</span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-white drop-shadow">
                <span>{player.nationalityFlag} {player.nationality}</span>
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${positionBadgeColor(
                    player.position
                  )}`}
                >
                  {player.position}
                </span>
                <Badge variant="accent" className="capitalize">
                  {player.bucket} Bucket
                </Badge>
                <Badge variant="muted">Age {player.age}</Badge>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide text-white">
                {player.name}
              </h1>

              <p className="text-base text-white/80">
                {player.currentClub} · {player.nationality} International
              </p>

              <div className="mt-4 flex flex-wrap gap-4 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Base Price</p>
                  <p className="font-display text-2xl text-white">{formatCurrency(player.basePrice)}</p>
                </div>
                <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-dim)] px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">Market Valuation</p>
                  <p className="font-display text-2xl text-[var(--accent)]">{formatCurrency(player.marketValue)}</p>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="flex flex-col gap-2 md:self-end">
              <Link href="/auction/auc-champions/live">
                <Button size="lg" className="w-full gap-2">
                  <Gavel className="h-4 w-4" />
                  <span>Bid in Live Auction</span>
                </Button>
              </Link>
              <Link href="/player">
                <Button variant="secondary" size="sm" className="w-full">
                  All Players
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10">
          {(["overview", "career", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
            <Card className="space-y-6">
              <CardHeader>
                <CardTitle className="text-2xl">Attributes Breakdown</CardTitle>
              </CardHeader>
              {isGk ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ["Diving", player.rating + 1],
                    ["Handling", player.rating - 2],
                    ["Kicking", player.rating - 3],
                    ["Reflexes", player.rating + 2],
                    ["Speed", 55],
                    ["Positioning", player.rating],
                  ].map(([lbl, val]) => (
                    <div key={lbl as string} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center">
                      <span className="text-[10px] uppercase text-[var(--muted)]">{lbl}</span>
                      <p className="font-display text-3xl text-[var(--accent)]">{val}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ["Pace", pace],
                    ["Shooting", shooting],
                    ["Passing", passing],
                    ["Dribbling", dribbling],
                    ["Defending", defending],
                    ["Physical", physical],
                  ].map(([lbl, val]) => (
                    <div key={lbl as string} className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center">
                      <span className="text-[10px] uppercase text-[var(--muted)]">{lbl}</span>
                      <p className="font-display text-3xl text-[var(--accent)]">{Math.min(99, Math.max(40, val as number))}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t border-white/10 pt-4 text-sm text-[var(--muted)]">
                <p>
                  <strong className="text-white">{player.name}</strong> operates with world-class execution in fast-break and tactical build-up schemes. His overall rating of <strong className="text-[var(--accent)]">{player.rating}</strong> makes him one of the premier assets in the current draft pool.
                </p>
              </div>
            </Card>

            <Card className="space-y-4">
              <CardHeader>
                <CardTitle className="text-2xl">Player Bio</CardTitle>
              </CardHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Club</span>
                  <span className="font-medium text-white">{player.currentClub}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Nationality</span>
                  <span className="font-medium text-white">{player.nationalityFlag} {player.nationality}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Age</span>
                  <span className="font-medium text-white">{player.age}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Position</span>
                  <span className="font-medium text-white">{player.position}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Auction Category</span>
                  <span className="font-medium capitalize text-[var(--accent)]">{player.bucket}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Career */}
        {activeTab === "career" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="space-y-4">
              <CardHeader>
                <CardTitle className="text-2xl">Club Records</CardTitle>
              </CardHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <Trophy className="h-5 w-5 text-[var(--warning)]" />
                  <div>
                    <p className="font-semibold text-white">{player.currentClub}</p>
                    <p className="text-xs text-[var(--muted)]">First Team Starter · Key Player</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <Globe className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-semibold text-white">{player.nationality} National Squad</p>
                    <p className="text-xs text-[var(--muted)]">Active International Representative</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <CardHeader>
                <CardTitle className="text-2xl">Auction Analysis</CardTitle>
              </CardHeader>
              <p className="text-sm text-[var(--muted)]">
                Based on historical bidding simulations, {player.name} typically triggers high-intensity bidding wars among managers targeting elite {player.position} talent.
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Expected Final Sale Range</p>
                <p className="font-display text-3xl text-[var(--accent)]">
                  {formatCurrency(player.basePrice * 1.2)} – {formatCurrency(player.marketValue * 1.1)}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Statistics */}
        {activeTab === "stats" && (
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Career Statistics</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">Appearances</p>
                <p className="font-display text-3xl text-white">{player.stats.appearances}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">Goals Scored</p>
                <p className="font-display text-3xl text-[var(--accent)]">{player.stats.goals}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">Assists</p>
                <p className="font-display text-3xl text-white">{player.stats.assists}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">Minutes Played</p>
                <p className="font-display text-3xl text-white">{player.stats.minutes.toLocaleString()}</p>
              </div>
            </div>

            {player.stats.cleanSheets !== undefined && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center max-w-xs mx-auto">
                <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">Clean Sheets</p>
                <p className="font-display text-4xl text-[var(--success)]">{player.stats.cleanSheets}</p>
              </div>
            )}
          </Card>
        )}

        {/* Related Players in Same Bucket */}
        {relatedPlayers.length > 0 && (
          <section className="space-y-4 pt-4">
            <h2 className="font-display text-3xl tracking-wide text-white">
              Other {player.bucket} In Auction Pool
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedPlayers.map((rel) => (
                <PlayerCard key={rel.id} player={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
