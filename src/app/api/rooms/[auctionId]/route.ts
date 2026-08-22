import { NextResponse } from "next/server";
import { roomStore } from "@/lib/server/roomStore";
import type { ChatMessage } from "@/types/auction";
import type { LiveSyncState, RtcSignal } from "@/types/room";

export async function GET(
  request: Request,
  context: { params: Promise<{ auctionId: string }> }
) {
  try {
    const { auctionId } = await context.params;
    const forUserId = new URL(request.url).searchParams.get("for") ?? undefined;
    return NextResponse.json(await roomStore.get(auctionId, forUserId, false));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auction not found" },
      { status: 404 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ auctionId: string }> }
) {
  try {
    const { auctionId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");

    switch (action) {
      case "join": {
        const room = await roomStore.join({
          code: String(body.code ?? ""),
          userId: String(body.userId ?? ""),
          userName: String(body.userName ?? "Manager"),
          teamId: body.teamId ? String(body.teamId) : undefined,
          teamName: body.teamName ? String(body.teamName) : undefined,
        });
        return NextResponse.json(room);
      }
      case "claim-team": {
        const room = await roomStore.claimTeam(
          auctionId,
          String(body.teamId ?? ""),
          String(body.userId ?? ""),
          String(body.userName ?? "Manager")
        );
        return NextResponse.json(room);
      }
      case "leave": {
        const room = await roomStore.leave(auctionId, String(body.userId ?? ""));
        return NextResponse.json(room);
      }
      case "start": {
        const room = await roomStore.start(auctionId, String(body.userId ?? ""));
        return NextResponse.json(room);
      }
      case "chat": {
        const message = await roomStore.chat({
          auctionId,
          content: String(body.content ?? ""),
          senderId: String(body.senderId ?? ""),
          senderName: String(body.senderName ?? "Manager"),
          type: body.type as ChatMessage["type"] | undefined,
        });
        return NextResponse.json({ message });
      }
      case "presence": {
        const room = await roomStore.presence({
          auctionId,
          userId: String(body.userId ?? ""),
          isMicOn: typeof body.isMicOn === "boolean" ? body.isMicOn : undefined,
          isCameraOn:
            typeof body.isCameraOn === "boolean" ? body.isCameraOn : undefined,
          isSpeaking:
            typeof body.isSpeaking === "boolean" ? body.isSpeaking : undefined,
        });
        return NextResponse.json(room);
      }
      case "signal": {
        await roomStore.signal(auctionId, {
          from: String(body.from ?? ""),
          to: String(body.to ?? ""),
          type: body.type as RtcSignal["type"],
          payload: body.payload,
        });
        return NextResponse.json({ ok: true });
      }
      case "bid": {
        const { bid, snapshot } = await roomStore.placeBid({
          auctionId,
          playerId: String(body.playerId ?? ""),
          teamId: String(body.teamId ?? ""),
          teamName: String(body.teamName ?? ""),
          amount: Number(body.amount ?? 0),
          userId: body.userId ? String(body.userId) : undefined,
          commandId: body.commandId ? String(body.commandId) : undefined,
        });
        return NextResponse.json({ success: true, bid, snapshot });
      }
      case "settle": {
        const mode =
          body.mode === "unsold" || body.mode === "sold" ? body.mode : "auto";
        const room = await roomStore.settleLot(
          auctionId,
          mode,
          String(body.userId ?? "")
        );
        return NextResponse.json(room);
      }
      case "advance": {
        const room = await roomStore.forceAdvance(
          auctionId,
          String(body.userId ?? "")
        );
        return NextResponse.json(room);
      }
      case "live": {
        const room = await roomStore.pushLive(
          auctionId,
          (body.live ?? {}) as Partial<LiveSyncState>,
          String(body.userId ?? "")
        );
        return NextResponse.json(room);
      }
      case "status": {
        const room = await roomStore.updateAuctionStatus(
          auctionId,
          body.status as "live" | "paused" | "completed" | "cancelled",
          String(body.userId ?? ""),
          body.cancellationReason === "heartbeat_timeout" ||
            body.cancellationReason === "host_left" ||
            body.cancellationReason === "host_cancelled"
            ? body.cancellationReason
            : undefined
        );
        return NextResponse.json(room);
      }
      case "spend": {
        await roomStore.updateTeamSpend(
          auctionId,
          String(body.teamId ?? ""),
          Number(body.amount ?? 0),
          String(body.playerId ?? "")
        );
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 400 }
    );
  }
}
