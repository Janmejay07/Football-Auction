import type { Metadata } from "next";
import "./globals.css";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ConfirmModalHost } from "@/components/providers/ConfirmModalHost";
import { DatabaseInitializer } from "@/components/providers/DatabaseInitializer";

export const metadata: Metadata = {
  title: "Football Auction — Live Player Auctions",
  description:
    "Create private football player auctions with friends. Bid live, build squads, and feel the stadium.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full stadium-bg antialiased font-sans">
        <AuthGuard>
          <DatabaseInitializer />
          {children}
          <ToastProvider />
          <ConfirmModalHost />
        </AuthGuard>
      </body>
    </html>
  );
}
