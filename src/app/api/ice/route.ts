import { NextResponse } from "next/server";

type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

const STUN_SERVERS: IceServer = {
  urls: [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
    "stun:stun.cloudflare.com:3478",
    "stun:freeturn.net:3478",
  ],
};

// Free public TURN so two home NATs can exchange camera/mic.
// Prefer your own TURN_* credentials for reliability.
const FREE_TURN: IceServer[] = [
  {
    urls: [
      "turn:freeturn.net:3478",
      "turn:freeturn.net:3478?transport=tcp",
      "turns:freeturn.net:5349",
      "turns:freeturn.tel:5349",
    ],
    username: "free",
    credential: "free",
  },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:80?transport=tcp",
      "turn:openrelay.metered.ca:443",
      "turns:openrelay.metered.ca:443",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export async function GET() {
  const iceServers: IceServer[] = [STUN_SERVERS];

  const urls = (process.env.TURN_URLS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const username = process.env.TURN_USERNAME?.trim();
  const credential = process.env.TURN_CREDENTIAL?.trim();
  if (urls.length && username && credential) {
    iceServers.push({ urls, username, credential });
  } else {
    iceServers.push(...FREE_TURN);
  }

  return NextResponse.json({ iceServers });
}
