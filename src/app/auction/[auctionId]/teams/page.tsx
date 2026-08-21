"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTeamStore } from "@/store/teamStore";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AuctionTeamsPage() {
  const teams = useTeamStore((s) => s.teams);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-4xl">Teams</h1>
        <p className="text-sm text-[var(--muted)]">Budgets, managers, and squad progress.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link key={team.id} href={`/team/${team.id}`}>
            <Card className="h-full transition hover:border-[var(--accent)]/40">
              <div className="flex items-center gap-3">
                <Image src={team.logo} alt="" width={48} height={48} className="rounded-lg" unoptimized />
                <div>
                  <h2 className="font-display text-2xl">{team.name}</h2>
                  <p className="text-xs text-[var(--muted)]">
                    {team.managerName ?? "Open slot"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="muted">
                  {formatCurrency(team.budget - team.spent)} left
                </Badge>
                <Badge variant="accent">
                  {team.squad.length}/{team.maxSquadSize} squad
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
