import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || './data/chore-system.db'

// Create SQLite database instance
const sqlite = new Database(DATABASE_URL)

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL')

// Create Drizzle database instance with schema
export const db = drizzle(sqlite, { schema })

// Export the raw SQLite instance for migrations if needed
export { sqlite }

// Database connection utilities
export function closeDatabase() {
  sqlite.close()
}

export function isDatabaseConnected(): boolean {
  try {
    sqlite.prepare('SELECT 1').get()
    return true
  } catch {
    return false
  }
}

// Health check function
export function checkDatabaseHealth(): { connected: boolean; error?: string } {
  try {
    sqlite.prepare('SELECT 1').get()
    return { connected: true }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}