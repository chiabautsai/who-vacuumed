'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

// Components
import { Navigation } from "./Navigation"
import { Legend } from "./Legend"
import { TimelineHeader } from "./TimelineHeader"
import { EnhancedTimeline } from "./EnhancedTimeline"
import { ScrollIndicator } from "./ScrollIndicator"
import { CompletionStats } from "./CompletionStats"

// Hooks and utilities
import { useTimelineScroll } from "@/hooks/useTimelineScroll"
import { useChoreDataCache } from "@/hooks/useChoreDataCache"

// Types
import type { User as ChoreUser, ChoreType, ChoreData } from "@/types/chore"
import type { User as DbUser } from "@/lib/db/types"

interface ChoreTrackerClientProps {
  initialUsers: ChoreUser[]
  initialChoreTypes: ChoreType[]
  initialChoreData: Record<string, ChoreData[]>
  initialScrollOffset: number
  initialVisibleDays: number
  currentUser?: DbUser | null
}

export function ChoreTrackerClient({
  initialUsers,
  initialChoreTypes,
  initialChoreData,
  initialScrollOffset,
  initialVisibleDays,
  currentUser,
}: ChoreTrackerClientProps) {
  const [users] = useState<ChoreUser[]>(initialUsers)
  const [choreTypes] = useState<ChoreType[]>(initialChoreTypes)
  const [canInteract, setCanInteract] = useState(true)

  const {
    scrollOffset,
    visibleDays,
    timelineContainerRef,
    getCurrentDateRange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTimelineScroll(initialScrollOffset, initialVisibleDays)

  const {
    data: choreData,
    loading,
    fetchChoreData,
    prefetchAdjacentRanges,
  } = useChoreDataCache(choreTypes, initialChoreData)

  // Handle scroll and resize changes with debouncing and caching
  useEffect(() => {
    const { startDate } = getCurrentDateRange()
    
    // Fetch data for current range (debounced)
    fetchChoreData(startDate, visibleDays)
    
    // Prefetch adjacent ranges for smoother scrolling
    const prefetchTimer = setTimeout(() => {
      prefetchAdjacentRanges(startDate, visibleDays)
    }, 500) // Prefetch after user stops scrolling
    
    return () => clearTimeout(prefetchTimer)
  }, [scrollOffset, visibleDays, fetchChoreData, prefetchAdjacentRanges, getCurrentDateRange])

  const { startDate, endDate } = getCurrentDateRange()

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={currentUser} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TimelineHeader 
          startDate={startDate} 
          endDate={endDate} 
          visibleDays={visibleDays} 
        />
        
        <Legend users={users} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Chore Completion Timeline
            </CardTitle>
            <CardDescription>
              Each rectangle represents a day. Height shows completion percentage, color shows who completed it. Click for details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <div ref={timelineContainerRef} className="w-full">
                <div
                  className={`w-full select-none ${!canInteract ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}`}
                  onMouseDown={!canInteract ? undefined : handleMouseDown}
                  onMouseMove={!canInteract ? undefined : handleMouseMove}
                  onMouseUp={!canInteract ? undefined : handleMouseUp}
                  onMouseLeave={!canInteract ? undefined : handleMouseLeave}
                  onTouchStart={!canInteract ? undefined : handleTouchStart}
                  onTouchMove={!canInteract ? undefined : handleTouchMove}
                  onTouchEnd={!canInteract ? undefined : handleTouchEnd}
                  style={{ touchAction: !canInteract ? "auto" : "none" }}
                >
                  <EnhancedTimeline
                    choreTypes={choreTypes}
                    users={users}
                    choreData={choreData}
                    visibleDays={visibleDays}
                    loading={loading}
                    onInteraction={setCanInteract}
                  />
                </div>
              </div>

              <ScrollIndicator scrollOffset={scrollOffset} visibleDays={visibleDays} />
              
              <CompletionStats 
                choreData={choreData}
                users={users}
                choreTypes={choreTypes}
                visibleDays={visibleDays}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}