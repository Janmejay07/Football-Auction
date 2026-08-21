# MongoDB Database Setup

This directory contains all MongoDB connection utilities and schema definitions for the Football Auction application.

## 📁 File Structure

```
src/lib/db/
├── index.ts           # Main exports (use this for imports)
├── mongodb.ts         # Connection utility & connection pooling
├── schemas.ts         # TypeScript interfaces for all collections
├── init.ts            # Database initialization & index creation
└── README.md          # This file
```

## 🚀 Quick Start

### 1. Connection is Already Initialized
The database connection is automatically initialized when your app starts. No manual setup needed!

### 2. Use Database in Your Code

```typescript
// Import utilities
import { getDatabase } from "@/lib/db";

// Use in an API route or service
export async function getAuctions() {
  const db = await getDatabase();
  const auctions = await db.collection("auctions").find({}).toArray();
  return auctions;
}
```

### 3. Use TypeScript Types

```typescript
import type { AuctionDocument, TeamDocument } from "@/lib/db";

const db = await getDatabase();
const auction = await db
  .collection<AuctionDocument>("auctions")
  .findOne({ roomCode: "ABC123" });
```

## 📚 Available Functions

### Connection Management

```typescript
// Get database instance (cached connection)
const db = await getDatabase();

// Manually connect (usually not needed)
const { client, db } = await connectToDatabase();

// Close connection (on app shutdown)
await closeDatabase();
```

### Database Operations

```typescript
// Initialize collections and indexes
await initializeDatabase();

// Get database statistics
const stats = await getDatabaseStats();

// Get collection statistics
const collStats = await getCollectionStats("auctions");

// Drop all collections (development only!)
await dropAllCollections();
```

## 📝 Collections

### `auctions`
Stores auction sessions and configurations.

```typescript
{
  _id: ObjectId
  roomCode: string          // Unique, indexed
  name: string
  status: "waiting" | "live" | "completed"
  hostId: string
  teamCount: number
  startingBudget: number
  participantIds: string[]
  teamIds: string[]
  createdAt: Date
  ...
}
```

### `teams`
Stores team information for each auction.

```typescript
{
  _id: ObjectId
  auctionId: string         // Indexed
  name: string
  budget: number
  spent: number
  squad: string[]           // Player IDs
  managerId?: string        // Indexed
  isAvailable: boolean
  ...
}
```

### `players`
Stores all available players.

```typescript
{
  _id: ObjectId
  id: string                // Unique, indexed
  name: string
  position: string
  club: string              // Indexed
  marketValue: number
  basePrice: number
  stats: { goals, assists, ... }
  bucket: "goalkeepers" | "defenders" | ...
  ...
}
```

### `bids`
Stores all bids placed during auctions.

```typescript
{
  _id: ObjectId
  auctionId: string         // Indexed
  playerId: string
  teamId: string
  userId: string
  amount: number
  timestamp: Date
  ...
}
```

### `users`
Stores user account information.

```typescript
{
  _id: ObjectId
  id: string                // Unique, indexed
  email: string             // Unique, indexed
  fullName: string
  avatar?: string
  role: "user" | "admin"
  ...
}
```

### `auction_history`
Stores completed auction history and results.

```typescript
{
  _id: ObjectId
  auctionId: string
  playerId: string
  status: "sold" | "unsold"
  winnerTeamId?: string
  finalPrice?: number
  ...
}
```

### `chat_messages`
Stores auction chat messages.

```typescript
{
  _id: ObjectId
  auctionId: string
  type: "normal" | "system" | "bid"
  senderId?: string
  content: string
  timestamp: Date
}
```

## 🔑 Indexes

All collections have indexes for optimal query performance:

- **auctions**: roomCode (unique), hostId, status, createdAt
- **teams**: auctionId, managerId, isAvailable
- **players**: id (unique), club, bucket, name (text search)
- **bids**: auctionId, playerId, teamId, timestamp
- **users**: id (unique), email (unique), username (unique)
- **auction_history**: auctionId, timestamp
- **chat_messages**: auctionId, timestamp

## 💻 Example: Using in an API Route

```typescript
// src/app/api/auctions/route.ts
import { getDatabase } from "@/lib/db";
import type { AuctionDocument } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDatabase();
    
    const auctions = await db
      .collection<AuctionDocument>("auctions")
      .find({ status: "live" })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json(auctions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}
```

## 💾 Example: Inserting Data

```typescript
import { getDatabase } from "@/lib/db";
import type { AuctionDocument } from "@/lib/db";

const db = await getDatabase();

const newAuction: Omit<AuctionDocument, "_id"> = {
  roomCode: "ABC123",
  name: "Champions League",
  status: "waiting",
  hostId: "user-1",
  teamCount: 8,
  // ... rest of fields
  createdAt: new Date(),
};

const result = await db
  .collection<AuctionDocument>("auctions")
  .insertOne(newAuction);

console.log("Inserted auction with ID:", result.insertedId);
```

## 🔍 Example: Querying Data

```typescript
import { getDatabase } from "@/lib/db";

const db = await getDatabase();

// Find auction by room code
const auction = await db
  .collection("auctions")
  .findOne({ roomCode: "ABC123" });

// Find all teams in an auction
const teams = await db
  .collection("teams")
  .find({ auctionId: auction._id.toString() })
  .toArray();

// Count available teams
const availableCount = await db
  .collection("teams")
  .countDocuments({ auctionId: auction._id.toString(), isAvailable: true });
```

## ⚙️ Connection Pooling

The connection utility uses MongoDB's built-in connection pooling:

- **Min Pool Size**: 2 connections
- **Max Pool Size**: 10 connections
- **Max Idle Time**: 45 seconds

These settings are optimized for a Next.js serverless environment.

## 🔒 Environment Variables

Required in `.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=football-auction
```

## 🐛 Troubleshooting

### Connection Failed
- Check MONGODB_URI is correct in .env
- Verify IP whitelist in MongoDB Atlas
- Ensure credentials are valid

### Collections Not Created
- Call `GET /api/db/init` manually to initialize
- Check MongoDB user has collection creation permissions

### Performance Issues
- Check indexes are created: `await getCollectionStats("collectionName")`
- Use `.explain()` to analyze queries
- Consider adding more indexes if needed

## 📖 More Information

- [MongoDB Node.js Driver Docs](https://www.mongodb.com/docs/drivers/node/)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
