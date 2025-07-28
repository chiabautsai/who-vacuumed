import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './connection'
import { choreTypes } from './schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// Default chore types as specified in requirements
const DEFAULT_CHORE_TYPES = [
    {
        name: 'Vacuum',
        description: 'Vacuum carpets and rugs',
        isActive: true,
        createdAt: new Date()
    },
    {
        name: 'Laundry',
        description: 'Wash, dry, and fold laundry',
        isActive: true,
        createdAt: new Date()
    },
    {
        name: 'Dishes',
        description: 'Wash dishes and put them away',
        isActive: true,
        createdAt: new Date()
    }
]

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
    try {
        migrate(db, { migrationsFolder: './drizzle' })
    } catch (error) {
        console.error('Failed to run database migrations:', error)
        throw error
    }
}

/**
 * Seed default chore types if they don't exist
 */
export async function seedChoreTypes(): Promise<void> {
    try {
        for (const choreType of DEFAULT_CHORE_TYPES) {
            try {
                // Check if chore type already exists by name
                const existing = await db.select()
                    .from(choreTypes)
                    .where(eq(choreTypes.name, choreType.name))
                    .limit(1)

                if (existing.length === 0) {
                    // Add ID and insert the chore type
                    await db.insert(choreTypes).values({
                        id: randomUUID(),
                        ...choreType
                    })
                    console.log(`Seeded chore type: ${choreType.name}`)
                }
            } catch (error) {
                // If it's a unique constraint error, the chore type already exists
                if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
                    console.log(`Chore type already exists: ${choreType.name}`)
                    continue
                }
                throw error
            }
        }
    } catch (error) {
        console.error('Failed to seed chore types:', error)
        throw error
    }
}

/**
 * Initialize database - run migrations and seed data
 */
export async function initializeDatabase(): Promise<void> {
    try {
        await runMigrations()
        await seedChoreTypes()
    } catch (error) {
        console.error('Database initialization failed:', error)
        throw error
    }
}

/**
 * Check if database needs initialization
 */
export async function needsInitialization(): Promise<boolean> {
    try {
        // Check if chore_types table has any data
        const choreTypeCount = await db.select().from(choreTypes).limit(1)
        return choreTypeCount.length === 0
    } catch {
        // If we can't query the table, it probably doesn't exist
        return true
    }
}