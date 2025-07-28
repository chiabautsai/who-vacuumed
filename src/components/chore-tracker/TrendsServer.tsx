import { getWeeklyStatistics, getDetailedUserAnalysis, getRecentActivity } from '@/lib/actions/analytics-actions'
import { TrendsClient } from './TrendsClient'

export async function TrendsServer() {
  try {
    // Fetch all analytics data in parallel
    const [weeklyStats, detailedAnalysis, recentActivity] = await Promise.all([
      getWeeklyStatistics(),
      getDetailedUserAnalysis(),
      getRecentActivity(10)
    ])

    return (
      <TrendsClient
        weeklyStats={weeklyStats}
        detailedAnalysis={detailedAnalysis}
        recentActivity={recentActivity}
      />
    )
  } catch (error) {
    console.error('Error loading trends data:', error)
    
    // Return error state component
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Unable to Load Analytics</h2>
          <p className="text-muted-foreground">
            There was an error loading the analytics data. Please try again later.
          </p>
        </div>
      </div>
    )
  }
}