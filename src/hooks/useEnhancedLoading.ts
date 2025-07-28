import { useState, useCallback, useRef } from 'react'

export interface LoadingProgress {
  state: 'idle' | 'loading' | 'success' | 'error' | 'partial'
  progress: number // 0-100
  loadedChunks: number
  totalChunks: number
  message?: string
  details?: {
    chunksLoading?: string[]
    chunksLoaded?: string[]
    chunksFailed?: string[]
  }
}

export interface UseEnhancedLoadingReturn {
  loadingState: LoadingProgress
  startLoading: (totalChunks: number, message?: string) => void
  updateProgress: (loadedChunks: number, chunkKey?: string) => void
  setError: (message: string, chunkKey?: string) => void
  setSuccess: (message?: string) => void
  reset: () => void
  isLoading: boolean
  hasError: boolean
  canInteract: boolean
}

export function useEnhancedLoading(): UseEnhancedLoadingReturn {
  const [loadingState, setLoadingState] = useState<LoadingProgress>({
    state: 'idle',
    progress: 0,
    loadedChunks: 0,
    totalChunks: 0,
    details: {
      chunksLoading: [],
      chunksLoaded: [],
      chunksFailed: []
    }
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startLoading = useCallback((totalChunks: number, message?: string) => {
    setLoadingState({
      state: 'loading',
      progress: 0,
      loadedChunks: 0,
      totalChunks,
      message,
      details: {
        chunksLoading: [],
        chunksLoaded: [],
        chunksFailed: []
      }
    })

    // Auto-timeout after 10 seconds
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setLoadingState(prev => ({
        ...prev,
        state: 'error',
        message: 'Request timed out'
      }))
    }, 10000)
  }, [])

  const updateProgress = useCallback((loadedChunks: number, chunkKey?: string) => {
    setLoadingState(prev => {
      const progress = prev.totalChunks > 0 ? (loadedChunks / prev.totalChunks) * 100 : 0
      const newDetails = { ...prev.details }
      
      if (chunkKey) {
        // Remove from loading, add to loaded
        newDetails.chunksLoading = (newDetails.chunksLoading || []).filter(key => key !== chunkKey)
        if (!newDetails.chunksLoaded) {
          newDetails.chunksLoaded = []
        }
        if (!newDetails.chunksLoaded.includes(chunkKey)) {
          newDetails.chunksLoaded.push(chunkKey)
        }
      }

      const newState = progress >= 100 ? 'success' : 
                      progress > 0 && progress < 100 ? 'partial' : 'loading'

      return {
        ...prev,
        state: newState,
        progress,
        loadedChunks,
        details: newDetails
      }
    })

    // Clear timeout on successful progress
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const setError = useCallback((message: string, chunkKey?: string) => {
    setLoadingState(prev => {
      const newDetails = { ...prev.details }
      
      if (chunkKey) {
        // Remove from loading, add to failed
        newDetails.chunksLoading = (newDetails.chunksLoading || []).filter(key => key !== chunkKey)
        if (!newDetails.chunksFailed) {
          newDetails.chunksFailed = []
        }
        if (!newDetails.chunksFailed.includes(chunkKey)) {
          newDetails.chunksFailed.push(chunkKey)
        }
      }

      return {
        ...prev,
        state: 'error',
        message,
        details: newDetails
      }
    })

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const setSuccess = useCallback((message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      state: 'success',
      progress: 100,
      message: message || 'Timeline loaded successfully'
    }))

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    setLoadingState({
      state: 'idle',
      progress: 0,
      loadedChunks: 0,
      totalChunks: 0,
      details: {
        chunksLoading: [],
        chunksLoaded: [],
        chunksFailed: []
      }
    })

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return {
    loadingState,
    startLoading,
    updateProgress,
    setError,
    setSuccess,
    reset,
    isLoading: loadingState.state === 'loading' || loadingState.state === 'partial',
    hasError: loadingState.state === 'error',
    canInteract: loadingState.state !== 'loading' || loadingState.progress > 50 // Allow interaction when >50% loaded
  }
}