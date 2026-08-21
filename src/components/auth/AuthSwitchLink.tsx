"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function AuthSwitchLink({
  href,
  children,
}: {
  href: "/login" | "/signup";
  children: React.ReactNode;
}) {
  const next = useSearchParams().get("next");
  const query = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <Link
      href={`${href}${query}`}
      className="font-semibold text-[var(--accent)] hover:underline"
    >
      {children}
    </Link>
  );
}
