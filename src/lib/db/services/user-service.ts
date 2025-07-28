import { db } from '../connection'
import { users } from '../schema'
import { eq } from 'drizzle-orm'
import type { User, NewUser } from '../types'

export class UserService {
  /**
   * Create a new user
   */
  static async create(userData: NewUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(userData).returning()
      return user
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
      return user || null
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find user by Auth0 ID
   */
  static async findByAuth0Id(auth0Id: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.auth0Id, auth0Id)).limit(1)
      return user || null
    } catch (error) {
      throw new Error(`Failed to find user by Auth0 ID: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      return user || null
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update user
   */
  static async update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }
      
      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning()
      
      if (!user) {
        throw new Error('User not found')
      }
      
      return user
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create or update user (upsert for Auth0 integration)
   */
  static async upsert(userData: NewUser): Promise<User> {
    try {
      // Try to find existing user by Auth0 ID
      const existingUser = await this.findByAuth0Id(userData.auth0Id)
      
      if (existingUser) {
        // Update existing user
        return await this.update(existingUser.id, {
          email: userData.email,
          name: userData.name,
          picture: userData.picture
        })
      } else {
        // Create new user
        return await this.create(userData)
      }
    } catch (error) {
      throw new Error(`Failed to upsert user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all users
   */
  static async findAll(): Promise<User[]> {
    try {
      return await db.select().from(users)
    } catch (error) {
      throw new Error(`Failed to get all users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete user
   */
  static async delete(id: string): Promise<void> {
    try {
      const result = await db.delete(users).where(eq(users.id, id))
      if (result.changes === 0) {
        throw new Error('User not found')
      }
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}