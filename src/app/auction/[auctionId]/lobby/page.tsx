"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Copy,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  MessageCircle,
  Play,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParticipantVideoCard } from "@/components/participants/ParticipantVideoCard";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useAuctionStore } from "@/store/auctionStore";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { auctionService } from "@/lib/services/auctionService";
import { useLanOrigin } from "@/hooks/useLanOrigin";

export default function AuctionLobbyPage() {
  const params = useParams<{ auctionId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    auction,
    auctionStatus,
    participants,
    toggleMic,
    toggleCamera,
  } = useAuctionStore();
  const { chatDrawerOpen, setChatDrawerOpen } = useUiStore();
  const { origin: lanOrigin, reachableOffLan } = useLanOrigin();
  const inviteUrl = `${lanOrigin}/auction/join?code=${auction.roomCode}`;
  const [starting, setStarting] = useState(false);

  const me = participants.find((p) => p.userId === user?.id);
  const isHost = Boolean(me?.isHost || user?.id === auction.hostId);

  const copyCode = async () => {
    await navigator.clipboard.writeText(auction.roomCode);
    toast.success("Invite code copied");
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    if (reachableOffLan) {
      toast.success("Invite link copied — friends must use this URL");
    } else {
      toast.error(
        "Copied, but this is a local Wi‑Fi link. Stop the server and run npm run dev:public, then copy again for a friend on another network."
      );
    }
  };

  const onStart = async () => {
    if (!user || starting) return;
    setStarting(true);
    try {
      const room = await auctionService.startAuction(params.auctionId, user.id);
      useAuctionStore.getState().applySnapshot(room);
      toast.success("Auction started");
      router.push(`/auction/${params.auctionId}/live`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
      setStarting(false);
    }
  };

  const onLeave = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      isHost
        ? "Leaving as host will end this auction for everyone. Continue?"
        : "Leave this auction? You can join again while it is open."
    );
    if (!confirmed) return;
    try {
      const room = await auctionService.leaveAuction(params.auctionId, user.id);
      if (isHost || room.auction.status === "cancelled") {
        router.push(`/auction/${params.auctionId}/results`);
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not leave auction");
    }
  };

  useEffect(() => {
    if (auction.status === "cancelled" || auctionStatus === "cancelled") {
      toast.error("Auction cancelled");
      router.push(`/auction/${params.auctionId}/results`);
    }
  }, [auction.status, auctionStatus, params.auctionId, router]);

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="accent">Lobby</Badge>
          <h1 className="font-display mt-2 text-4xl md:text-5xl">{auction.name}</h1>
          <p className="mt-1 font-mono text-sm text-[var(--accent)]">
            ROOM: {auction.roomCode}
          </p>
          {lanOrigin && (
            <p className="mt-1 break-all text-xs text-[var(--muted)]">{inviteUrl}</p>
          )}
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            Invite friends with this link. They sign in with a different email,
            join, then turn on camera and mic.
            {reachableOffLan ? (
              <>
                {" "}
                This invite works on any network. Your friend must open this
                exact https link (not a 192.168 address).
              </>
            ) : (
              <>
                {" "}
                This link only works on the same Wi‑Fi. For a friend on another
                network, stop the server and run{" "}
                <code className="rounded bg-white/10 px-1">npm run dev:public</code>
                , wait for the toast that the public URL is ready, then copy
                Invite Link again.
              </>
            )}
          </p>
          {reachableOffLan ? (
            <Badge variant="success" className="mt-2">
              Reachable off Wi‑Fi
            </Badge>
          ) : (
            <Badge variant="warning" className="mt-2">
              Same Wi‑Fi only — run npm run dev:public
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void copyCode()}>
            <Copy className="h-4 w-4" /> Copy Code
          </Button>
          <Button variant="secondary" onClick={() => void copyInvite()}>
            <Copy className="h-4 w-4" /> Copy Invite Link
          </Button>
          {isHost && (
            <Button onClick={() => void onStart()} disabled={participants.length < 1 || starting}>
              <Play className="h-4 w-4" /> {starting ? "Starting..." : "Start Auction"}
            </Button>
          )}
          <Button variant="outline" onClick={() => void onLeave()}>
            <LogOut className="h-4 w-4" /> Leave Auction
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl">Participants</h2>
            <span className="text-sm text-[var(--muted)]">
              {participants.length} / {auction.teamCount} joined · {participants.filter((p) => p.teamId).length} teams claimed
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
            {participants.map((p, i) => (
              <motion.div
                key={p.id}
                className="min-w-0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ParticipantVideoCard participant={p} large={p.isHost} />
              </motion.div>
            ))}
            {participants.length === 0 && (
              <p className="text-sm text-[var(--muted)]">Connecting to room…</p>
            )}
          </div>
        </div>

        <div className="hidden h-[520px] lg:block">
          <ChatPanel auctionId={params.auctionId} />
        </div>
      </div>

      {chatDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setChatDrawerOpen(false)}
            aria-label="Close chat"
          />
          <div className="absolute bottom-0 left-0 right-0 h-[70vh] p-3">
            <ChatPanel auctionId={params.auctionId} />
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-[#0c121c]/95 px-3 py-2 shadow-2xl backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          title="Microphone"
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
        <Button variant="ghost" size="icon" title="Speaker">
          <Volume2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Chat"
          className="lg:hidden"
          onClick={() => setChatDrawerOpen(true)}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        {isHost && (
          <Button size="sm" className="ml-2" onClick={() => void onStart()} disabled={starting}>
            {starting ? "Starting..." : "Start Auction"}
          </Button>
        )}
        <Button variant="ghost" size="icon" title="Leave auction" onClick={() => void onLeave()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
