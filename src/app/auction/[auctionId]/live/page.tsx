"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Users,
  Trophy,
  Pause,
  Play,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LivePlayerCard } from "@/components/auction/LivePlayerCard";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { AuctionTicker, CountdownSoundWatcher } from "@/hooks/useAuctionTimer";
import { BidHistory } from "@/components/auction/BidHistory";
import { BidButton } from "@/components/auction/BidButton";
import { PlayerBucketSidebar } from "@/components/auction/PlayerBucketSidebar";
import { AuctionControls } from "@/components/auction/AuctionControls";
import {
  SoldOverlay,
  UnsoldOverlay,
  BucketTransitionOverlay,
} from "@/components/auction/AuctionOverlays";
import { ParticipantVideoCard } from "@/components/participants/ParticipantVideoCard";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { TeamBudgetPanel, SquadList } from "@/components/team/TeamBudget";
import { Modal } from "@/components/ui/modal";
import { useAuctionStore } from "@/store/auctionStore";
import { useTeamStore } from "@/store/teamStore";
import { useAuthStore } from "@/store/authStore";
import { auctionService } from "@/lib/services/auctionService";
import { useUiStore } from "@/store/uiStore";
import { formatCurrency } from "@/lib/utils";
import type { Player } from "@/types/player";

