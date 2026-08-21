"use client";

import { useEffect, useState } from "react";

/**
 * Database Initializer Component
 * Automatically initializes MongoDB collections and indexes on app startup
 */
export function DatabaseInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        const response = await fetch("/api/db/init");
        const data = await response.json();

        if (response.ok) {
          console.log("✅ Database initialized successfully");
          setInitialized(true);
        } else {
          console.error("❌ Database initialization failed:", data.message);
          setError(data.message);
        }
      } catch (err) {
        console.error("❌ Database initialization error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    initDb();
  }, []);

  if (error) {
    console.error("Database initialization error:", error);
    // Don't show error UI in production - just log it
    // In development, you might want to show a banner
  }

  return null; // This component doesn't render anything
}
