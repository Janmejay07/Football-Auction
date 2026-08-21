"use client";

import { useMemo, useState } from "react";
import { useAuctionStore } from "@/store/auctionStore";
import { useTeamStore } from "@/store/teamStore";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { AuctionCardSkeleton } from "@/components/ui/skeleton";

const FILTERS = ["All", "Sold", "Unsold", "My Purchases"] as const;

export default function AuctionHistoryPage() {
  const history = useAuctionStore((s) => s.history);
  const myTeamId = useTeamStore((s) => s.myTeamId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (filter === "Sold") return item.status === "sold";
      if (filter === "Unsold") return item.status === "unsold";
      if (filter === "My Purchases")
        return item.status === "sold" && item.winnerTeamId === myTeamId;
      return true;
    });
  }, [history, filter, myTeamId]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-4xl">Auction History</h1>
        <p className="text-sm text-[var(--muted)]">Sold and unsold players from this room.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
              filter === f
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-white/5 text-[var(--muted)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <AuctionCardSkeleton />
          <AuctionCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No history yet"
          description="Results will appear here as players are sold or marked unsold."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Winner</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={`${item.playerId}-${item.timestamp}`} className="border-t border-white/5">
                  <td className="px-4 py-3 font-semibold">{item.playerName}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {item.winnerTeamName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--accent)]">
                    {item.price != null ? formatCurrency(item.price) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.status === "sold" ? "success" : "warning"}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
