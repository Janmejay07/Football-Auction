import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const lanHosts = Object.values(networkInterfaces())
  .flatMap((addrs) => addrs ?? [])
  .filter((addr) => String(addr.family) === "IPv4" || String(addr.family) === "4")
  .filter((addr) => !addr.internal)
  .map((addr) => addr.address);

function publicHost() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return [];
  try {
    return [new URL(value).hostname];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    ...lanHosts,
    ...publicHost(),
    "*.trycloudflare.com",
    "trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
    "*.loca.lt",
    "*.pinggy.io",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
