import { NextResponse } from "next/server";
import { roomStore } from "@/lib/server/roomStore";
import type { AuctionConfig } from "@/types/auction";

export async function GET() {
  try {
    const auctions = await roomStore.list();
    return NextResponse.json({ auctions });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load auctions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      config: AuctionConfig;
      hostId: string;
      hostName: string;
    };
    if (!body?.config?.name || !body.hostId || !body.hostName) {
      return NextResponse.json({ error: "Missing auction details" }, { status: 400 });
    }
    const room = await roomStore.create(body.config, body.hostId, body.hostName);
    return NextResponse.json(room);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create auction" },
      { status: 400 }
    );
  }
}
