"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useTeamStore } from "@/store/teamStore";
import { useAuctionStore } from "@/store/auctionStore";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { REAL_PLAYERS } from "@/lib/loadRealPlayers";

export default function AuctionResultsPage() {
  const teams = useTeamStore((s) => s.teams);
  const auction = useAuctionStore((s) => s.auction);
  const auctionStatus = useAuctionStore((s) => s.auctionStatus);
  const history = useAuctionStore((s) => s.history);
  const cancelled = auction.status === "cancelled" || auctionStatus === "cancelled";

  const ranked = [...teams]
    .map((t) => ({
      ...t,
      score: t.squad.reduce((sum, id) => {
        const p = REAL_PLAYERS.find((x) => x.id === id);
        return sum + (p?.rating ?? 0);
      }, 0),
    }))
    .sort((a, b) => b.score - a.score || b.spent - a.spent);

  const sold = history.filter((h) => h.status === "sold");
  const totalSpending = teams.reduce((s, t) => s + t.spent, 0);
  const mostExpensive = [...sold].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0];

  const bucketStats = auction.buckets.map((b) => ({
    name: b.name,
    sold: sold.filter((h) => {
      const p = REAL_PLAYERS.find((x) => x.id === h.playerId);
      return p?.bucket === b.id;
    }).length,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div className="text-center">
        <Trophy className="mx-auto h-12 w-12 text-[var(--accent)]" />
        <h1 className="font-display mt-4 text-5xl md:text-6xl">
          {cancelled ? "Auction Cancelled" : "Auction Complete"}
        </h1>
        <p className="mt-2 text-[var(--muted)]">{auction.name}</p>
        {cancelled && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            The host ended this auction early. Squads and bids so far are still shown below.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Teams</p>
          <p className="font-display text-4xl">{teams.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Players Sold
          </p>
          <p className="font-display text-4xl">{sold.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Total Spending
          </p>
          <p className="font-display text-4xl text-[var(--accent)]">
            {formatCurrency(totalSpending)}
          </p>
        </Card>
      </div>

      <section>
        <h2 className="font-display mb-4 text-3xl">Rankings</h2>
        <div className="space-y-2">
          {ranked.map((team, i) => (
            <Link
              key={team.id}
              href={`/team/${team.id}`}
              className="glass-panel flex items-center justify-between rounded-xl px-4 py-3 transition hover:border-[var(--accent)]/40"
            >
              <div className="flex items-center gap-4">
                <span className="font-display text-2xl text-[var(--accent)] w-8">
                  {i + 1}.
                </span>
                <div>
                  <p className="font-display text-xl">{team.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {team.squad.length} players · {formatCurrency(team.spent)} spent
                  </p>
                </div>
              </div>
              <p className="text-sm text-[var(--muted)]">OVR {team.score || "—"}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="font-display text-2xl">Auction Statistics</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-[var(--muted)]">Most Expensive</span>
              <span>
                {mostExpensive
                  ? `${mostExpensive.playerName} — ${formatCurrency(mostExpensive.price ?? 0)}`
                  : "No completed sales"}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--muted)]">Biggest Spending</span>
              <span>{ranked[0]?.name ?? "—"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--muted)]">Average Price</span>
              <span>
                {formatCurrency(
                  sold.length
                    ? sold.reduce((s, x) => s + (x.price ?? 0), 0) / sold.length
                    : 0
                )}
              </span>
            </li>
          </ul>
        </Card>

        <Card>
          <h3 className="font-display text-2xl">Bucket Results</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {bucketStats.map((b) => (
              <li key={b.name} className="flex justify-between">
                <span className="uppercase tracking-wider text-[var(--muted)]">{b.name}</span>
                <span>{b.sold} sold</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <div className="flex justify-center gap-3">
        <Link href="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
        {ranked[0] ? (
          <Link href={`/team/${ranked[0].id}`}>
            <Button>View Champion Squad</Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
