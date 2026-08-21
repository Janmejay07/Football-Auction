"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const STADIUM_IMG =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&q=80";

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Taking you to the dashboard…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src={STADIUM_IMG}
        alt="Night football stadium"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[var(--background)]/75 to-[var(--background)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,245,96,0.12),transparent_55%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="font-display text-2xl tracking-wide text-[var(--accent)] sm:text-3xl">
            Football Auction
          </span>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <motion.p
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="font-display text-6xl leading-none tracking-wide text-[var(--accent)] sm:text-7xl md:text-8xl"
            >
              Football Auction
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-6 font-display text-3xl tracking-wide text-white sm:text-4xl md:text-5xl"
            >
              Live player auctions with friends
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mx-auto mt-4 max-w-xl text-base text-white/70 sm:text-lg"
            >
              Host a private room, bid under the clock, and build a squad that feels like match day.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.45 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Link href="/signup">
                <Button size="lg">
                  <Gavel className="h-4 w-4" />
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
