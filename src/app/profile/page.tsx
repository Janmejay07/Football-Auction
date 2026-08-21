"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Shield,
  Star,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/lib/services/authService";
import { formatCurrency } from "@/lib/utils";
import type { UserProfile } from "@/types/user";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    authService.getProfile(user.id).then(setProfileData).catch(() => undefined);
  }, [user]);

  // User Profile stats
  const profile = {
    name: user?.fullName || "",
    username: user?.username ? `@${user.username}` : "",
    email: user?.email || "",
    favoriteClub: user?.favoriteClub || "No club selected",
    avatar:
      user?.avatar ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    auctionsHosted: profileData?.auctionsHosted ?? 0,
    auctionsJoined: profileData?.auctionsJoined ?? 0,
    playersBought: profileData?.playersBought ?? 0,
    totalSpending: profileData?.totalSpending ?? 0,
    winRate: 76,
    trophies: [
      { id: "t1", title: "Auction Master", desc: "Won 10+ live auctions", icon: Trophy, tier: "Gold" },
      { id: "t2", title: "Galáctico Builder", desc: "Constructed 90+ OVR squad", icon: Star, tier: "Platinum" },
      { id: "t3", title: "Bargain Hunter", desc: "Acquired elite player for base bid", icon: Award, tier: "Silver" },
    ],
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Breadcrumb Header */}
      <div className="border-b border-white/5 bg-black/40 px-4 py-3 text-xs text-[var(--muted)]">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Link href="/dashboard" className="hover:text-[var(--accent)]">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white font-medium">Manager Profile</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Profile Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1628] via-[#09101c] to-[#05070b] p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[var(--accent)]/5 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--accent)] shadow-2xl">
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="accent">Verified Manager</Badge>
                  <Badge variant="muted">{profile.favoriteClub}</Badge>
                </div>
                <h1 className="font-display text-4xl text-white sm:text-5xl">
                  {profile.name}
                </h1>
                <p className="font-mono text-sm text-[var(--accent)]">
                  {profile.username}
                </p>
                <p className="text-xs text-[var(--muted)]">{profile.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/auction/create">
                <Button className="gap-1.5">
                  <Gavel className="h-4 w-4" />
                  <span>Host New Auction</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="secondary">Edit Settings</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Career Numbers Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Auctions Hosted
            </p>
            <p className="font-display mt-1 text-4xl text-white">{profile.auctionsHosted}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">100% completion rate</p>
          </Card>

          <Card className="p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Auctions Joined
            </p>
            <p className="font-display mt-1 text-4xl text-white">{profile.auctionsJoined}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Across 8 leagues</p>
          </Card>

          <Card className="p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Players Bought
            </p>
            <p className="font-display mt-1 text-4xl text-[var(--accent)]">{profile.playersBought}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Avg 88.4 OVR</p>
          </Card>

          <Card className="p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Total Spending
            </p>
            <p className="font-display mt-1 text-4xl text-[var(--accent)]">
              {formatCurrency(profile.totalSpending)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Purse invested</p>
          </Card>
        </div>

        {/* Trophies & Achievements */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-display text-2xl text-white">Trophies & Badges</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {profile.trophies.map((trophy) => {
              const Icon = trophy.icon;
              return (
                <Card key={trophy.id} className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-dim)] text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-white">{trophy.title}</p>
                      <Badge variant="muted" className="text-[9px] px-1 py-0">{trophy.tier}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{trophy.desc}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Auctions Table */}
        <Card className="space-y-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-2xl">Auction History</CardTitle>
              <CardDescription>Recent live draft rooms and outcomes</CardDescription>
            </div>
            <Link href="/auction/join">
              <Button variant="outline" size="sm">
                Join Another Room
              </Button>
            </Link>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Auction Room</th>
                  <th className="px-4 py-3">Room Code</th>
                  <th className="px-4 py-3">Teams</th>
                  <th className="px-4 py-3">Starting Budget</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(profileData?.auctionHistory ?? []).map((auc) => (
                  <tr key={auc.auctionId} className="transition hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold text-white">{auc.auctionName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--accent)]">{auc.roomCode}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{auc.teamName || "Open"}</td>
                    <td className="px-4 py-3 text-white">{formatCurrency(auc.spent)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={auc.status === "live" ? "live" : "muted"}>
                        {auc.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/auction/${auc.auctionId}/lobby`}>
                        <Button size="sm" variant="ghost" className="text-xs">
                          Open Room →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {["currentSquads", "previousSquads"].map((kind) => {
            const squads = profileData?.[kind as "currentSquads" | "previousSquads"] ?? [];
            return (
              <Card key={kind} className="space-y-4">
                <CardHeader className="p-0">
                  <CardTitle className="text-2xl">
                    {kind === "currentSquads" ? "Current Squads" : "Previous Squads"}
                  </CardTitle>
                  <CardDescription>
                    {kind === "currentSquads"
                      ? "Teams still active in your auctions"
                      : "Teams and players saved from completed auctions"}
                  </CardDescription>
                </CardHeader>
                <div className="space-y-3">
                  {squads.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">No squad history yet.</p>
                  ) : (
                    squads.map((squad) => (
                      <div key={squad.auctionId} className="rounded-lg border border-white/10 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{squad.teamName || "Open team"}</p>
                            <p className="text-xs text-[var(--muted)]">{squad.auctionName}</p>
                          </div>
                          <Badge variant="accent">{squad.squad.length} players</Badge>
                        </div>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Spent {formatCurrency(squad.spent)} of {formatCurrency(squad.budget)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
