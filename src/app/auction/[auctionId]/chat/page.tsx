"use client";

import { useParams } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function AuctionChatPage() {
  const params = useParams<{ auctionId: string }>();
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display mb-4 text-4xl">Auction Chat</h1>
      <div className="h-[70vh]">
        <ChatPanel auctionId={params.auctionId} className="h-full" />
      </div>
    </div>
  );
}
