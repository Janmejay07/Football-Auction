"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";
import { formatCurrency } from "@/lib/utils";

export default function AuctionPlayersPage() {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("all");
  const [position, setPosition] = useState("all");

  const filtered = useMemo(() => {
    return REAL_PLAYERS.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        p.currentClub.toLowerCase().includes(q);
      const matchesBucket = bucket === "all" || p.bucket === bucket;
      const matchesPos = position === "all" || p.position === position;
      return matchesSearch && matchesBucket && matchesPos;
    });
  }, [search, bucket, position]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-4xl">Player Database</h1>
        <p className="text-sm text-[var(--muted)]">Browse every player in this auction pool.</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            className="pl-9"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
          aria-label="Filter by bucket"
        >
          <option value="all">All buckets</option>
          <option value="goalkeepers">Goalkeepers</option>
          <option value="defenders">Defenders</option>
          <option value="midfielders">Midfielders</option>
          <option value="wingers">Wingers</option>
          <option value="forwards">Forwards</option>
        </select>
        <select
          className="h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          aria-label="Filter by position"
        >
          <option value="all">All positions</option>
          {["GK", "CB", "RB", "LB", "CDM", "CM", "CAM", "LW", "RW", "ST"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No players found"
          description="Try a different search or clear your filters."
          onAction={() => {
            setSearch("");
            setBucket("all");
            setPosition("all");
          }}
          actionLabel="Clear Filters"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((player) => (
            <Link
              key={player.id}
              href={`/player/${player.id}`}
              className="glass-panel group overflow-hidden rounded-xl transition hover:border-[var(--accent)]/40"
            >
              <div className="relative aspect-[4/3]">
                <Image src={player.image} alt={player.name} fill className="object-cover" unoptimized />
                <div className="absolute left-2 top-2">
                  <Badge variant="accent">{player.position}</Badge>
                </div>
                <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 font-display text-lg text-[var(--accent)]">
                  {player.rating}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-display text-xl group-hover:text-[var(--accent)]">
                  {player.name}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  {player.nationalityFlag} {player.nationality}
                </p>
                <p className="mt-2 text-sm text-[var(--accent)]">
                  {formatCurrency(player.marketValue)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
