import { ChoreEntryService } from '../db/services/chore-entry-service'
import type { WeeklyStats, UserContribution, ChoreEntryWithRelations } from '../db/types'

export class AnalyticsService {
  /**
   * Get comprehensive weekly statistics with week-over-week comparison
   */
  static async getWeeklyStats(currentWeekStart: Date, currentWeekEnd: Date): Promise<WeeklyStats> {
    try {
      // Calculate previous week dates
      const previousWeekStart = new Date(currentWeekStart)
      previousWeekStart.setDate(previousWeekStart.getDate() - 7)
      const previousWeekEnd = new Date(currentWeekEnd)
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 7)

      // Get current week stats
      const currentWeekStats = await ChoreEntryService.getWeeklyStats(currentWeekStart, currentWeekEnd)
      
      // Get previous week stats for comparison
      const previousWeekStats = await ChoreEntryService.getWeeklyStats(previousWeekStart, previousWeekEnd)

      // Calculate week-over-week change
      const weekOverWeekChange = previousWeekStats.totalChores > 0 
        ? ((currentWeekStats.totalChores - previousWeekStats.totalChores) / previousWeekStats.totalChores) * 100
        : currentWeekStats.totalChores > 0 ? 100 : 0

      // Calculate completion rate based on actual completion percentages
      const currentWeekEntries = await ChoreEntryService.getTimelineData(currentWeekStart, currentWeekEnd)
      const completionRate = this.calculateCompletionRate(currentWeekEntries.choreEntries)

      return {
        totalChores: currentWeekStats.totalChores,
        userContributions: currentWeekStats.userContributions,
        completionRate,
        weekOverWeekChange: Math.round(weekOverWeekChange * 100) / 100 // Round to 2 decimal places
      }
    } catch (error) {
      throw new Error(`Failed to get weekly stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user contribution analysis with detailed metrics
   */
  static async getUserContributionAnalysis(startDate: Date, endDate: Date): Promise<{
    userContributions: UserContribution[]
    mostActiveUser: UserContribution | null
    totalChores: number
  }> {
    try {
      const weeklyStats = await ChoreEntryService.getWeeklyStats(startDate, endDate)
      
      // Sort by chore count to find most active user
      const sortedContributions = weeklyStats.userContributions.sort((a, b) => b.choreCount - a.choreCount)
      const mostActiveUser = sortedContributions.length > 0 ? sortedContributions[0] : null

      return {
        userContributions: weeklyStats.userContributions,
        mostActiveUser,
        totalChores: weeklyStats.totalChores
      }
    } catch (error) {
      throw new Error(`Failed to get user contribution analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get recent activity feed with detailed information
   */
  static async getRecentActivity(limit: number = 10): Promise<ChoreEntryWithRelations[]> {
    try {
      return await ChoreEntryService.getRecentEntries(limit)
    } catch (error) {
      throw new Error(`Failed to get recent activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate completion rate based on completion percentages
   */
  private static calculateCompletionRate(entries: ChoreEntryWithRelations[]): number {
    if (entries.length === 0) return 0

    const totalCompletionPercentage = entries.reduce((sum, entry) => sum + entry.completionPercentage, 0)
    const averageCompletion = totalCompletionPercentage / entries.length
    
    return Math.round(averageCompletion * 100)
  }

  /**
   * Get current week date range (Monday to Sunday)
   */
  static getCurrentWeekRange(): { start: Date; end: Date } {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 0, so adjust

    const start = new Date(now)
    start.setDate(now.getDate() - daysFromMonday)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  /**
   * Get previous week date range
   */
  static getPreviousWeekRange(): { start: Date; end: Date } {
    const currentWeek = this.getCurrentWeekRange()
    
    const start = new Date(currentWeek.start)
    start.setDate(start.getDate() - 7)
    
    const end = new Date(currentWeek.end)
    end.setDate(end.getDate() - 7)

    return { start, end }
  }

  /**
   * Format percentage change for display
   */
  static formatPercentageChange(change: number): string {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  /**
   * Get user-specific statistics for a date range
   */
  static async getUserStats(userId: string, startDate: Date, endDate: Date): Promise<{
    choreCount: number
    averageCompletion: number
    percentage: number
  }> {
    try {
      // Get user's entries for the period
      const userEntries = await ChoreEntryService.getEntriesByUser(userId)
      const periodEntries = userEntries.filter(entry => 
        entry.completedAt >= startDate && entry.completedAt <= endDate
      )

      // Get total chores for percentage calculation
      const totalChores = await ChoreEntryService.getEntriesCount(startDate, endDate)

      // Calculate average completion
      const averageCompletion = periodEntries.length > 0
        ? periodEntries.reduce((sum, entry) => sum + entry.completionPercentage, 0) / periodEntries.length
        : 0

      // Calculate percentage of total chores
      const percentage = totalChores > 0 ? (periodEntries.length / totalChores) * 100 : 0

      return {
        choreCount: periodEntries.length,
        averageCompletion: Math.round(averageCompletion * 100),
        percentage: Math.round(percentage * 100) / 100
      }
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get detailed user contribution analysis with performance metrics
   */
  static async getDetailedUserAnalysis(startDate: Date, endDate: Date): Promise<{
    userContributions: (UserContribution & {
      averageCompletion: number
      streak: number
      lastActivity: Date | null
    })[]
    mostActiveUser: UserContribution | null
    mostConsistentUser: (UserContribution & {
      averageCompletion: number
      streak: number
      lastActivity: Date | null
    }) | null
    totalChores: number
  }> {
    try {
      const basicAnalysis = await this.getUserContributionAnalysis(startDate, endDate)
      const timelineData = await ChoreEntryService.getTimelineData(startDate, endDate)

      // Enhance user contributions with additional metrics
      const enhancedContributions = await Promise.all(
        basicAnalysis.userContributions.map(async (contribution) => {
          const userEntries = timelineData.choreEntries.filter(entry => entry.userId === contribution.userId)
          
          // Calculate average completion percentage
          const averageCompletion = userEntries.length > 0
            ? userEntries.reduce((sum, entry) => sum + entry.completionPercentage, 0) / userEntries.length
            : 0

          // Calculate current streak (consecutive days with chores)
          const streak = this.calculateUserStreak(userEntries, endDate)

          // Get last activity date
          const lastActivity = userEntries.length > 0
            ? new Date(Math.max(...userEntries.map(entry => entry.completedAt.getTime())))
            : null

          return {
            ...contribution,
            averageCompletion: Math.round(averageCompletion * 100),
            streak,
            lastActivity
          }
        })
      )

      // Find most consistent user (highest average completion)
      const mostConsistentUser = enhancedContributions.length > 0 
        ? enhancedContributions.reduce((prev, current) => 
            (current.averageCompletion > prev.averageCompletion) ? current : prev
          )
        : null

      return {
        userContributions: enhancedContributions,
        mostActiveUser: basicAnalysis.mostActiveUser,
        mostConsistentUser,
        totalChores: basicAnalysis.totalChores
      }
    } catch (error) {
      throw new Error(`Failed to get detailed user analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate user's current streak of consecutive days with chore completions
   */
  private static calculateUserStreak(userEntries: ChoreEntryWithRelations[], endDate: Date): number {
    if (userEntries.length === 0) return 0

    // Group entries by date
    const entriesByDate = new Map<string, ChoreEntryWithRelations[]>()
    userEntries.forEach(entry => {
      const dateKey = entry.completedAt.toISOString().split('T')[0]
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, [])
      }
      entriesByDate.get(dateKey)!.push(entry)
    })

    // Calculate streak from end date backwards
    let streak = 0
    const currentDate = new Date(endDate)
    
    while (streak < 30) { // Max 30 days to prevent infinite loops
      const dateKey = currentDate.toISOString().split('T')[0]
      if (entriesByDate.has(dateKey)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Get user performance comparison (current vs previous period)
   */
  static async getUserPerformanceComparison(userId: string, currentStart: Date, currentEnd: Date): Promise<{
    current: {
      choreCount: number
      averageCompletion: number
      percentage: number
    }
    previous: {
      choreCount: number
      averageCompletion: number
      percentage: number
    }
    changes: {
      choreCountChange: number
      completionChange: number
      percentageChange: number
    }
  }> {
    try {
      // Calculate previous period dates
      const periodLength = currentEnd.getTime() - currentStart.getTime()
      const previousEnd = new Date(currentStart.getTime() - 1)
      const previousStart = new Date(previousEnd.getTime() - periodLength)

      // Get stats for both periods
      const [currentStats, previousStats] = await Promise.all([
        this.getUserStats(userId, currentStart, currentEnd),
        this.getUserStats(userId, previousStart, previousEnd)
      ])

      // Calculate changes
      const changes = {
        choreCountChange: currentStats.choreCount - previousStats.choreCount,
        completionChange: currentStats.averageCompletion - previousStats.averageCompletion,
        percentageChange: currentStats.percentage - previousStats.percentage
      }

      return {
        current: currentStats,
        previous: previousStats,
        changes
      }
    } catch (error) {
      throw new Error(`Failed to get user performance comparison: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}