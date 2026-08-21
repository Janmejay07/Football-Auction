import Link from "next/link";
import { AuctionRoomSync } from "@/components/auction/AuctionRoomClient";
import { AuctionLeaveButton } from "@/components/auction/AuctionLeaveButton";

export default function AuctionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ auctionId: string }>;
}) {
  return <AuctionLayoutInner params={params}>{children}</AuctionLayoutInner>;
}

async function AuctionLayoutInner({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ auctionId: string }>;
}) {
  const { auctionId } = await params;

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/5 bg-black/40 px-4 py-2 text-xs text-[var(--muted)]">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4">
          <Link href="/dashboard" className="hover:text-[var(--accent)]">
            ← Dashboard
          </Link>
          <Link
            href={`/auction/${auctionId}/lobby`}
            className="hover:text-foreground"
          >
            Lobby
          </Link>
          <Link href={`/auction/${auctionId}/live`} className="hover:text-foreground">
            Live
          </Link>
          <Link
            href={`/auction/${auctionId}/players`}
            className="hover:text-foreground"
          >
            Players
          </Link>
          <Link href={`/auction/${auctionId}/teams`} className="hover:text-foreground">
            Teams
          </Link>
          <Link
            href={`/auction/${auctionId}/history`}
            className="hover:text-foreground"
          >
            History
          </Link>
          <Link
            href={`/auction/${auctionId}/results`}
            className="hover:text-foreground"
          >
            Results
          </Link>
          <AuctionLeaveButton />
        </div>
      </div>
      <AuctionRoomSync auctionId={auctionId} />
      {children}
    </div>
  );
}
