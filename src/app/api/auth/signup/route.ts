import { NextResponse } from "next/server";
import { userStore } from "@/lib/server/userStore";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      favoriteClub?: string;
    };
    if (!body.fullName || !body.username || !body.email || !body.password) {
      return NextResponse.json({ error: "Missing account details" }, { status: 400 });
    }
    if (body.password !== body.confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    const user = await userStore.signup({
      fullName: body.fullName,
      username: body.username,
      email: body.email,
      password: body.password,
      favoriteClub: body.favoriteClub,
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Signup failed" },
      { status: 400 }
    );
  }
}
