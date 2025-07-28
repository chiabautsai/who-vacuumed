import { db } from '../connection'
import { choreEntries, users } from '../schema'
import { eq, and, gte, lte, desc, asc, sql, count } from 'drizzle-orm'
import { DatabaseErrorHandler } from '@/lib/utils/server-error-utils'
import type { ChoreEntry, NewChoreEntry, ChoreEntryWithRelations, TimelineData, DailyCompletion, CompletionDetail, WeeklyStats, UserContribution } from '../types'

export class ChoreEntryService {
  /**
   * Create a new chore entry with enhanced error handling
   */
  static async create(entryData: NewChoreEntry): Promise<ChoreEntry> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      const [entry] = await db.insert(choreEntries).values(entryData).returning()
      if (!entry) {
        throw new Error('Failed to create chore entry - no data returned')
      }
      return entry
    }, 'create-chore-entry')
  }

  /**
   * Find chore entry by ID with relations and enhanced error handling
   */
  static async findById(id: string): Promise<ChoreEntryWithRelations | null> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid chore entry ID provided')
      }
      
      const [entry] = await db.query.choreEntries.findMany({
        where: eq(choreEntries.id, id),
        with: {
          user: true,
          choreType: true
        },
        limit: 1
      })
      return entry || null
    }, 'find-chore-entry-by-id')
  }

  /**
   * Get timeline data for a date range with enhanced error handling
   */
  static async getTimelineData(startDate: Date, endDate: Date): Promise<TimelineData> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      // Validate date parameters
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date parameters provided')
      }
      
      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date')
      }

      // Get all chore entries in the date range with relations
      const entries = await db.query.choreEntries.findMany({
        where: and(
          gte(choreEntries.completedAt, startDate),
          lte(choreEntries.completedAt, endDate)
        ),
        with: {
          user: true,
          choreType: true
        },
        orderBy: [asc(choreEntries.completedAt)]
      })

      // Group entries by date and chore type
      const dailyCompletions: DailyCompletion[] = []
      const dateMap = new Map<string, Map<string, CompletionDetail[]>>()

      entries.forEach(entry => {
        const dateKey = entry.completedAt.toISOString().split('T')[0]
        const choreTypeKey = entry.choreType.name

        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, new Map())
        }

        const dayMap = dateMap.get(dateKey)!
        if (!dayMap.has(choreTypeKey)) {
          dayMap.set(choreTypeKey, [])
        }

        dayMap.get(choreTypeKey)!.push({
          id: entry.id,
          userId: entry.userId,
          userName: entry.user.name,
          completionPercentage: entry.completionPercentage,
          comments: entry.comments || undefined,
          completedAt: entry.completedAt
        })
      })

      // Convert map to array format
      for (const [dateStr, choreMap] of dateMap.entries()) {
        for (const [choreType, completions] of choreMap.entries()) {
          dailyCompletions.push({
            date: new Date(dateStr),
            choreType,
            completions
          })
        }
      }

      return {
        startDate,
        endDate,
        choreEntries: entries,
        dailyCompletions
      }
    }, 'get-timeline-data')
  }

  /**
   * Get recent chore entries with relations and enhanced error handling
   */
  static async getRecentEntries(limit: number = 20): Promise<ChoreEntryWithRelations[]> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      if (limit <= 0 || limit > 100) {
        throw new Error('Limit must be between 1 and 100')
      }
      
      return await db.query.choreEntries.findMany({
        with: {
          user: true,
          choreType: true
        },
        orderBy: [desc(choreEntries.completedAt)],
        limit
      })
    }, 'get-recent-entries')
  }

  /**
   * Get entries for a specific user with enhanced error handling
   */
  static async getEntriesByUser(userId: string, limit?: number): Promise<ChoreEntryWithRelations[]> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID provided')
      }
      
      if (limit !== undefined && (limit <= 0 || limit > 100)) {
        throw new Error('Limit must be between 1 and 100')
      }
      
      return await db.query.choreEntries.findMany({
        where: eq(choreEntries.userId, userId),
        with: {
          user: true,
          choreType: true
        },
        orderBy: [desc(choreEntries.completedAt)],
        limit
      })
    }, 'get-entries-by-user')
  }

  /**
   * Get entries for a specific chore type with enhanced error handling
   */
  static async getEntriesByChoreType(choreTypeId: string, limit?: number): Promise<ChoreEntryWithRelations[]> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      if (!choreTypeId || typeof choreTypeId !== 'string') {
        throw new Error('Invalid chore type ID provided')
      }
      
      if (limit !== undefined && (limit <= 0 || limit > 100)) {
        throw new Error('Limit must be between 1 and 100')
      }
      
      return await db.query.choreEntries.findMany({
        where: eq(choreEntries.choreTypeId, choreTypeId),
        with: {
          user: true,
          choreType: true
        },
        orderBy: [desc(choreEntries.completedAt)],
        limit
      })
    }, 'get-entries-by-chore-type')
  }

  /**
   * Get weekly statistics with enhanced error handling
   */
  static async getWeeklyStats(startDate: Date, endDate: Date): Promise<WeeklyStats> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      // Validate date parameters
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date parameters provided')
      }
      
      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date')
      }

      // Get total chores count
      const totalChoresResult = await db
        .select({ count: count() })
        .from(choreEntries)
        .where(and(
          gte(choreEntries.completedAt, startDate),
          lte(choreEntries.completedAt, endDate)
        ))

      const totalChores = totalChoresResult[0]?.count || 0

      // Get user contributions
      const userContributionsResult = await db
        .select({
          userId: choreEntries.userId,
          userName: users.name,
          choreCount: count()
        })
        .from(choreEntries)
        .innerJoin(users, eq(choreEntries.userId, users.id))
        .where(and(
          gte(choreEntries.completedAt, startDate),
          lte(choreEntries.completedAt, endDate)
        ))
        .groupBy(choreEntries.userId, users.name)
        .orderBy(desc(count()))

      const userContributions: UserContribution[] = userContributionsResult.map(result => ({
        userId: result.userId,
        userName: result.userName,
        choreCount: result.choreCount,
        percentage: totalChores > 0 ? (result.choreCount / totalChores) * 100 : 0
      }))

      // Calculate completion rate (assuming 100% completion for now)
      const completionRate = 100

      // Calculate week-over-week change (placeholder for now)
      const weekOverWeekChange = 0

      return {
        totalChores,
        userContributions,
        completionRate,
        weekOverWeekChange
      }
    }, 'get-weekly-stats')
  }

  /**
   * Update chore entry with enhanced error handling
   */
  static async update(id: string, updates: Partial<Omit<ChoreEntry, 'id' | 'createdAt'>>): Promise<ChoreEntry> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid chore entry ID provided')
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('No updates provided')
      }
      
      const [entry] = await db
        .update(choreEntries)
        .set(updates)
        .where(eq(choreEntries.id, id))
        .returning()
      
      if (!entry) {
        throw new Error('Chore entry not found')
      }
      
      return entry
    }, 'update-chore-entry')
  }

  /**
   * Delete chore entry with enhanced error handling
   */
  static async delete(id: string): Promise<void> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid chore entry ID provided')
      }
      
      const result = await db.delete(choreEntries).where(eq(choreEntries.id, id))
      if (result.changes === 0) {
        throw new Error('Chore entry not found')
      }
    }, 'delete-chore-entry')
  }

  /**
   * Get entries count by date range with enhanced error handling
   */
  static async getEntriesCount(startDate: Date, endDate: Date): Promise<number> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date parameters provided')
      }
      
      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date')
      }
      
      const result = await db
        .select({ count: count() })
        .from(choreEntries)
        .where(and(
          gte(choreEntries.completedAt, startDate),
          lte(choreEntries.completedAt, endDate)
        ))
      
      return result[0]?.count || 0
    }, 'get-entries-count')
  }

  /**
   * Get completion percentage average for a chore type with enhanced error handling
   */
  static async getAverageCompletion(choreTypeId: string, startDate?: Date, endDate?: Date): Promise<number> {
    return DatabaseErrorHandler.withErrorHandling(async () => {
      if (!choreTypeId || typeof choreTypeId !== 'string') {
        throw new Error('Invalid chore type ID provided')
      }
      
      if (startDate && endDate) {
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date parameters provided')
        }
        
        if (startDate > endDate) {
          throw new Error('Start date cannot be after end date')
        }
      }
      
      const whereConditions = [eq(choreEntries.choreTypeId, choreTypeId)]

      if (startDate && endDate) {
        whereConditions.push(
          gte(choreEntries.completedAt, startDate),
          lte(choreEntries.completedAt, endDate)
        )
      }

      const result = await db
        .select({ avg: sql<number>`AVG(${choreEntries.completionPercentage})` })
        .from(choreEntries)
        .where(and(...whereConditions))

      return result[0]?.avg || 0
    }, 'get-average-completion')
  }
}