import { db } from '../connection'
import { choreTypes } from '../schema'
import { eq } from 'drizzle-orm'
import type { ChoreType, NewChoreType } from '../types'

export class ChoreTypeService {
  /**
   * Create a new chore type
   */
  static async create(choreTypeData: NewChoreType): Promise<ChoreType> {
    try {
      const [choreType] = await db.insert(choreTypes).values(choreTypeData).returning()
      return choreType
    } catch (error) {
      throw new Error(`Failed to create chore type: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find chore type by ID
   */
  static async findById(id: string): Promise<ChoreType | null> {
    try {
      const [choreType] = await db.select().from(choreTypes).where(eq(choreTypes.id, id)).limit(1)
      return choreType || null
    } catch (error) {
      throw new Error(`Failed to find chore type by ID: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find chore type by name
   */
  static async findByName(name: string): Promise<ChoreType | null> {
    try {
      const [choreType] = await db.select().from(choreTypes).where(eq(choreTypes.name, name)).limit(1)
      return choreType || null
    } catch (error) {
      throw new Error(`Failed to find chore type by name: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all active chore types
   */
  static async findAllActive(): Promise<ChoreType[]> {
    try {
      return await db.select()
        .from(choreTypes)
        .where(eq(choreTypes.isActive, true))
        .orderBy(choreTypes.name)
    } catch (error) {
      throw new Error(`Failed to get active chore types: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all chore types (active and inactive)
   */
  static async findAll(): Promise<ChoreType[]> {
    try {
      return await db.select()
        .from(choreTypes)
        .orderBy(choreTypes.name)
    } catch (error) {
      throw new Error(`Failed to get all chore types: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update chore type
   */
  static async update(id: string, updates: Partial<Omit<ChoreType, 'id' | 'createdAt'>>): Promise<ChoreType> {
    try {
      const [choreType] = await db
        .update(choreTypes)
        .set(updates)
        .where(eq(choreTypes.id, id))
        .returning()
      
      if (!choreType) {
        throw new Error('Chore type not found')
      }
      
      return choreType
    } catch (error) {
      throw new Error(`Failed to update chore type: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Deactivate chore type (soft delete)
   */
  static async deactivate(id: string): Promise<ChoreType> {
    try {
      return await this.update(id, { isActive: false })
    } catch (error) {
      throw new Error(`Failed to deactivate chore type: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Activate chore type
   */
  static async activate(id: string): Promise<ChoreType> {
    try {
      return await this.update(id, { isActive: true })
    } catch (error) {
      throw new Error(`Failed to activate chore type: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete chore type (hard delete)
   */
  static async delete(id: string): Promise<void> {
    try {
      const result = await db.delete(choreTypes).where(eq(choreTypes.id, id))
      if (result.changes === 0) {
        throw new Error('Chore type not found')
      }
    } catch (error) {
      throw new Error(`Failed to delete chore type: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}