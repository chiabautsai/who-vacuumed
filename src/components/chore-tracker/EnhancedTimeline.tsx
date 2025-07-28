import { useState, useEffect, useMemo } from 'react'
import { CompletionRectangle } from './CompletionRectangle'
import { LoadingIndicator, ProgressiveLoading } from './LoadingStates'
import { useEnhancedLoading } from '@/hooks/useEnhancedLoading'
import type { User, ChoreType, ChoreData } from '@/types/chore'
import { cn } from '@/lib/utils'

interface EnhancedTimelineProps {
  choreTypes: ChoreType[]
  users: User[]
  choreData: Record<string, ChoreData[]>
  visibleDays: number
  loading: boolean
  onInteraction?: (enabled: boolean) => void
  className?: string
}

export function EnhancedTimeline({
  choreTypes,
  users,
  choreData,
  visibleDays,
  loading,
  onInteraction,
  className
}: EnhancedTimelineProps) {
  const {
    loadingState,
    startLoading,
    updateProgress,
    setSuccess,
    canInteract
  } = useEnhancedLoading()

  // Calculate loading progress based on available data
  const loadingProgress = useMemo(() => {
    if (!loading) return { loaded: visibleDays, total: visibleDays }
    
    let totalLoaded = 0
    const totalExpected = choreTypes.length * visibleDays

    choreTypes.forEach(choreType => {
      const typeData = choreData[choreType.name] || []
      totalLoaded += typeData.length
    })

    return { loaded: totalLoaded, total: totalExpected }
  }, [choreData, choreTypes, visibleDays, loading])

  // Update loading state based on progress
  useEffect(() => {
    if (loading && loadingState.state === 'idle') {
      startLoading(choreTypes.length, 'Loading timeline data')
    } else if (!loading && loadingState.state !== 'success') {
      setSuccess('Timeline loaded')
    }
  }, [loading, loadingState.state, choreTypes.length, startLoading, setSuccess])

  // Update progress
  useEffect(() => {
    if (loading) {
      const progressPercent = (loadingProgress.loaded / loadingProgress.total) * 100
      updateProgress(Math.floor(progressPercent))
    }
  }, [loading, loadingProgress, updateProgress])

  // Notify parent about interaction capability
  useEffect(() => {
    onInteraction?.(canInteract)
  }, [canInteract, onInteraction])

  return (
    <div className={cn("relative", className)}>
      {/* Minimal Loading Indicator - No Layout Shift */}
      {loadingState.state === 'loading' && (
        <div className="absolute -top-8 right-0 z-10">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Loading...</span>
            {loadingState.progress > 0 && (
              <span className="text-blue-600 font-medium">{Math.round(loadingState.progress)}%</span>
            )}
          </div>
        </div>
      )}

      {/* Timeline Content - Fixed Position */}
      <div className="space-y-6">
        {choreTypes.map((choreType, choreIndex) => {
          const typeData = choreData[choreType.name] || []
          const hasData = typeData.length > 0
          const isTypeLoading = loading && !hasData

          return (
            <div key={choreType.id} className="space-y-2">
              {/* Chore Type Header with Loading State */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {choreType.name}
                </span>
                
                {isTypeLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                )}
              </div>

              {/* Progressive Timeline Row with Mobile-Responsive Spacing */}
              <div className="flex gap-1 md:gap-1 lg:gap-1.5 overflow-x-auto scrollbar-hide">
                <ProgressiveLoading
                  totalItems={visibleDays}
                  loadedItems={hasData ? typeData.length : 0}
                  isLoading={isTypeLoading}
                >
                  {(index, isLoaded) => {
                    if (!isLoaded || !hasData) {
                      return null // ProgressiveLoading handles skeleton
                    }

                    const dayData = typeData[index]
                    if (!dayData) {
                      return (
                        <div 
                          key={`empty-${index}`}
                          className="w-5 h-8 md:w-4 md:h-7 bg-muted border border-border rounded-sm flex-shrink-0 opacity-50"
                        />
                      )
                    }

                    return (
                      <CompletionRectangle
                        key={`${choreType.id}-${index}`}
                        completions={dayData.completions}
                        date={dayData.date}
                        choreType={choreType.name}
                        users={users}
                      />
                    )
                  }}
                </ProgressiveLoading>
              </div>
            </div>
          )
        })}
      </div>


    </div>
  )
}