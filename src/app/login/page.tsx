import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSwitchLink } from "@/components/auth/AuthSwitchLink";

const STADIUM_IMG =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&q=80";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src={STADIUM_IMG}
          alt="Football stadium at night"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-black/40" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p className="font-display text-5xl tracking-wide text-[var(--accent)] xl:text-6xl">
            Football Auction
          </p>
          <p className="mt-3 max-w-md text-lg text-white/80">
            Live player drafts with friends. Build your dream squad under the floodlights.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-3xl text-[var(--accent)]">Football Auction</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Sign in to enter the auction</p>
          </div>

          <div className="glass-panel rounded-2xl p-8 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
            <h1 className="font-display text-3xl tracking-wide">Welcome back</h1>
            <p className="mt-1 mb-8 text-sm text-[var(--muted)]">
              Sign in to join live auctions and manage your squads.
            </p>
            <LoginForm />
            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              New to the pitch?{" "}
              <Suspense fallback={<Link href="/signup" className="font-semibold text-[var(--accent)]">Create an account</Link>}>
                <AuthSwitchLink href="/signup">Create an account</AuthSwitchLink>
              </Suspense>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
