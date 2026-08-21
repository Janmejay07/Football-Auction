import { networkInterfaces } from "node:os";
import { NextResponse } from "next/server";
import { readPublicOrigin } from "@/lib/server/publicOrigin";

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
  const publicOrigin = await readPublicOrigin();
  return NextResponse.json({ addresses, publicOrigin });
}
