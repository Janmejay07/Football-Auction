/**
 * Database utilities export
 * Use these imports throughout the app:
 *
 * import { connectToDatabase, getDatabase } from "@/lib/db";
 * import { initializeDatabase } from "@/lib/db";
 * import type { AuctionDocument, TeamDocument, ... } from "@/lib/db";
 */

export { connectToDatabase, getDatabase, closeDatabase } from "./mongodb";
export { initializeDatabase, dropAllCollections, getDatabaseStats, getCollectionStats } from "./init";
export type {
  AuctionDocument,
  PlayerBucketDocument,
  AuctionRulesDocument,
  TeamDocument,
  PlayerDocument,
  BidDocument,
  UserDocument,
  AuctionHistoryDocument,
  ChatMessageDocument,
} from "./schemas";
