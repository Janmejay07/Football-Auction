"use client";

import { useEffect, useState } from "react";

function currentOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function configuredOrigin() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return "";
  return value.replace(/\/$/, "");
}

function isLoopback(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export function useLanOrigin() {
  const [origin, setOrigin] = useState(() => configuredOrigin() || currentOrigin());

  useEffect(() => {
    const publicOrigin = configuredOrigin();
    if (publicOrigin) {
      return;
    }

    const { protocol, hostname, port } = window.location;
    if (!isLoopback(hostname)) {
      return;
    }
    void fetch("/api/lan")
      .then((res) => res.json() as Promise<{ addresses?: string[] }>)
      .then((data) => {
        const ip = data.addresses?.[0];
        if (!ip) return;
        const host = port ? `${ip}:${port}` : ip;
        setOrigin(`${protocol}//${host}`);
      })
      .catch(() => undefined);
  }, []);

  return origin || currentOrigin();
}
