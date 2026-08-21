"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(true);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const persist = useAuthStore.persist;
    if (!persist) return;
    return persist.onFinishHydration(() => {
      setHydrated(true);
      void hydrate();
    });
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!isAuthenticated && !isPublic) {
      const next = `${pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
      );
    }
  }, [isAuthenticated, pathname, router, hydrated]);

  return <>{children}</>;
}
