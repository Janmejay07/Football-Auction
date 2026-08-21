"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

function isPrivateHost(host: string) {
  if (isLoopback(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

export function useLanOrigin() {
  const [origin, setOrigin] = useState(
    () => configuredOrigin() || currentOrigin()
  );
  const [reachableOffLan, setReachableOffLan] = useState(() => {
    const configured = configuredOrigin();
    if (configured) {
      try {
        return !isPrivateHost(new URL(configured).hostname);
      } catch {
        return false;
      }
    }
    if (typeof window === "undefined") return false;
    return !isPrivateHost(window.location.hostname);
  });
  const announcedRef = useRef(reachableOffLan);

  useEffect(() => {
    let stopped = false;
    let pollId = 0;

    const refresh = async () => {
      try {
        const res = await fetch("/api/lan", { cache: "no-store" });
        const data = (await res.json()) as {
          addresses?: string[];
          publicOrigin?: string;
        };
        if (stopped) return true;

        const publicOrigin = data.publicOrigin?.replace(/\/$/, "");
        if (publicOrigin) {
          setOrigin(publicOrigin);
          try {
            setReachableOffLan(!isPrivateHost(new URL(publicOrigin).hostname));
          } catch {
            setReachableOffLan(true);
          }
          if (!announcedRef.current) {
            announcedRef.current = true;
            toast.success(
              "Public invite URL ready — copy Invite Link for friends off your Wi‑Fi"
            );
          }
          return true;
        }

        const { protocol, hostname, port } = window.location;
        if (!isPrivateHost(hostname)) {
          setOrigin(currentOrigin());
          setReachableOffLan(true);
          return true;
        }

        const ip = data.addresses?.[0];
        if (ip && isLoopback(hostname)) {
          const host = port ? `${ip}:${port}` : ip;
          setOrigin(`${protocol}//${host}`);
        }
        setReachableOffLan(false);
        return false;
      } catch {
        return false;
      }
    };

    void refresh().then((ready) => {
      if (stopped || ready) return;
      pollId = window.setInterval(() => {
        void refresh().then((done) => {
          if (done && pollId) window.clearInterval(pollId);
        });
      }, 2000);
    });

    return () => {
      stopped = true;
      if (pollId) window.clearInterval(pollId);
    };
  }, []);

  return { origin: origin || currentOrigin(), reachableOffLan };
}
