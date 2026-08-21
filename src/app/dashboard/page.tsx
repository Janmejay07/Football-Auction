"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Gavel, Radio, Users } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auctionService } from "@/lib/services/auctionService";
import { formatCurrency } from "@/lib/utils";
import type { Auction, AuctionStatus } from "@/types/auction";

function statusBadge(status: AuctionStatus) {
  if (status === "live") return <Badge variant="live" className="live-pulse">Live</Badge>;
  if (status === "completed") return <Badge variant="muted">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="warning">Cancelled</Badge>;
  if (status === "paused") return <Badge variant="warning">Paused</Badge>;
  if (status === "waiting" || status === "lobby")
    return <Badge variant="accent">Waiting</Badge>;
  return <Badge variant="default">{status}</Badge>;
}

function AuctionCard({
  auction,
  index,
}: {
  auction: Auction;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="group flex h-full flex-col transition-colors hover:border-[var(--accent)]/30">
        <CardHeader className="mb-0 flex-1">
          <div className="mb-3 flex items-start justify-between gap-2">
            {statusBadge(auction.status)}
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {auction.roomCode}
            </span>
          </div>
          <CardTitle className="text-2xl group-hover:text-[var(--accent)] transition-colors">
            {auction.name}
          </CardTitle>
          <CardDescription className="line-clamp-2">{auction.description}</CardDescription>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {auction.teamCount} teams
            </span>
            <span>Budget {formatCurrency(auction.startingBudget)}</span>
            <span>Host {auction.hostName}</span>
            {auction.status === "live" && (
              <span>{auction.playersRemaining} players left</span>
            )}
          </div>
        </CardHeader>
        <div className="mt-5 pt-4 border-t border-white/5">
          <Link href={`/auction/${auction.id}/lobby`}>
            <Button className="w-full" variant={auction.status === "live" ? "live" : "default"}>
              Enter Auction
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    auctionService.listAuctions().then((data) => {
      setAuctions(data);
      setIsLoading(false);
    });
  }, []);

  const liveAuctions = auctions.filter((a) => a.status === "live");
  const recentAuctions = auctions.filter((a) => a.status !== "live");

  return (
    <div className="space-y-12">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-white/10"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/85 to-[var(--background)]/40" />
        <div className="relative px-6 py-14 sm:px-10 sm:py-16">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Manager HQ
          </p>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl md:text-6xl">
            Build Your Dream Squad
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/70 sm:text-base">
            Host a private room or jump into a live auction. Floodlights are on — the bidding
            floor awaits.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auction/create">
              <Button size="lg">
                <Gavel className="h-4 w-4" />
                Create Auction
              </Button>
            </Link>
            <Link href="/auction/join">
              <Button size="lg" variant="secondary">
                <Radio className="h-4 w-4" />
                Join Auction
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl tracking-wide sm:text-3xl">Active Auctions</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Live rooms you can enter now</p>
          </div>
        </div>
        {liveAuctions.length === 0 ? (
          <EmptyState
            title="No live auctions"
            description="There are no live auctions right now. Create one and invite your friends."
            actionLabel="Create Auction"
            actionHref="/auction/create"
            icon={<Radio className="h-10 w-10" />}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {liveAuctions.map((auction, i) => (
              <AuctionCard key={auction.id} auction={auction} index={i} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-5">
          <h2 className="font-display text-2xl tracking-wide sm:text-3xl">Recent Auctions</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Waiting rooms and past drafts</p>
        </div>
        {recentAuctions.length === 0 ? (
          <EmptyState
            title="Nothing recent yet"
            description="Completed and waiting auctions will show up here."
            icon={<Gavel className="h-10 w-10" />}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recentAuctions.map((auction, i) => (
              <AuctionCard key={auction.id} auction={auction} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
