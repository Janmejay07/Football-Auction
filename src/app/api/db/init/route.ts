import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/init";
import { getDatabase } from "@/lib/db/mongodb";

/**
 * API route to initialize the database
 * GET /api/db/init
 *
 * Call this once when your app starts to set up collections and indexes
 */
export async function GET() {
  try {
    // Initialize database (create collections and indexes)
    await initializeDatabase();

    // Get database stats
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();

    return NextResponse.json(
      {
        status: "success",
        message: "Database initialized successfully",
        collections: collections.map((c) => c.name),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed. Check the production MongoDB configuration.",
      },
      { status: 500 }
    );
  }
}
