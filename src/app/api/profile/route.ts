import { NextResponse } from "next/server";
import { userStore } from "@/lib/server/userStore";

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    return NextResponse.json({ profile: await userStore.getProfile(userId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load profile" },
      { status: 404 }
    );
  }
}