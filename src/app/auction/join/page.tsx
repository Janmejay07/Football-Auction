"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auctionService } from "@/lib/services/auctionService";
import { useAuthStore } from "@/store/authStore";
import { useTeamStore } from "@/store/teamStore";
import { useAuctionStore } from "@/store/auctionStore";
import { cn, formatCurrency } from "@/lib/utils";
import type { Auction } from "@/types/auction";
import type { Team } from "@/types/team";

export default function JoinAuctionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setTeams = useTeamStore((s) => s.setTeams);
  const setMyTeamId = useTeamStore((s) => s.setMyTeamId);

  const [code, setCode] = useState("");
  const [auction, setAuction] = useState<Auction | null>(null);
  const [auctionTeams, setAuctionTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [customTeamName, setCustomTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTeams = auctionTeams.filter((t) => t.isAvailable);

  const lookup = async (rawCode = code) => {
    setError(null);
    setLoading(true);
    try {
      const room = await auctionService.getByCode(rawCode.trim(), user?.id);
      setAuctionTeams(room.teams);
      setAuction(room.auction);
      useAuctionStore.getState().applySnapshot(room);
      toast.success(`Found ${room.auction.name}`);

      const already = room.participants.find((p) => p.userId === user?.id);
      if (already) {
        const mine = room.teams.find((t) => t.managerId === user?.id);
        if (mine) setMyTeamId(mine.id);
        setTeams(room.teams);
        router.push(`/auction/${room.auction.id}/lobby`);
      }
    } catch (e) {
      setAuction(null);
      setAuctionTeams([]);
      setError(e instanceof Error ? e.message : "Unable to join auction.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fromUrl = searchParams.get("code");
    if (!fromUrl) return;
    const lookupTimer = window.setTimeout(() => {
      setCode(fromUrl.toUpperCase());
      void lookup(fromUrl);
    }, 0);
    return () => window.clearTimeout(lookupTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const join = async () => {
    if (!auction || !selectedTeamId || !customTeamName.trim() || !user) return;
    setJoining(true);
    try {
      const room = await auctionService.joinAuction({
        code: auction.roomCode,
        userId: user.id,
        userName: user.fullName,
        teamId: selectedTeamId,
        teamName: customTeamName.trim(),
      });
      setTeams(room.teams);
      setMyTeamId(selectedTeamId);
      useAuctionStore.getState().applySnapshot(room);
      const team = room.teams.find((t) => t.id === selectedTeamId);
      toast.success(`Joined as ${team?.name ?? "team"}`);
      router.push(`/auction/${room.auction.id}/lobby`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-5xl tracking-wide">Join Auction</h1>
        <p className="mt-2 text-[var(--muted)]">
          Enter the room code from your host and pick an available club. Sign in
          with your own email — not the host&apos;s.
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Auction Code</CardTitle>
          <CardDescription>Example: 7F4K9X</CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-2">
            <Label htmlFor="code">Room code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="7F4K9X"
              className="font-mono text-lg tracking-[0.3em] uppercase"
              maxLength={8}
              onKeyDown={(e) => {
                if (e.key === "Enter") void lookup();
              }}
            />
          </div>
          <Button
            className="sm:mt-7"
            onClick={() => void lookup()}
            disabled={code.length < 4 || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find Auction"}
          </Button>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 p-4 text-sm">
            <p className="font-semibold text-[var(--destructive)]">Unable to join auction</p>
            <p className="mt-1 text-[var(--muted)]">{error}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Open the host&apos;s invite link (not localhost). If you are on a
              different network, the host must run <code>npm run dev:public</code>{" "}
              or deploy the app, then share that public link.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => void lookup()}>
              Try Again
            </Button>
          </div>
        )}
      </Card>

      {auction && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="accent">{auction.visibility}</Badge>
                <h2 className="font-display mt-2 text-3xl">{auction.name}</h2>
                <p className="text-sm text-[var(--muted)]">{auction.description}</p>
              </div>
              <div className="text-right text-sm text-[var(--muted)]">
                <p className="font-mono text-[var(--accent)]">{auction.roomCode}</p>
                <p className="mt-1 flex items-center justify-end gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {auction.teamCount} teams · {formatCurrency(auction.startingBudget)}
                </p>
              </div>
            </div>
          </Card>

          <div>
            <h3 className="font-display mb-4 text-2xl">Your Team</h3>
            {availableTeams.length === 0 ? (
              <Card>
                <p className="text-sm text-[var(--muted)]">
                  No teams available. Ask the host to open a slot.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {availableTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setCustomTeamName(team.name.startsWith("Team ") ? "" : team.name);
                    }}
                    className={cn(
                      "glass-panel flex items-center gap-3 rounded-xl p-4 text-left transition-all",
                      selectedTeamId === team.id
                        ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                        : "hover:border-white/20"
                    )}
                  >
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={48}
                      height={48}
                      className="rounded-lg"
                      unoptimized
                    />
                    <div>
                      <p className="font-display text-xl">{team.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        Budget {formatCurrency(team.budget)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedTeamId && (
            <div className="space-y-2">
              <Label htmlFor="custom-team-name">Your Custom Team Name</Label>
              <Input
                id="custom-team-name"
                value={customTeamName}
                onChange={(e) => setCustomTeamName(e.target.value)}
                placeholder="Enter a name for your team"
                maxLength={30}
              />
              <p className="text-xs text-[var(--muted)]">
                This name will be visible to the host and all auction participants.
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!selectedTeamId || !customTeamName.trim() || joining}
            onClick={() => void join()}
          >
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Auction"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
