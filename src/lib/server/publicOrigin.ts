import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readPublicOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  try {
    const raw = await readFile(join(process.cwd(), ".public-origin"), "utf8");
    return raw.trim().replace(/\/$/, "");
  } catch {
    return "";
  }
}
