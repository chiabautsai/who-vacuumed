import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || './data/chore-system.db'

// Lazy database connection
let _sqlite: Database.Database | null = null
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function initializeConnection() {
  if (!_sqlite) {
    // Ensure the directory exists
    mkdirSync(dirname(DATABASE_URL), { recursive: true })
    
    // Create SQLite database instance
    _sqlite = new Database(DATABASE_URL)
    
    // Enable WAL mode for better concurrent access
    _sqlite.pragma('journal_mode = WAL')
    
    // Create Drizzle database instance with schema
    _db = drizzle(_sqlite, { schema })
  }
  return { sqlite: _sqlite, db: _db! }
}

// Lazy getters with proper typing
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(target, prop: string | symbol) {
    const { db } = initializeConnection()
    return Reflect.get(db, prop)
  }
})

export const sqlite = new Proxy({} as Database.Database, {
  get(target, prop: string | symbol) {
    const { sqlite } = initializeConnection()
    return Reflect.get(sqlite, prop)
  }
})

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