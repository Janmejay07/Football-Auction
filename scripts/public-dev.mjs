import { spawn } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const originFile = join(root, ".public-origin");
const children = [];

function cleanup() {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* already exited */
    }
  }
  try {
    unlinkSync(originFile);
  } catch {
    /* missing */
  }
}

process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

function pipe(child, label) {
  child.stdout?.on("data", (buf) => process.stdout.write(`[${label}] ${buf}`));
  child.stderr?.on("data", (buf) => process.stderr.write(`[${label}] ${buf}`));
}

const next = spawn("npm", ["run", "dev:http"], {
  cwd: root,
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env },
});
children.push(next);
pipe(next, "next");
next.on("exit", (code) => {
  if (code) process.exit(code);
});

async function waitForLocal() {
  for (let i = 0; i < 80; i++) {
    try {
      await fetch("http://127.0.0.1:3000", { redirect: "manual" });
      return;
    } catch {
      await sleep(500);
    }
  }
  process.stderr.write(
    "Timed out waiting for http://localhost:3000. Is another server using that port?\n"
  );
}

await waitForLocal();

const tunnel = spawn(
  "npx",
  ["--yes", "cloudflared", "tunnel", "--url", "http://127.0.0.1:3000"],
  {
    cwd: root,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  }
);
children.push(tunnel);
pipe(tunnel, "tunnel");

let saved = false;
function maybeSave(text) {
  if (saved) return;
  const match = String(text).match(
    /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i
  );
  if (!match) return;
  saved = true;
  writeFileSync(originFile, match[0], "utf8");
  process.stdout.write(
    `\nPublic invite URL (share this with friends on any network):\n  ${match[0]}/auction/join\n\nYou can stay on http://localhost:3000. After you create a room, copy Invite Link from the lobby — it updates to this public URL.\nYour friend must open that https://…trycloudflare.com link (not a 192.168 address).\n\n`
  );
}

tunnel.stdout?.on("data", maybeSave);
tunnel.stderr?.on("data", maybeSave);
