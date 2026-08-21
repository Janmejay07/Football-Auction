import { NextResponse } from "next/server";
import { roomStore } from "@/lib/server/roomStore";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const forUserId = new URL(request.url).searchParams.get("for") ?? undefined;
    const room = await roomStore.getByCode(code, forUserId);
    return NextResponse.json(room);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auction not found" },
      { status: 404 }
    );
  }
}
