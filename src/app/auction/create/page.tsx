"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Link2,
  Share2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { useAuctionStore } from "@/store/auctionStore";
import { useTeamStore } from "@/store/teamStore";
import { auctionService } from "@/lib/services/auctionService";
import { useLanOrigin } from "@/hooks/useLanOrigin";
import { DEFAULT_BUCKETS } from "@/lib/auctionConfig";
import { formatCurrency, cn } from "@/lib/utils";
import type {
  Auction,
  AuctionRules,
  AuctionVisibility,
  PlayerBucket,
} from "@/types/auction";

const STEPS = [
  "Basic Info",
  "Teams",
  "Budget",
  "Buckets",
  "Rules",
  "Review",
  "Create",
] as const;

const TEAM_COUNTS = [4, 6, 8, 10, 12] as const;
const BUDGET_PRESETS = [50, 75, 100, 150, 200] as const;

const DEFAULT_RULES: AuctionRules = {
  baseBid: 5,
  minIncrement: 1,
  biddingTimer: 10,
  maxSquadSize: 18,
  enableTimerReset: true,
  enableAutoBid: false,
  enableVoiceChat: true,
  enableCamera: true,
  enableSpectators: true,
  showPlayerStatistics: true,
  showMarketValue: true,
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors",
        checked
          ? "border-[var(--accent)]/40 bg-[var(--accent-dim)]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
      )}
    >
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-[var(--accent)]" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

