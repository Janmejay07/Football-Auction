"use client";

import type { ReactNode } from "react";

/**
 * Thin layout wrapper for authenticated routes.
 * AuthGuard in the root layout already handles redirects.
 */
export function ProtectedPage({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
