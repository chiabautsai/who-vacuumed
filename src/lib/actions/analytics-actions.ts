'use server'

import { AnalyticsService } from '../services/analytics-service'
import type { WeeklyStats, UserContribution, ChoreEntryWithRelations } from '../db/types'

/**
 * Get weekly statistics for the current week
 */
export async function getWeeklyStatistics(): Promise<WeeklyStats> {
  try {
    const { start, end } = AnalyticsService.getCurrentWeekRange()
    return await AnalyticsService.getWeeklyStats(start, end)
  } catch (error) {
    console.error('Error fetching weekly statistics:', error)
    throw new Error('Failed to fetch weekly statistics')
  }
}

/**
 * Get user contribution analysis for the current week
 */
export async function getUserContributionAnalysis(): Promise<{
  userContributions: UserContribution[]
  mostActiveUser: UserContribution | null
  totalChores: number
}> {
  try {
    const { start, end } = AnalyticsService.getCurrentWeekRange()
    return await AnalyticsService.getUserContributionAnalysis(start, end)
  } catch (error) {
    console.error('Error fetching user contribution analysis:', error)
    throw new Error('Failed to fetch user contribution analysis')
  }
}

/**
 * Get recent activity feed
 */
export async function getRecentActivity(limit: number = 10): Promise<ChoreEntryWithRelations[]> {
  try {
    return await AnalyticsService.getRecentActivity(limit)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    throw new Error('Failed to fetch recent activity')
  }
}

/**
 * Get statistics for a specific user in the current week
 */
export async function getUserWeeklyStats(userId: string): Promise<{
  choreCount: number
  averageCompletion: number
  percentage: number
}> {
  try {
    const { start, end } = AnalyticsService.getCurrentWeekRange()
    return await AnalyticsService.getUserStats(userId, start, end)
  } catch (error) {
    console.error('Error fetching user weekly stats:', error)
    throw new Error('Failed to fetch user weekly stats')
  }
}

/**
 * Get formatted week range for display
 */
export async function getCurrentWeekRange(): Promise<{ start: Date; end: Date }> {
  return AnalyticsService.getCurrentWeekRange()
}

/**
 * Get detailed user contribution analysis with performance metrics
 */
export async function getDetailedUserAnalysis(): Promise<{
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
    const { start, end } = AnalyticsService.getCurrentWeekRange()
    return await AnalyticsService.getDetailedUserAnalysis(start, end)
  } catch (error) {
    console.error('Error fetching detailed user analysis:', error)
    throw new Error('Failed to fetch detailed user analysis')
  }
}

/**
 * Get user performance comparison for current vs previous week
 */
export async function getUserPerformanceComparison(userId: string): Promise<{
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
    const { start, end } = AnalyticsService.getCurrentWeekRange()
    return await AnalyticsService.getUserPerformanceComparison(userId, start, end)
  } catch (error) {
    console.error('Error fetching user performance comparison:', error)
    throw new Error('Failed to fetch user performance comparison')
  }
}