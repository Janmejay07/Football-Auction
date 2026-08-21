import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function JoinAuctionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen stadium-bg">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(5,7,11,0.85)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <p className="font-display text-lg tracking-[0.12em] text-[var(--accent)] sm:text-xl">
            Football Auction
          </p>
          <div className="w-24" aria-hidden />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
