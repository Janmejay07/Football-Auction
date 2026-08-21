import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "live" | "success" | "warning" | "muted" | "accent";
}) {
  const variants = {
    default: "bg-white/10 text-foreground",
    live: "bg-[var(--live)]/20 text-[var(--live)] border border-[var(--live)]/40",
    success: "bg-[var(--success)]/15 text-[var(--success)]",
    warning: "bg-[var(--warning)]/15 text-[var(--warning)]",
    muted: "bg-white/5 text-[var(--muted)]",
    accent: "bg-[var(--accent-dim)] text-[var(--accent)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