export default function CreateAuctionPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setTeams = useTeamStore((s) => s.setTeams);

  const [step, setStep] = useState(0);
  const [created, setCreated] = useState<Auction | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<AuctionVisibility>("private");

  const [teamCountPreset, setTeamCountPreset] = useState<number | "custom">(8);
  const [customTeamCount, setCustomTeamCount] = useState(8);
  const teamCount = teamCountPreset === "custom" ? Math.max(2, customTeamCount || 2) : teamCountPreset;

  const [budgetPreset, setBudgetPreset] = useState<number | "custom">(100);
  const [customBudget, setCustomBudget] = useState(100);

  const [buckets, setBuckets] = useState<PlayerBucket[]>(() =>
    DEFAULT_BUCKETS.map((b) => ({ ...b, playerIds: [...b.playerIds] }))
  );

  const [rules, setRules] = useState<AuctionRules>({ ...DEFAULT_RULES });
  const lanOrigin = useLanOrigin();

  useEffect(() => {
    if (step !== 6 || !created?.id || !user?.id) return;

    const beat = () => {
      void auctionService
        .postAction(created.id, { action: "presence", userId: user.id })
        .catch(() => undefined);
    };

    beat();
    const heartbeatId = window.setInterval(beat, 4_000);
    return () => window.clearInterval(heartbeatId);
  }, [created?.id, step, user?.id]);

  const startingBudget =
    budgetPreset === "custom" ? Math.max(1, customBudget || 0) : budgetPreset;

  const enabledBuckets = useMemo(
    () => [...buckets].filter((b) => b.enabled).sort((a, b) => a.order - b.order),
    [buckets]
  );

  const totalPlayers = enabledBuckets.reduce(
    (sum, b) => sum + b.playerIds.length,
    0
  );

  function updateTeamCountPreset(preset: number | "custom") {
    setTeamCountPreset(preset);
  }

  function updateCustomTeamCount(count: number) {
    const validCount = Math.max(2, Math.min(count || 0, 20));
    setCustomTeamCount(validCount);
  }

  function moveBucket(index: number, direction: -1 | 1) {
    setBuckets((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const target = index + direction;
      if (target < 0 || target >= sorted.length) return prev;
      const next = [...sorted];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  }

  function toggleBucket(id: string) {
    setBuckets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b))
    );
  }

  function canProceed(): boolean {
    if (step === 0) return name.trim().length >= 3;
    if (step === 1) return teamCount >= 2;
    if (step === 2) return startingBudget >= 1;
    if (step === 3) return enabledBuckets.length > 0;
    if (step === 4) {
      return (
        rules.baseBid >= 1 &&
        rules.minIncrement >= 1 &&
        rules.biddingTimer >= 3 &&
        rules.maxSquadSize >= 1
      );
    }
    return true;
  }

  async function handleCreate() {
    if (!user) {
      toast.error("Please sign in to create an auction");
      return;
    }
    setIsCreating(true);
    try {
      const room = await auctionService.createAuction(
        {
          name: name.trim(),
          description: description.trim(),
          visibility,
          teamCount,
          startingBudget,
          buckets: buckets.map((b, i) => ({ ...b, order: i + 1 })),
          rules,
        },
        user.id,
        user.fullName
      );

      setTeams(room.teams);
      const hostTeam = room.teams.find((t) => t.managerId === user.id);
      if (hostTeam) useTeamStore.getState().setMyTeamId(hostTeam.id);
      useAuctionStore.getState().applySnapshot(room);
      setCreated(room.auction);
      setStep(6);
      toast.success("Auction created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create auction");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  }

  function inviteLink(code: string) {
    const origin = lanOrigin || (typeof window === "undefined" ? "" : window.location.origin);
    return `${origin}/auction/join?code=${code}`;
  }

  const sortedBuckets = useMemo(
    () => [...buckets].sort((a, b) => a.order - b.order),
    [buckets]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          Create Auction
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
          Configure teams, budget, and rules — then invite friends with a room
          code.
        </p>
      </div>

      {/* Progress */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Step {Math.min(step + 1, 7)} of 7
          </p>
          <p className="text-sm font-medium text-[var(--accent)]">
            {STEPS[Math.min(step, 6)]}
          </p>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 space-y-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  i <= step ? "bg-[var(--accent)]" : "bg-white/10"
                )}
              />
              <p
                className={cn(
                  "hidden truncate text-[10px] uppercase tracking-wider sm:block",
                  i <= step ? "text-foreground" : "text-[var(--muted-foreground)]"
                )}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {/* Step 1 — Basic Info */}
          {step === 0 && (
            <Card className="space-y-5">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Name your auction and choose who can find it.
                </CardDescription>
              </CardHeader>
              <div className="space-y-2">
                <Label htmlFor="auction-name">Auction Name</Label>
                <Input
                  id="auction-name"
                  placeholder="Champions League Friends Auction"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auction-desc">Description</Label>
                <textarea
                  id="auction-desc"
                  rows={3}
                  placeholder="Build your dream squad with friends."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted-foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["private", "public"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibility(v)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left transition-colors",
                        visibility === v
                          ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                      )}
                    >
                      <p className="font-display text-lg tracking-wide">
                        {v}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {v === "private"
                          ? "Invite-only via room code"
                          : "Discoverable by anyone"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Step 2 — Teams */}
          {step === 1 && (
            <Card className="space-y-5">
              <CardHeader>
                <CardTitle>Choose Number of Teams</CardTitle>
                <CardDescription>
                  Select how many teams will participate. Friends will join with the invite link and create their own team names.
                </CardDescription>
              </CardHeader>

              {/* Number of Teams Selection */}
              <div className="space-y-4">
                <Label>How many teams?</Label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_COUNTS.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant={teamCountPreset === n ? "default" : "secondary"}
                      onClick={() => updateTeamCountPreset(n)}
                      className="text-base font-semibold"
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant={teamCountPreset === "custom" ? "default" : "secondary"}
                    onClick={() => updateTeamCountPreset("custom")}
                    className="text-base font-semibold"
                  >
                    Custom
                  </Button>
                </div>
                {teamCountPreset === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-teams">Custom Number (2-20)</Label>
                    <Input
                      id="custom-teams"
                      type="number"
                      min={2}
                      max={20}
                      value={customTeamCount}
                      onChange={(e) =>
                        updateCustomTeamCount(Number(e.target.value) || 2)
                      }
                      className="text-base"
                    />
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Team Summary
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Teams to create:</span>
                    <Badge variant="accent" className="text-base">{teamCount}</Badge>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Each friend who joins will fill in their own team name and manager name. You&apos;ll receive a room code to share.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3 — Budget */}
          {step === 2 && (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="space-y-5">
                <CardHeader>
                  <CardTitle>Starting Budget</CardTitle>
                  <CardDescription>
                    Each team starts with the same purse in millions.
                  </CardDescription>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_PRESETS.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={budgetPreset === n ? "default" : "secondary"}
                      onClick={() => setBudgetPreset(n)}
                    >
                      {formatCurrency(n)}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={budgetPreset === "custom" ? "default" : "secondary"}
                    onClick={() => setBudgetPreset("custom")}
                  >
                    Custom
                  </Button>
                </div>
                {budgetPreset === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-budget">Custom Budget (€M)</Label>
                    <Input
                      id="custom-budget"
                      type="number"
                      min={1}
                      max={999}
                      value={customBudget}
                      onChange={(e) =>
                        setCustomBudget(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                )}
              </Card>
              <Card className="flex flex-col justify-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Team Budget
                </p>
                <p className="mt-3 font-display text-5xl text-[var(--accent)]">
                  {formatCurrency(startingBudget)}
                </p>
                <div className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Starting Budget</span>
                    <span>{formatCurrency(startingBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Available</span>
                    <span className="text-[var(--accent)]">
                      {formatCurrency(startingBudget)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Teams</span>
                    <span>{teamCount}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 4 — Buckets */}
          {step === 3 && (
            <Card className="space-y-5">
              <CardHeader>
                <CardTitle>Player Buckets</CardTitle>
                <CardDescription>
                  Enable positions and set the auction order.{" "}
                  <span className="text-[var(--accent)]">
                    {totalPlayers} players
                  </span>{" "}
                  across {enabledBuckets.length} buckets.
                </CardDescription>
              </CardHeader>
              <div className="space-y-2">
                {sortedBuckets.map((bucket, index) => (
                  <div
                    key={bucket.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-3 sm:px-4",
                      bucket.enabled
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-white/5 bg-white/[0.02] opacity-60"
                    )}
                  >
                    <span className="font-display text-xl text-[var(--accent)] w-8">
                      {bucket.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg leading-none">
                        {bucket.name}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {bucket.playerIds.length} players
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => moveBucket(index, -1)}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={index === sortedBuckets.length - 1}
                        onClick={() => moveBucket(index, 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={bucket.enabled ? "default" : "outline"}
                      onClick={() => toggleBucket(bucket.id)}
                    >
                      {bucket.enabled ? "On" : "Off"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Step 5 — Rules */}
          {step === 4 && (
            <Card className="space-y-5">
              <CardHeader>
                <CardTitle>Auction Rules</CardTitle>
                <CardDescription>
                  Tune bidding pace, squad limits, and live features.
                </CardDescription>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="base-bid">Base Bid (€M)</Label>
                  <Input
                    id="base-bid"
                    type="number"
                    min={1}
                    value={rules.baseBid}
                    onChange={(e) =>
                      setRules((r) => ({
                        ...r,
                        baseBid: Number(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-inc">Min Increment (€M)</Label>
                  <Input
                    id="min-inc"
                    type="number"
                    min={1}
                    value={rules.minIncrement}
                    onChange={(e) =>
                      setRules((r) => ({
                        ...r,
                        minIncrement: Number(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timer">Bidding Timer (sec)</Label>
                  <Input
                    id="timer"
                    type="number"
                    min={3}
                    max={60}
                    value={rules.biddingTimer}
                    onChange={(e) =>
                      setRules((r) => ({
                        ...r,
                        biddingTimer: Number(e.target.value) || 10,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="squad">Max Squad Size</Label>
                  <Input
                    id="squad"
                    type="number"
                    min={1}
                    max={30}
                    value={rules.maxSquadSize}
                    onChange={(e) =>
                      setRules((r) => ({
                        ...r,
                        maxSquadSize: Number(e.target.value) || 18,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <ToggleRow
                  label="Enable Timer Reset"
                  description="Reset clock after each bid"
                  checked={rules.enableTimerReset}
                  onChange={(v) =>
                    setRules((r) => ({ ...r, enableTimerReset: v }))
                  }
                />
                <ToggleRow
                  label="Enable Auto Bid"
                  checked={rules.enableAutoBid}
                  onChange={(v) =>
                    setRules((r) => ({ ...r, enableAutoBid: v }))
                  }
                />
                <ToggleRow
                  label="Enable Voice Chat"
                  checked={rules.enableVoiceChat}
                  onChange={(v) =>
                    setRules((r) => ({ ...r, enableVoiceChat: v }))
                  }
                />
                <ToggleRow
                  label="Enable Camera"
                  checked={rules.enableCamera}
                  onChange={(v) =>
                    setRules((r) => ({ ...r, enableCamera: v }))
                  }
                />
                <ToggleRow
                  label="Enable Spectators"
                  checked={rules.enableSpectators}
                  onChange={(v) =>
                    setRules((r) => ({ ...r, enableSpectators: v }))
                  }
                />
                <ToggleRow
                  label="Show Player Statistics"
                  checked={rules.showPlayerStatistics}
                  onChange={(v) =>
                    setRules((r) => ({ ...r, showPlayerStatistics: v }))
                  }
                />
                <ToggleRow
                  label="Show Market Value"
                  checked={rules.showMarketValue}
                  onChange={(v) =>
                    setRules((r) => ({ ...r, showMarketValue: v }))
                  }
                />
              </div>
            </Card>
          )}

          {/* Step 6 — Review */}
          {step === 5 && (
            <Card className="space-y-6">
              <CardHeader>
                <CardTitle>Auction Review</CardTitle>
                <CardDescription>
                  Confirm everything looks right before creating.
                </CardDescription>
              </CardHeader>
              <div>
                <h2 className="font-display text-3xl tracking-wide">{name}</h2>
                {description ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="accent">{visibility}</Badge>
                  <Badge variant="muted">{teamCount} teams</Badge>
                  <Badge variant="muted">{formatCurrency(startingBudget)} / team</Badge>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Buckets
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {enabledBuckets.map((b) => (
                      <Badge key={b.id} variant="default">
                        {b.name} · {b.playerIds.length}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Base Bid</span>
                    <span>{formatCurrency(rules.baseBid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Bid Increment</span>
                    <span>{formatCurrency(rules.minIncrement)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Timer</span>
                    <span>{rules.biddingTimer} sec</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Squad Size</span>
                    <span>{rules.maxSquadSize}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Teams
                </p>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{teamCount} teams</span> will be created
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Friends will join with the room code and create their own team names.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 7 — Created */}
          {step === 6 && created && (
            <Card className="space-y-6 text-center sm:text-left">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[var(--accent)]">
                  <Check className="h-6 w-6" />
                </span>
                <div>
                  <CardTitle className="text-3xl">Auction Created</CardTitle>
                  <CardDescription className="mt-1 text-base">
                    {created.name}
                  </CardDescription>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-dim)] px-6 py-8 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Room Code
                </p>
                <p className="mt-3 font-display text-5xl tracking-[0.2em] text-[var(--accent)] sm:text-6xl">
                  {created.roomCode}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyText("Code", created.roomCode)}
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    copyText("Invite link", inviteLink(created.roomCode))
                  }
                >
                  <Link2 className="h-4 w-4" />
                  Copy Invite Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const url = inviteLink(created.roomCode);
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: created.name,
                          text: `Join my football auction — code ${created.roomCode}`,
                          url,
                        });
                      } catch {
                        /* dismissed */
                      }
                    } else {
                      void copyText("Invite link", url);
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    Status
                  </p>
                  <Badge variant="accent">
                    <Users className="h-3 w-3" />
                    Waiting for Participants
                  </Badge>
                </div>
                <p className="text-sm text-foreground">
                  Share the invite link (not localhost) with your friends. They must
                  sign in with a <span className="text-[var(--accent)]">different email</span>{" "}
                  than yours, then join. Stay on the same Wi‑Fi. If the browser
                  warns about the certificate, continue — camera and mic need HTTPS.
                </p>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => router.push(`/auction/${created.id}/lobby`)}
              >
                Start Auction
              </Button>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      {step < 6 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 5 ? (
            <Button
              type="button"
              disabled={!canProceed()}
              onClick={() => {
                if (!canProceed()) {
                  toast.error("Please complete this step");
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canProceed() || isCreating}
              onClick={() => void handleCreate()}
            >
              {isCreating ? "Creating…" : "Create Auction"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
