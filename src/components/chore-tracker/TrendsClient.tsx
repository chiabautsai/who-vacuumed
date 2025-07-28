"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, CheckCircle, Clock, Users, CalendarDays, ArrowUp, ArrowDown, Minus } from "lucide-react"
import type { WeeklyStats, UserContribution, ChoreEntryWithRelations } from '@/lib/db/types'

interface TrendsClientProps {
  weeklyStats: WeeklyStats
  detailedAnalysis: {
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
  }
  recentActivity: ChoreEntryWithRelations[]
}

export function TrendsClient({ weeklyStats, detailedAnalysis, recentActivity }: TrendsClientProps) {
  const formatPercentageChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-3 w-3 text-green-500" />
    if (change < 0) return <ArrowDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-muted-foreground"
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return `${Math.floor(diffInSeconds / 604800)}w ago`
  }

  // Generate colors for user progress bars
  const userColors = [
    'bg-green-500',
    'bg-blue-500', 
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500'
  ]

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week&apos;s Chores</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.totalChores}</div>
            <div className={`text-xs flex items-center gap-1 ${getChangeColor(weeklyStats.weekOverWeekChange)}`}>
              {getChangeIcon(weeklyStats.weekOverWeekChange)}
              {formatPercentageChange(weeklyStats.weekOverWeekChange)} from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detailedAnalysis.mostActiveUser?.userName || 'No data'}
            </div>
            <p className="text-xs text-muted-foreground">
              {detailedAnalysis.mostActiveUser 
                ? `${detailedAnalysis.mostActiveUser.choreCount} chores (${detailedAnalysis.mostActiveUser.percentage.toFixed(1)}%)`
                : 'No chores completed this week'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Average completion percentage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributors</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detailedAnalysis.userContributions.length}</div>
            <p className="text-xs text-muted-foreground">
              Active house members
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest chores completed by house members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((chore, index) => {
                  const timeAgo = getTimeAgo(chore.completedAt)
                  const isRecent = index < 3 // Highlight first 3 as most recent
                  
                  return (
                    <div 
                      key={chore.id} 
                      className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                        isRecent ? 'border-primary/20 bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isRecent ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <CheckCircle className={`h-5 w-5 ${
                            isRecent ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            {chore.choreType.name}
                          </h4>
                          <Badge 
                            variant={chore.completionPercentage === 1.0 ? "default" : "secondary"}
                            className="ml-2 flex-shrink-0"
                          >
                            {chore.completionPercentage === 1.0 
                              ? "Complete" 
                              : `${Math.round(chore.completionPercentage * 100)}%`
                            }
                          </Badge>
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <span className="font-medium text-foreground">{chore.user.name}</span>
                          <span className="mx-2">•</span>
                          <span>{timeAgo}</span>
                          <span className="mx-2">•</span>
                          <span>{chore.completedAt.toLocaleDateString()}</span>
                          <span className="mx-1">at</span>
                          <span>{chore.completedAt.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                        </div>
                        
                        {chore.comments && (
                          <div className="bg-muted/50 rounded-md p-3 mt-2">
                            <p className="text-sm text-foreground italic">
                              &quot;{chore.comments}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h3>
                  <p className="text-muted-foreground">
                    Chore completions will appear here as they happen
                  </p>
                </div>
              )}
            </div>
            
            {/* Activity summary */}
            {recentActivity.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Showing {recentActivity.length} recent activities</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Most recent</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Contribution Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Distribution</CardTitle>
            <CardDescription>How chores are distributed among house members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detailedAnalysis.userContributions.length > 0 ? (
                detailedAnalysis.userContributions.map((contribution, index) => {
                  const isTopContributor = contribution.userId === detailedAnalysis.mostActiveUser?.userId
                  const isMostConsistent = contribution.userId === detailedAnalysis.mostConsistentUser?.userId
                  return (
                    <div key={contribution.userId} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contribution.userName}</span>
                          {isTopContributor && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              Most Active
                            </Badge>
                          )}
                          {isMostConsistent && !isTopContributor && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              Most Consistent
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">
                            {contribution.choreCount} chores ({contribution.percentage.toFixed(1)}%)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {contribution.averageCompletion}% avg • {contribution.streak} day streak
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden">
                        <div
                          className={`${userColors[index % userColors.length]} h-3 rounded-full transition-all duration-500 ease-out relative`}
                          style={{ width: `${Math.max(contribution.percentage, 2)}%` }}
                        >
                          {/* Shine effect for top contributor */}
                          {isTopContributor && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                          )}
                        </div>
                        {/* Percentage label inside bar if wide enough */}
                        {contribution.percentage > 15 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white drop-shadow-sm">
                              {contribution.percentage.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No contributions to display</p>
                </div>
              )}
              
              {/* Summary stats */}
              {detailedAnalysis.userContributions.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-lg">{detailedAnalysis.totalChores}</div>
                      <div className="text-muted-foreground">Total Chores</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">
                        {(detailedAnalysis.totalChores / detailedAnalysis.userContributions.length).toFixed(1)}
                      </div>
                      <div className="text-muted-foreground">Avg per Person</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">
                        {detailedAnalysis.mostConsistentUser?.averageCompletion || 0}%
                      </div>
                      <div className="text-muted-foreground">Best Quality</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}