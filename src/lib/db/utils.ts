import { db, isDatabaseConnected, checkDatabaseHealth } from './connection'
import { initializeDatabase, needsInitialization } from './migrate'

/**
 * Database error types
 */
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Custom database error class
 */
export class DatabaseError extends Error {
  public readonly type: DatabaseErrorType
  public readonly originalError?: Error

  constructor(message: string, type: DatabaseErrorType, originalError?: Error) {
    super(message)
    this.name = 'DatabaseError'
    this.type = type
    this.originalError = originalError
  }
}

/**
 * Parse SQLite error and return appropriate DatabaseError
 */
export function parseDatabaseError(error: unknown): DatabaseError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('unique constraint failed')) {
      return new DatabaseError(
        'A record with this information already exists',
        DatabaseErrorType.CONSTRAINT_VIOLATION,
        error
      )
    }
    
    if (message.includes('foreign key constraint failed')) {
      return new DatabaseError(
        'Referenced record does not exist',
        DatabaseErrorType.CONSTRAINT_VIOLATION,
        error
      )
    }
    
    if (message.includes('not found')) {
      return new DatabaseError(
        'Record not found',
        DatabaseErrorType.NOT_FOUND,
        error
      )
    }
    
    if (message.includes('database is locked') || message.includes('database disk image is malformed')) {
      return new DatabaseError(
        'Database connection error',
        DatabaseErrorType.CONNECTION_ERROR,
        error
      )
    }
  }
  
  return new DatabaseError(
    'An unknown database error occurred',
    DatabaseErrorType.UNKNOWN_ERROR,
    error instanceof Error ? error : undefined
  )
}

/**
 * Execute database operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const dbError = parseDatabaseError(error)
    if (context) {
      dbError.message = `${context}: ${dbError.message}`
    }
    throw dbError
  }
}

/**
 * Initialize database if needed
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  try {
    const health = checkDatabaseHealth()
    if (!health.connected) {
      throw new DatabaseError(
        `Database connection failed: ${health.error}`,
        DatabaseErrorType.CONNECTION_ERROR
      )
    }

    if (await needsInitialization()) {
      await initializeDatabase()
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw parseDatabaseError(error)
  }
}

/**
 * Transaction wrapper with error handling
 */
export async function withTransaction<T>(
  operation: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return await withErrorHandling(async () => {
    return await db.transaction(async (tx) => {
      return await operation(tx)
    })
  }, 'Transaction failed')
}

/**
 * Validate database connection and throw error if not connected
 */
export function validateConnection(): void {
  if (!isDatabaseConnected()) {
    throw new DatabaseError(
      'Database is not connected',
      DatabaseErrorType.CONNECTION_ERROR
    )
  }
}

/**
 * Generate unique ID for database records
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`
}

/**
 * Validate completion percentage
 */
export function validateCompletionPercentage(percentage: number): boolean {
  return percentage >= 0 && percentage <= 1
}

/**
 * Convert percentage from display format (0-100) to database format (0-1)
 */
export function normalizePercentage(displayPercentage: number): number {
  return displayPercentage / 100
}

/**
 * Convert percentage from database format (0-1) to display format (0-100)
 */
export function denormalizePercentage(dbPercentage: number): number {
  return Math.round(dbPercentage * 100)
}

/**
 * Sanitize user input for database storage
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

/**
 * Format date for database storage
 */
export function formatDateForDb(date: Date): Date {
  // Ensure we're working with a proper Date object
  return new Date(date.getTime())
}

/**
 * Get date range for queries
 */
export function getDateRange(days: number): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)
  
  return {
    startDate: formatDateForDb(startDate),
    endDate: formatDateForDb(endDate)
  }
}

/**
 * Database health check with detailed information
 */
export async function performHealthCheck(): Promise<{
  connected: boolean
  initialized: boolean
  error?: string
  details?: Record<string, unknown>
}> {
  try {
    const health = checkDatabaseHealth()
    if (!health.connected) {
      return {
        connected: false,
        initialized: false,
        error: health.error
      }
    }

    const initialized = !(await needsInitialization())
    
    return {
      connected: true,
      initialized,
      details: {
        databasePath: process.env.DATABASE_URL || './data/chore-system.db',
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      connected: false,
      initialized: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}