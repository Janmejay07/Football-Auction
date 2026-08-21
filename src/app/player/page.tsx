"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Search, SlidersHorizontal, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PlayerCard } from "@/components/player/PlayerCard";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";

export default function PlayerDatabasePage() {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("all");
  const [position, setPosition] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "marketValue" | "basePrice" | "name">("rating");

  const filteredPlayers = useMemo(() => {
    return REAL_PLAYERS.filter((player) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        player.name.toLowerCase().includes(q) ||
        player.nationality.toLowerCase().includes(q) ||
        player.currentClub.toLowerCase().includes(q) ||
        player.position.toLowerCase().includes(q);

      const matchesBucket = bucket === "all" || player.bucket === bucket;
      const matchesPos = position === "all" || player.position === position;

      return matchesSearch && matchesBucket && matchesPos;
    }).sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "marketValue") return b.marketValue - a.marketValue;
      if (sortBy === "basePrice") return b.basePrice - a.basePrice;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [search, bucket, position, sortBy]);

  return (
    <div className="min-h-screen pb-16">
      {/* Top Header */}
      <div className="border-b border-white/5 bg-black/40 px-4 py-3 text-xs text-[var(--muted)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hover:text-[var(--accent)]">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white">Player Database</span>
          </div>
          <span className="text-[var(--accent)] font-semibold">{filteredPlayers.length} Players Available</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <h1 className="font-display text-4xl tracking-wide text-white sm:text-5xl">
            Player Database
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Explore world-class talent, compare ratings, and research upcoming auction targets.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, club, country, or position..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              className="player-filter-select h-11 rounded-xl border border-white/15 bg-[#111c2d] px-3 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              aria-label="Filter by bucket"
            >
              <option value="all">All Buckets</option>
              <option value="goalkeepers">Goalkeepers</option>
              <option value="defenders">Defenders</option>
              <option value="midfielders">Midfielders</option>
              <option value="wingers">Wingers</option>
              <option value="forwards">Forwards</option>
            </select>

            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="player-filter-select h-11 rounded-xl border border-white/15 bg-[#111c2d] px-3 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              aria-label="Filter by position"
            >
              <option value="all">All Positions</option>
              {["GK", "CB", "RB", "LB", "CDM", "CM", "CAM", "LW", "RW", "ST"].map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="player-filter-select h-11 rounded-xl border border-white/15 bg-[#111c2d] px-3 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              aria-label="Sort by"
            >
              <option value="rating">Sort: Highest Rating</option>
              <option value="marketValue">Sort: Market Value</option>
              <option value="basePrice">Sort: Base Price</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            {(search || bucket !== "all" || position !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setBucket("all");
                  setPosition("all");
                }}
                className="text-xs text-[var(--muted)] hover:text-white"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Players Grid */}
        {filteredPlayers.length === 0 ? (
          <EmptyState
            title="No players match your filters"
            description="Try adjusting your search query, bucket, or position filters."
            actionLabel="Reset All Filters"
            onAction={() => {
              setSearch("");
              setBucket("all");
              setPosition("all");
            }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