export default function LiveAuctionPage() {
  const params = useParams<{ auctionId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const myTeam = useTeamStore((s) => s.teams.find((t) => t.id === s.myTeamId) ?? null);
  const {
    auction,
    auctionStatus,
    participants,
    currentPlayer,
    currentBid,
    timeRemaining,
    bidHistory,
    overlay,
    currentBucketIndex,
    getEnabledBuckets,
    getQueue,
    nextPlayer,
    toggleMic,
    toggleCamera,
    isPaused,
    pauseAuction,
    resumeAuction,
  } = useAuctionStore();

  const {
    soundEnabled,
    toggleSound,
    chatDrawerOpen,
    setChatDrawerOpen,
    bidHistoryOpen,
    setBidHistoryOpen,
  } = useUiStore();

  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
  const [bidHighlight, setBidHighlight] = useState(false);

  const me = participants.find((p) => p.userId === user?.id);
  const isHost = Boolean(me?.isHost || user?.id === auction.hostId);
  const host = participants.find((p) => p.isHost);
  const buckets = getEnabledBuckets();
  const queue = getQueue();
  const bucket = buckets[currentBucketIndex];

  const onLeave = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      isHost
        ? "Leaving as host will end this auction for everyone. Continue?"
        : "Leave this auction?"
    );
    if (!confirmed) return;
    try {
      const room = await auctionService.leaveAuction(auction.id, user.id);
      router.push(
        isHost || room.auction.status === "cancelled"
          ? `/auction/${auction.id}/results`
          : "/dashboard"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not leave auction");
    }
  };

  useEffect(() => {
    if (bidHistory.length === 0) return;
    const highlight = window.setTimeout(() => setBidHighlight(true), 0);
    const t = window.setTimeout(() => setBidHighlight(false), 500);
    return () => {
      window.clearTimeout(highlight);
      window.clearTimeout(t);
    };
  }, [bidHistory.length]);

  useEffect(() => {
    if (auctionStatus === "completed") {
      toast.success("Auction complete");
      router.push(`/auction/${params.auctionId}/results`);
    }
    if (auctionStatus === "cancelled") {
      router.push(`/auction/${params.auctionId}/results`);
    }
  }, [auctionStatus, params.auctionId, router]);

  const progressLabel = useMemo(() => {
    if (!bucket) return "";
    const total = bucket.playerIds.length;
    const done =
      total -
      bucket.playerIds.filter(
        (id) =>
          !useAuctionStore.getState().soldPlayerIds.includes(id) &&
          !useAuctionStore.getState().unsoldPlayerIds.includes(id)
      ).length;
    return `${done} / ${total} players`;
  }, [bucket]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1600px] flex-col gap-3 px-3 py-3 pb-28 lg:px-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl md:text-3xl">⚽ {auction.name}</span>
          <Badge variant="muted">Round {currentBucketIndex + 1}</Badge>
        </div>
        {isPaused || auctionStatus === "paused" ? (
          <Badge variant="warning">Paused</Badge>
        ) : (
          <Badge variant="live" className="live-pulse">
            Live
          </Badge>
        )}
      </header>

      {/* Main grid */}
      <div className="grid flex-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <div className="hidden lg:block">
          <PlayerBucketSidebar
            buckets={buckets}
            currentIndex={currentBucketIndex}
            queue={queue}
            progressLabel={progressLabel}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {currentPlayer ? (
            <LivePlayerCard
              player={currentPlayer}
              currentBid={currentBid}
              showMarketValue={auction.rules.showMarketValue}
              highlight={bidHighlight}
              onOpenProfile={() => setProfilePlayer(currentPlayer)}
            />
          ) : (
            <div className="glass-panel flex flex-1 items-center justify-center rounded-2xl p-10">
              <p className="text-[var(--muted)]">Waiting for next player…</p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            {host && (
              <div className="order-2 md:order-1">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  Auctioneer
                </p>
                <ParticipantVideoCard participant={host} large />
              </div>
            )}
            <div className="order-1 flex justify-center md:order-2">
              <AuctionTimer seconds={timeRemaining} />
            </div>
            <div className="order-3 space-y-3">
              <BidButton />
              <div className="hidden md:block">
                <TeamBudgetPanel team={myTeam} />
              </div>
            </div>
          </div>

          <AuctionControls isHost={isHost} />
        </div>

        <div className="hidden flex-col gap-3 lg:flex">
          <div className="min-h-[280px] flex-1">
            <BidHistory bids={bidHistory} />
          </div>
          <SquadList team={myTeam} onPlayerClick={setProfilePlayer} />
        </div>
      </div>

      {/* Participants strip */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Participants
          </h3>
          <div className="flex gap-3 text-xs text-[var(--muted)] md:hidden">
            <span>{formatCurrency(myTeam ? myTeam.budget - myTeam.spent : 0)} left</span>
            <span>
              Squad {myTeam?.squad.length ?? 0}/{myTeam?.maxSquadSize ?? 18}
            </span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {participants.map((p) => (
            <div key={p.id} className="w-[150px] shrink-0">
              <ParticipantVideoCard participant={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Mobile bid history sheet */}
      {bidHistoryOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            aria-label="Close bids"
            onClick={() => setBidHistoryOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 h-[55vh] p-3">
            <BidHistory bids={bidHistory} />
          </div>
        </div>
      )}

      {chatDrawerOpen && (
        <div className="fixed inset-0 z-40">
          <button
            className="absolute inset-0 bg-black/60"
            aria-label="Close chat"
            onClick={() => setChatDrawerOpen(false)}
          />
          <div className="absolute bottom-0 right-0 top-0 w-full max-w-md p-3 sm:p-4">
            <ChatPanel auctionId={params.auctionId} className="h-full" />
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="fixed bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-[#0c121c]/95 px-2 py-2 shadow-2xl backdrop-blur md:gap-2 md:px-4">
        <Button
          variant="ghost"
          size="icon"
          title="Mic"
          onClick={() => me && toggleMic(me.id)}
        >
          {me?.isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Camera"
          onClick={() => me && toggleCamera(me.id)}
        >
          {me?.isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" title="Sound" onClick={toggleSound}>
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={isPaused || auctionStatus === "paused" ? "Resume auction" : "Pause auction"}
          onClick={() => {
            if (isPaused || auctionStatus === "paused") {
              resumeAuction(user?.fullName);
              toast("Auction resumed");
            } else {
              pauseAuction(user?.fullName);
              toast("Auction paused");
            }
          }}
        >
          {isPaused || auctionStatus === "paused" ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Chat"
          onClick={() => setChatDrawerOpen(true)}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Bids"
          className="lg:hidden"
          onClick={() => setBidHistoryOpen(true)}
        >
          <Users className="h-4 w-4" />
        </Button>
        <div className="mx-2 hidden h-6 w-px bg-white/10 sm:block" />
        <div className="hidden items-center gap-3 px-2 text-xs sm:flex">
          <span className="text-[var(--accent)]">
            {formatCurrency(myTeam ? myTeam.budget - myTeam.spent : 0)} left
          </span>
          <span className="text-[var(--muted)]">
            Squad {myTeam?.squad.length ?? 0}/{myTeam?.maxSquadSize ?? 18}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-1"
          onClick={() => router.push(`/auction/${params.auctionId}/results`)}
        >
          <Trophy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          title="Leave auction"
          onClick={() => void onLeave()}
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>

      <AuctionTicker />
      <CountdownSoundWatcher />

      <SoldOverlay
        open={overlay.type === "sold"}
        player={overlay.type === "sold" ? overlay.player : undefined}
        price={overlay.type === "sold" ? overlay.price : undefined}
        teamName={overlay.type === "sold" ? overlay.teamName : undefined}
        onContinue={() => nextPlayer()}
      />
      <UnsoldOverlay
        open={overlay.type === "unsold"}
        player={overlay.type === "unsold" ? overlay.player : undefined}
        onContinue={() => nextPlayer()}
      />
      <BucketTransitionOverlay
        open={overlay.type === "bucket"}
        from={overlay.type === "bucket" ? overlay.from : undefined}
        to={overlay.type === "bucket" ? overlay.to : undefined}
      />

      <Modal
        open={!!profilePlayer}
        onClose={() => setProfilePlayer(null)}
        title="Player Profile"
        className="max-w-xl"
      >
        {profilePlayer && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profilePlayer.image}
                alt={profilePlayer.name}
                className="h-28 w-24 rounded-xl object-cover"
              />
              <div>
                <h3 className="font-display text-3xl">{profilePlayer.name}</h3>
                <p className="text-sm text-[var(--muted)]">
                  {profilePlayer.nationalityFlag} {profilePlayer.nationality} ·{" "}
                  {profilePlayer.position} · {profilePlayer.rating} OVR
                </p>
                <p className="mt-2 text-sm">{profilePlayer.currentClub}</p>
                <p className="text-[var(--accent)]">
                  Market {formatCurrency(profilePlayer.marketValue)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["Apps", profilePlayer.stats.appearances],
                ["Goals", profilePlayer.stats.goals],
                ["Assists", profilePlayer.stats.assists],
                ["Mins", profilePlayer.stats.minutes],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg bg-white/5 p-2">
                  <p className="text-[10px] uppercase text-[var(--muted)]">{label}</p>
                  <p className="font-display text-xl">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
