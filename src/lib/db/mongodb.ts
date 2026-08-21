import { MongoClient, Db } from "mongodb";

// Global MongoDB instance (cached connection)
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

if (!MONGODB_DB) {
  throw new Error("MONGODB_DB is not defined in environment variables");
}

const mongodbUri = MONGODB_URI;

/**
 * Connects to MongoDB and returns the database instance
 * Uses connection pooling and caching for performance
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    // Create new client connection
    const client = new MongoClient(mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 45000,
    });

    // Connect to MongoDB
    await client.connect();

    // Get database instance
    const db = client.db(MONGODB_DB);

    // Verify connection
    await db.admin().ping();

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    console.log("✅ Connected to MongoDB successfully");

    return { client, db };
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    throw error;
  }
}

/**
 * Get the cached database instance
 * Must call connectToDatabase() first
 */
export async function getDatabase(): Promise<Db> {
  if (!cachedDb) {
    const { db } = await connectToDatabase();
    return db;
  }
  return cachedDb;
}

/**
 * Close the MongoDB connection
 * Call this during graceful shutdown
 */
export async function closeDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log("✅ MongoDB connection closed");
  }
}

// Handle Node process termination
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (cachedClient) {
      cachedClient.close();
    }
  });
}
