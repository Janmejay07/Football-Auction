"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ChatPanel({
  auctionId,
  className,
  compact,
}: {
  auctionId: string;
  className?: string;
  compact?: boolean;
}) {
  const { messages, sendMessage } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    await sendMessage({
      auctionId,
      content: text.trim(),
      senderId: user.id,
      senderName: user.fullName,
    });
    setText("");
  };

  return (
    <div className={cn("flex h-full flex-col glass-panel rounded-xl overflow-hidden", className)}>
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="font-display text-lg tracking-wide">Chat</h3>
      </div>
      <div
        className={cn(
          "flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin",
          compact ? "max-h-64" : "min-h-[240px]"
        )}
      >
        <AnimatePresence initial={false}>
          {messages
            .filter((msg) => msg.auctionId === auctionId)
            .map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-sm",
                msg.type === "system" && "text-center text-[var(--muted)] italic",
                msg.type === "bid" && "rounded-lg bg-[var(--accent-dim)] px-3 py-2 text-[var(--accent)]"
              )}
            >
              {msg.type === "normal" && (
                <>
                  <span className="font-semibold text-[var(--accent)]">{msg.senderName}: </span>
                  <span>{msg.content}</span>
                </>
              )}
              {msg.type !== "normal" && <span>{msg.content}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          aria-label="Chat message"
        />
        <Button type="submit" size="icon" aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
