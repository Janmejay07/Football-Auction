import { networkInterfaces } from "node:os";
import { NextResponse } from "next/server";

export async function GET() {
  const addresses: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      const family = String(addr.family);
      if ((family === "IPv4" || family === "4") && !addr.internal) {
        addresses.push(addr.address);
      }
    }
  }
  return NextResponse.json({ addresses });
}
