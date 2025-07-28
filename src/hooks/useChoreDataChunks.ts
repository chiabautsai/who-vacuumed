import { useState, useEffect, useRef, useCallback } from 'react'
import { getChoreChunkAction } from '@/lib/actions/chore-actions'
import type { ChoreType, ChoreData } from '@/types/chore'

// Fixed chunk size for consistent caching
const CHUNK_SIZE_DAYS = 30
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
const DEBOUNCE_DELAY = 200 // 200ms debounce

interface ChoreChunk {
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  data: Record<string, ChoreData[]>
  timestamp: number
}

interface ChunkCache {
  chunks: Map<string, ChoreChunk>
  loading: Set<string>
}

export function useChoreDataChunks(
  choreTypes: ChoreType[],
  initialData: Record<string, ChoreData[]>,
  initialStartDate: Date,
  initialVisibleDays: number
) {
  const [cache, setCache] = useState<ChunkCache>({
    chunks: new Map(),
    loading: new Set()
  })
  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const requestControllers = useRef<Map<string, AbortController>>(new Map())

  // Initialize cache with initial data
  useEffect(() => {
    const chunkKey = getChunkKey(initialStartDate)
    setCache(prev => ({
      ...prev,
      chunks: new Map(prev.chunks).set(chunkKey, {
        startDate: getChunkStartDate(initialStartDate).toISOString().split('T')[0],
        endDate: getChunkEndDate(initialStartDate).toISOString().split('T')[0],
        data: initialData,
        timestamp: Date.now()
      })
    }))
  }, [initialData, initialStartDate])

  // Generate chunk key (aligned to chunk boundaries)
  const getChunkKey = useCallback((date: Date): string => {
    const chunkStart = getChunkStartDate(date)
    return chunkStart.toISOString().split('T')[0]
  }, [])

  // Get chunk start date (aligned to chunk boundaries)
  const getChunkStartDate = useCallback((date: Date): Date => {
    const epoch = new Date('2024-01-01') // Fixed epoch for consistent alignment
    const daysSinceEpoch = Math.floor((date.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000))
    const chunkIndex = Math.floor(daysSinceEpoch / CHUNK_SIZE_DAYS)
    const chunkStartDays = chunkIndex * CHUNK_SIZE_DAYS
    
    const chunkStart = new Date(epoch)
    chunkStart.setDate(epoch.getDate() + chunkStartDays)
    return chunkStart
  }, [])

  // Get chunk end date
  const getChunkEndDate = useCallback((date: Date): Date => {
    const chunkStart = getChunkStartDate(date)
    const chunkEnd = new Date(chunkStart)
    chunkEnd.setDate(chunkStart.getDate() + CHUNK_SIZE_DAYS - 1)
    return chunkEnd
  }, [getChunkStartDate])

  // Check if chunk is valid
  const isChunkValid = useCallback((chunk: ChoreChunk): boolean => {
    return Date.now() - chunk.timestamp < CACHE_DURATION
  }, [])

  // Get required chunks for a date range
  const getRequiredChunks = useCallback((startDate: Date, visibleDays: number): string[] => {
    const chunks: string[] = []
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + visibleDays - 1)

    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const chunkKey = getChunkKey(currentDate)
      if (!chunks.includes(chunkKey)) {
        chunks.push(chunkKey)
      }
      
      // Move to next chunk
      const nextChunkStart = getChunkStartDate(currentDate)
      nextChunkStart.setDate(nextChunkStart.getDate() + CHUNK_SIZE_DAYS)
      currentDate = nextChunkStart
    }

    return chunks
  }, [getChunkKey, getChunkStartDate])

  // Fetch a single chunk
  const fetchChunk = useCallback(async (chunkKey: string, immediate = false) => {
    // Check if already loading
    if (cache.loading.has(chunkKey)) return

    // Check if cached and valid
    const existingChunk = cache.chunks.get(chunkKey)
    if (existingChunk && isChunkValid(existingChunk)) return

    const executeRequest = async () => {
      if (choreTypes.length === 0) return

      // Mark as loading
      setCache(prev => ({
        ...prev,
        loading: new Set(prev.loading).add(chunkKey)
      }))

      try {
        // Cancel any existing request for this chunk
        const existingController = requestControllers.current.get(chunkKey)
        if (existingController) {
          existingController.abort()
        }

        // Create new abort controller
        const controller = new AbortController()
        requestControllers.current.set(chunkKey, controller)

        // Calculate chunk date range
        const chunkStartDate = new Date(chunkKey)
        const chunkEndDate = getChunkEndDate(chunkStartDate)

        // Fetch chunk data
        const response = await getChoreChunkAction(
          chunkStartDate, 
          CHUNK_SIZE_DAYS, 
          choreTypes,
          controller.signal
        )

        if (!response.success) {
          console.error(`Failed to fetch chunk ${chunkKey}:`, response.message)
          return
        }

        const data = response.data || {}

        // Update cache
        setCache(prev => {
          const newChunks = new Map(prev.chunks)
          const newLoading = new Set(prev.loading)
          
          newChunks.set(chunkKey, {
            startDate: chunkStartDate.toISOString().split('T')[0],
            endDate: chunkEndDate.toISOString().split('T')[0],
            data,
            timestamp: Date.now()
          })
          newLoading.delete(chunkKey)

          return {
            chunks: newChunks,
            loading: newLoading
          }
        })

        // Clean up controller
        requestControllers.current.delete(chunkKey)

      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error(`Failed to load chunk ${chunkKey}:`, error)
        }
        
        // Remove from loading set
        setCache(prev => {
          const newLoading = new Set(prev.loading)
          newLoading.delete(chunkKey)
          return {
            ...prev,
            loading: newLoading
          }
        })
        
        requestControllers.current.delete(chunkKey)
      }
    }

    if (immediate) {
      executeRequest()
    } else {
      // Debounce the request
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(executeRequest, DEBOUNCE_DELAY)
    }
  }, [cache, choreTypes, isChunkValid, getChunkEndDate])

  // Compose visible data from chunks
  const getVisibleData = useCallback((
    startDate: Date, 
    visibleDays: number
  ): Record<string, ChoreData[]> => {
    const requiredChunks = getRequiredChunks(startDate, visibleDays)
    const result: Record<string, ChoreData[]> = {}

    // Initialize result structure
    choreTypes.forEach(choreType => {
      result[choreType.name] = []
    })

    // Collect data from all required chunks
    const allChunkData: ChoreData[][] = []
    
    requiredChunks.forEach(chunkKey => {
      const chunk = cache.chunks.get(chunkKey)
      if (chunk && isChunkValid(chunk)) {
        choreTypes.forEach(choreType => {
          const chunkChoreData = chunk.data[choreType.name] || []
          allChunkData.push(chunkChoreData)
        })
      }
    })

    // Filter and compose visible range
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + visibleDays - 1)

    choreTypes.forEach(choreType => {
      for (let i = 0; i < visibleDays; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        const dateStr = currentDate.toISOString().split('T')[0]

        // Find data for this date across all chunks
        let dayData: ChoreData | undefined

        requiredChunks.forEach(chunkKey => {
          const chunk = cache.chunks.get(chunkKey)
          if (chunk && isChunkValid(chunk)) {
            const chunkChoreData = chunk.data[choreType.name] || []
            const foundData = chunkChoreData.find(data => data.date === dateStr)
            if (foundData) {
              dayData = foundData
            }
          }
        })

        result[choreType.name].push(dayData || {
          date: dateStr,
          completions: []
        })
      }
    })

    return result
  }, [cache, choreTypes, getRequiredChunks, isChunkValid])

  // Main data fetching function
  const fetchVisibleData = useCallback(async (
    startDate: Date,
    visibleDays: number,
    immediate = false
  ) => {
    const requiredChunks = getRequiredChunks(startDate, visibleDays)
    
    // Check if any chunks are missing or invalid
    const missingChunks = requiredChunks.filter(chunkKey => {
      const chunk = cache.chunks.get(chunkKey)
      return !chunk || !isChunkValid(chunk)
    })

    // Set loading state if we need to fetch chunks
    if (missingChunks.length > 0) {
      setLoading(true)
    }

    // Fetch missing chunks
    await Promise.all(
      missingChunks.map(chunkKey => fetchChunk(chunkKey, immediate))
    )

    setLoading(false)
  }, [cache, getRequiredChunks, isChunkValid, fetchChunk])

  // Prefetch adjacent chunks
  const prefetchAdjacentChunks = useCallback((
    currentStartDate: Date,
    visibleDays: number
  ) => {
    const currentChunks = getRequiredChunks(currentStartDate, visibleDays)
    
    // Prefetch previous and next chunks
    const prefetchChunks: string[] = []
    
    currentChunks.forEach(chunkKey => {
      const chunkDate = new Date(chunkKey)
      
      // Previous chunk
      const prevChunkDate = new Date(chunkDate)
      prevChunkDate.setDate(chunkDate.getDate() - CHUNK_SIZE_DAYS)
      prefetchChunks.push(getChunkKey(prevChunkDate))
      
      // Next chunk
      const nextChunkDate = new Date(chunkDate)
      nextChunkDate.setDate(chunkDate.getDate() + CHUNK_SIZE_DAYS)
      prefetchChunks.push(getChunkKey(nextChunkDate))
    })

    // Remove duplicates and current chunks
    const uniquePrefetchChunks = [...new Set(prefetchChunks)]
      .filter(chunkKey => !currentChunks.includes(chunkKey))

    // Prefetch in background
    uniquePrefetchChunks.forEach(chunkKey => {
      const chunk = cache.chunks.get(chunkKey)
      if (!chunk || !isChunkValid(chunk)) {
        fetchChunk(chunkKey, true) // Immediate, no debounce for prefetch
      }
    })
  }, [cache, getRequiredChunks, getChunkKey, isChunkValid, fetchChunk])

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      requestControllers.current.forEach(controller => controller.abort())
      requestControllers.current.clear()
    }
  }, [])

  return {
    data: getVisibleData,
    loading,
    fetchVisibleData,
    prefetchAdjacentChunks,
    clearCache: () => setCache({ chunks: new Map(), loading: new Set() }),
    cacheStats: {
      chunksCount: cache.chunks.size,
      loadingCount: cache.loading.size,
      chunkKeys: Array.from(cache.chunks.keys())
    }
  }
}