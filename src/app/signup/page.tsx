import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthSwitchLink } from "@/components/auth/AuthSwitchLink";

const STADIUM_IMG =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&q=80";

export default function SignupPage() {
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
            Claim your seat. Host private rooms, bid live, and feel every hammer drop.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <p className="font-display text-3xl text-[var(--accent)]">Football Auction</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Create your manager account</p>
          </div>

          <div className="glass-panel rounded-2xl p-8 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
            <h1 className="font-display text-3xl tracking-wide">Create account</h1>
            <p className="mt-1 mb-6 text-sm text-[var(--muted)]">
              Set up your profile and start drafting tonight.
            </p>
            <SignupForm />
            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              Already have an account?{" "}
              <Suspense fallback={<Link href="/login" className="font-semibold text-[var(--accent)]">Sign in</Link>}>
                <AuthSwitchLink href="/login">Sign in</AuthSwitchLink>
              </Suspense>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
