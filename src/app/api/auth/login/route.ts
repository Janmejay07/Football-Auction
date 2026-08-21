import { NextResponse } from "next/server";
import { userStore } from "@/lib/server/userStore";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    const user = await userStore.login(body.email, body.password);
    return NextResponse.json({ user });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    const isAuthenticationError = message === "Invalid email or password";

    if (!isAuthenticationError) {
      console.error("Login database error:", e);
    }

    return NextResponse.json(
      {
        error: isAuthenticationError
          ? "No account found with these credentials. Please sign up first or check your email and password."
          : "Unable to connect to the account service. Please try again in a moment.",
      },
      { status: isAuthenticationError ? 401 : 503 }
    );
  }
}
