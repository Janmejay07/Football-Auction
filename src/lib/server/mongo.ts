import { MongoClient, type Db } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  __FA_MONGO?: {
    client: MongoClient;
    db: Db;
    ready: Promise<void>;
  };
};

function mongoUri() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || uri.includes("USERNAME:PASSWORD") || uri.includes("<user>")) {
    throw new Error(
      "Set MONGODB_URI in .env to your MongoDB Atlas connection string"
    );
  }
  return uri;
}

function dbName() {
  return process.env.MONGODB_DB?.trim() || "football-auction";
}

async function connect() {
  if (globalForMongo.__FA_MONGO) {
    await globalForMongo.__FA_MONGO.ready;
    return globalForMongo.__FA_MONGO;
  }

  const client = new MongoClient(mongoUri(), {
    serverSelectionTimeoutMS: 12_000,
  });
  const ready = client.connect().then(async () => {
    const db = client.db(dbName());
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("users").createIndex({ username: 1 }, { unique: true }),
      db.collection("rooms").createIndex({ "auction.roomCode": 1 }, { unique: true }),
    ]);
  });

  const db = client.db(dbName());
  globalForMongo.__FA_MONGO = { client, db, ready };
  await ready;
  return globalForMongo.__FA_MONGO;
}

export async function getDb(): Promise<Db> {
  const conn = await connect();
  return conn.db;
}
