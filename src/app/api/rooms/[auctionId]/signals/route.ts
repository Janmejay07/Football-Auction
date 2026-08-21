import { NextResponse } from "next/server";
import { roomStore } from "@/lib/server/roomStore";
import type { RtcSignal } from "@/types/room";

export async function GET(
  request: Request,
  context: { params: Promise<{ auctionId: string }> }
) {
  try {
    const { auctionId } = await context.params;
    const forUserId = new URL(request.url).searchParams.get("for") ?? "";
    if (!forUserId) {
      return NextResponse.json({ signals: [] as RtcSignal[] });
    }
    const signals = await roomStore.pullSignals(auctionId, forUserId);
    return NextResponse.json({ signals });
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
    const body = (await request.json()) as {
      from?: string;
      to?: string;
      type?: RtcSignal["type"];
      payload?: unknown;
      signals?: Omit<RtcSignal, "id">[];
    };
    if (Array.isArray(body.signals) && body.signals.length) {
      await roomStore.signal(auctionId, body.signals);
    } else {
      await roomStore.signal(auctionId, {
        from: String(body.from ?? ""),
        to: String(body.to ?? ""),
        type: body.type as RtcSignal["type"],
        payload: body.payload,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 400 }
    );
  }
}
