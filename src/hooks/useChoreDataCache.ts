import { useState, useEffect, useRef, useCallback } from 'react'
import { getChoreDataAction } from '@/lib/actions/chore-actions'
import type { ChoreType, ChoreData } from '@/types/chore'

interface CacheEntry {
  data: Record<string, ChoreData[]>
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEBOUNCE_DELAY = 300 // 300ms debounce

export function useChoreDataCache(
  choreTypes: ChoreType[],
  initialData: Record<string, ChoreData[]>
) {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map())
  const [loading, setLoading] = useState(false)
  const [currentData, setCurrentData] = useState(initialData)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const currentRequest = useRef<AbortController | null>(null)

  // Generate cache key from date range and visible days
  const getCacheKey = useCallback((startDate: Date, visibleDays: number) => {
    return `${startDate.toISOString().split('T')[0]}-${visibleDays}`
  }, [])

  // Check if cache entry is still valid
  const isCacheValid = useCallback((entry: CacheEntry) => {
    return Date.now() - entry.timestamp < CACHE_DURATION
  }, [])

  // Fetch data with caching and debouncing
  const fetchChoreData = useCallback(async (
    startDate: Date, 
    visibleDays: number,
    immediate = false
  ) => {
    const cacheKey = getCacheKey(startDate, visibleDays)
    
    // Check cache first
    const cachedEntry = cache.get(cacheKey)
    if (cachedEntry && isCacheValid(cachedEntry)) {
      setCurrentData(cachedEntry.data)
      return
    }

    // Cancel previous request
    if (currentRequest.current) {
      currentRequest.current.abort()
    }

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    const executeRequest = async () => {
      if (choreTypes.length === 0) return

      try {
        setLoading(true)
        
        // Create new abort controller
        currentRequest.current = new AbortController()
        
        const response = await getChoreDataAction(startDate, visibleDays, choreTypes)
        
        if (!response.success) {
          console.error('Failed to fetch chore data:', response.message)
          return
        }
        
        const data = response.data || {}
        
        // Update cache
        setCache(prev => new Map(prev).set(cacheKey, {
          data,
          timestamp: Date.now()
        }))
        
        setCurrentData(data)
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to load chore data:', error)
        }
      } finally {
        setLoading(false)
        currentRequest.current = null
      }
    }

    if (immediate) {
      executeRequest()
    } else {
      // Debounce the request
      debounceTimer.current = setTimeout(executeRequest, DEBOUNCE_DELAY)
    }
  }, [cache, choreTypes, getCacheKey, isCacheValid])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      if (currentRequest.current) {
        currentRequest.current.abort()
      }
    }
  }, [])

  // Prefetch adjacent data ranges for smoother scrolling
  const prefetchAdjacentRanges = useCallback((
    currentStartDate: Date,
    visibleDays: number
  ) => {
    const prefetchRanges = [
      // Previous range
      new Date(currentStartDate.getTime() - (visibleDays * 24 * 60 * 60 * 1000)),
      // Next range  
      new Date(currentStartDate.getTime() + (visibleDays * 24 * 60 * 60 * 1000))
    ]

    prefetchRanges.forEach(startDate => {
      const cacheKey = getCacheKey(startDate, visibleDays)
      const cachedEntry = cache.get(cacheKey)
      
      if (!cachedEntry || !isCacheValid(cachedEntry)) {
        // Prefetch in background without loading state
        getChoreDataAction(startDate, visibleDays, choreTypes)
          .then(response => {
            if (response.success) {
              const data = response.data || {}
              setCache(prev => new Map(prev).set(cacheKey, {
                data,
                timestamp: Date.now()
              }))
            }
          })
          .catch(() => {}) // Ignore prefetch errors
      }
    })
  }, [cache, choreTypes, getCacheKey, isCacheValid])

  return {
    data: currentData,
    loading,
    fetchChoreData,
    prefetchAdjacentRanges,
    clearCache: () => setCache(new Map())
  }
}