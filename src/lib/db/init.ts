import type { Document } from "mongodb";
import { getDatabase } from "./mongodb";

/**
 * Initialize MongoDB collections and indexes
 * Call this once on app startup
 */
export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  try {
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // AUCTIONS collection
    if (!collectionNames.includes("auctions")) {
      await db.createCollection("auctions");
      console.log("✅ Created 'auctions' collection");
    }

    // TEAMS collection
    if (!collectionNames.includes("teams")) {
      await db.createCollection("teams");
      console.log("✅ Created 'teams' collection");
    }

    // PLAYERS collection
    if (!collectionNames.includes("players")) {
      await db.createCollection("players");
      console.log("✅ Created 'players' collection");
    }

    // BIDS collection
    if (!collectionNames.includes("bids")) {
      await db.createCollection("bids");
      console.log("✅ Created 'bids' collection");
    }

    // USERS collection
    if (!collectionNames.includes("users")) {
      await db.createCollection("users");
      console.log("✅ Created 'users' collection");
    }

    // AUCTION_HISTORY collection
    if (!collectionNames.includes("auction_history")) {
      await db.createCollection("auction_history");
      console.log("✅ Created 'auction_history' collection");
    }

    // CHAT_MESSAGES collection
    if (!collectionNames.includes("chat_messages")) {
      await db.createCollection("chat_messages");
      console.log("✅ Created 'chat_messages' collection");
    }

    // Create indexes for performance
    await createIndexes();

    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

/**
 * Create indexes for optimal query performance
 */
async function createIndexes(): Promise<void> {
  const db = await getDatabase();

  try {
    // AUCTIONS indexes
    await db.collection("auctions").createIndex({ roomCode: 1 }, { unique: true });
    await db.collection("auctions").createIndex({ hostId: 1 });
    await db.collection("auctions").createIndex({ status: 1 });
    await db.collection("auctions").createIndex({ createdAt: -1 });

    // TEAMS indexes
    await db.collection("teams").createIndex({ auctionId: 1 });
    await db.collection("teams").createIndex({ managerId: 1 });
    await db.collection("teams").createIndex({ isAvailable: 1 });

    // PLAYERS indexes
    await db.collection("players").createIndex({ id: 1 }, { unique: true });
    await db.collection("players").createIndex({ club: 1 });
    await db.collection("players").createIndex({ bucket: 1 });
    await db.collection("players").createIndex({ name: "text" }); // Full-text search

    // BIDS indexes
    await db.collection("bids").createIndex({ auctionId: 1 });
    await db.collection("bids").createIndex({ playerId: 1 });
    await db.collection("bids").createIndex({ teamId: 1 });
    await db.collection("bids").createIndex({ timestamp: -1 });

    // USERS indexes
    await db.collection("users").createIndex({ id: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { sparse: true, unique: true });

    // AUCTION_HISTORY indexes
    await db.collection("auction_history").createIndex({ auctionId: 1 });
    await db.collection("auction_history").createIndex({ timestamp: -1 });

    // CHAT_MESSAGES indexes
    await db.collection("chat_messages").createIndex({ auctionId: 1 });
    await db.collection("chat_messages").createIndex({ timestamp: -1 });

    console.log("✅ Database indexes created");
  } catch (error) {
    // Indexes may already exist, so we don't throw
    console.log("ℹ️ Index creation note:", error instanceof Error ? error.message : error);
  }
}

/**
 * Drop all collections (for development/testing only)
 */
export async function dropAllCollections(): Promise<void> {
  const db = await getDatabase();

  try {
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`✅ Dropped collection: ${collection.name}`);
    }

    console.log("✅ All collections dropped");
  } catch (error) {
    console.error("❌ Error dropping collections:", error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<Document> {
  const db = await getDatabase();

  try {
    const stats = await db.stats();
    return stats;
  } catch (error) {
    console.error("❌ Error getting database stats:", error);
    throw error;
  }
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(collectionName: string): Promise<Document> {
  const db = await getDatabase();

  try {
    const stats = await db.command({ collStats: collectionName });
    return stats;
  } catch (error) {
    console.error(`❌ Error getting stats for ${collectionName}:`, error);
    throw error;
  }
}
