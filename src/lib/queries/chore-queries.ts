import { db } from '@/lib/db/connection'
import { users, choreTypes, choreEntries } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import type { User, ChoreType, ChoreCompletion, ChoreData } from '@/types/chore'
import { USER_COLORS } from '@/constants/chore'

export async function getUsers(): Promise<User[]> {
  const dbUsers = await db.select().from(users).orderBy(users.name)

  return dbUsers.map((user, index) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture || undefined,
    color: USER_COLORS[index % USER_COLORS.length],
  }))
}

export async function getChoreTypes(): Promise<ChoreType[]> {
  const dbChoreTypes = await db
    .select()
    .from(choreTypes)
    .where(eq(choreTypes.isActive, true))
    .orderBy(choreTypes.name)

  return dbChoreTypes.map(choreType => ({
    id: choreType.id,
    name: choreType.name,
    description: choreType.description || undefined,
    isActive: choreType.isActive ?? true,
  }))
}

export async function getChoreCompletions(
  startDate: Date,
  endDate: Date
): Promise<ChoreCompletion[]> {
  const completions = await db
    .select({
      id: choreEntries.id,
      userId: choreEntries.userId,
      choreTypeId: choreEntries.choreTypeId,
      completionPercentage: choreEntries.completionPercentage,
      comments: choreEntries.comments,
      completedAt: choreEntries.completedAt,
    })
    .from(choreEntries)
    .where(
      and(
        gte(choreEntries.completedAt, startDate),
        lte(choreEntries.completedAt, endDate)
      )
    )
    .orderBy(desc(choreEntries.completedAt))

  return completions.map(completion => ({
    id: completion.id,
    userId: completion.userId,
    choreTypeId: completion.choreTypeId,
    completionPercentage: completion.completionPercentage,
    comments: completion.comments || undefined,
    completedAt: completion.completedAt,
    time: completion.completedAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }))
}

export async function getChoreDataForTimeline(
  startDate: Date,
  visibleDays: number,
  choreTypesList: ChoreType[]
): Promise<Record<string, ChoreData[]>> {
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + visibleDays - 1)

  // Optimized query: Group by date and chore type in SQL
  const completions = await db
    .select({
      id: choreEntries.id,
      userId: choreEntries.userId,
      choreTypeId: choreEntries.choreTypeId,
      completionPercentage: choreEntries.completionPercentage,
      comments: choreEntries.comments,
      completedAt: choreEntries.completedAt,
      // Add computed date field for efficient grouping
      completionDate: choreEntries.completedAt,
    })
    .from(choreEntries)
    .where(
      and(
        gte(choreEntries.completedAt, startDate),
        lte(choreEntries.completedAt, endDate)
      )
    )
    .orderBy(choreEntries.completedAt)

  // Group completions by date and chore type efficiently
  const completionsByDateAndType = new Map<string, Map<string, ChoreCompletion[]>>()

  completions.forEach(completion => {
    const dateStr = completion.completedAt.toISOString().split('T')[0]
    const choreCompletion: ChoreCompletion = {
      id: completion.id,
      userId: completion.userId,
      choreTypeId: completion.choreTypeId,
      completionPercentage: completion.completionPercentage,
      comments: completion.comments || undefined,
      completedAt: completion.completedAt,
      time: completion.completedAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }

    if (!completionsByDateAndType.has(dateStr)) {
      completionsByDateAndType.set(dateStr, new Map())
    }

    const dateMap = completionsByDateAndType.get(dateStr)!
    if (!dateMap.has(completion.choreTypeId)) {
      dateMap.set(completion.choreTypeId, [])
    }

    dateMap.get(completion.choreTypeId)!.push(choreCompletion)
  })

  // Build result structure efficiently
  const choreData: Record<string, ChoreData[]> = {}

  choreTypesList.forEach(choreType => {
    choreData[choreType.name] = []

    for (let i = 0; i < visibleDays; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]

      // Get completions for this date and chore type
      const dayCompletions = completionsByDateAndType
        .get(dateStr)
        ?.get(choreType.id) || []

      choreData[choreType.name].push({
        date: dateStr,
        completions: dayCompletions,
      })
    }
  })

  return choreData
}