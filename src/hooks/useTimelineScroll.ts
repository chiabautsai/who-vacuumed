import { useState, useRef, useEffect, useCallback } from 'react'
import { TIMELINE_CONFIG } from '@/constants/chore'

export function useTimelineScroll(initialScrollOffset = 0, initialVisibleDays = 30) {
  const [scrollOffset, setScrollOffset] = useState(initialScrollOffset)
  const [visibleDays, setVisibleDays] = useState(initialVisibleDays)
  const isDragging = useRef(false)
  const lastX = useRef(0)
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  
  // Enhanced mobile touch support
  const touchStartTime = useRef(0)
  const touchStartX = useRef(0)
  const velocity = useRef(0)
  const lastTouchTime = useRef(0)
  const momentumAnimationId = useRef<number | null>(null)
  const isTouch = useRef(false)

  // Calculate how many rectangles can fit in the container with mobile optimization
  useEffect(() => {
    const calculateVisibleDays = () => {
      if (timelineContainerRef.current) {
        const containerWidth = timelineContainerRef.current.offsetWidth
        const isMobile = window.innerWidth < TIMELINE_CONFIG.MOBILE_BREAKPOINT
        
        // Use mobile-specific dimensions on smaller screens
        const rectangleWidth = isMobile ? TIMELINE_CONFIG.MOBILE_RECTANGLE_WIDTH : TIMELINE_CONFIG.RECTANGLE_WIDTH
        const rectangleGap = isMobile ? TIMELINE_CONFIG.MOBILE_RECTANGLE_GAP : TIMELINE_CONFIG.RECTANGLE_GAP
        const minVisibleDays = isMobile ? TIMELINE_CONFIG.MOBILE_MIN_VISIBLE_DAYS : TIMELINE_CONFIG.MIN_VISIBLE_DAYS
        
        const rectanglesPerRow = Math.floor(
          (containerWidth + rectangleGap) / 
          (rectangleWidth + rectangleGap)
        )
        const newVisibleDays = Math.max(
          minVisibleDays, 
          Math.min(TIMELINE_CONFIG.TOTAL_DAYS, rectanglesPerRow)
        )
        
        // Only update visible days if it actually changed
        setVisibleDays(prevVisibleDays => {
          if (prevVisibleDays !== newVisibleDays) {
            return newVisibleDays
          }
          return prevVisibleDays
        })

        // Only set default scroll offset on first initialization
        if (!hasInitialized.current) {
          const defaultScrollOffset = Math.max(0, TIMELINE_CONFIG.TOTAL_DAYS - newVisibleDays)
          setScrollOffset(defaultScrollOffset)
          hasInitialized.current = true
        }
      }
    }

    calculateVisibleDays()

    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize to prevent excessive recalculations
      setTimeout(calculateVisibleDays, 100)
    })
    
    if (timelineContainerRef.current) {
      resizeObserver.observe(timelineContainerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Calculate current date range based on scroll offset
  const getCurrentDateRange = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - TIMELINE_CONFIG.TOTAL_DAYS + 1 + scrollOffset)

    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + visibleDays - 1)

    return { startDate, endDate }
  }

  // Momentum scrolling for mobile
  const applyMomentum = useCallback(() => {
    if (Math.abs(velocity.current) < 0.1) {
      velocity.current = 0
      momentumAnimationId.current = null
      return
    }

    setScrollOffset((prev) => {
      const newOffset = Math.max(0, Math.min(TIMELINE_CONFIG.TOTAL_DAYS - visibleDays, prev + velocity.current))
      return newOffset
    })

    // Apply friction
    velocity.current *= 0.95
    momentumAnimationId.current = requestAnimationFrame(applyMomentum)
  }, [visibleDays])

  // Stop momentum scrolling
  const stopMomentum = useCallback(() => {
    if (momentumAnimationId.current) {
      cancelAnimationFrame(momentumAnimationId.current)
      momentumAnimationId.current = null
    }
    velocity.current = 0
  }, [])

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    lastX.current = e.clientX
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return

    const deltaX = e.clientX - lastX.current
    const sensitivity = 0.5
    const scrollDelta = Math.round(-deltaX * sensitivity)

    if (Math.abs(scrollDelta) >= 1) {
      setScrollOffset((prev) => {
        const newOffset = Math.max(0, Math.min(TIMELINE_CONFIG.TOTAL_DAYS - visibleDays, prev + scrollDelta))
        return newOffset
      })
      lastX.current = e.clientX
    }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleMouseLeave = () => {
    isDragging.current = false
  }

  // Enhanced touch events for mobile with momentum scrolling
  const handleTouchStart = (e: React.TouchEvent) => {
    isTouch.current = true
    isDragging.current = true
    stopMomentum()
    
    const touch = e.touches[0]
    lastX.current = touch.clientX
    touchStartX.current = touch.clientX
    touchStartTime.current = Date.now()
    lastTouchTime.current = Date.now()
    
    // Prevent default to avoid scrolling issues
    e.preventDefault()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !isTouch.current) return

    const touch = e.touches[0]
    const currentTime = Date.now()
    const deltaX = touch.clientX - lastX.current
    const deltaTime = currentTime - lastTouchTime.current
    
    // Enhanced sensitivity for mobile
    const sensitivity = 0.8
    const scrollDelta = Math.round(-deltaX * sensitivity)

    if (Math.abs(scrollDelta) >= 1) {
      setScrollOffset((prev) => {
        const newOffset = Math.max(0, Math.min(TIMELINE_CONFIG.TOTAL_DAYS - visibleDays, prev + scrollDelta))
        return newOffset
      })
      
      // Calculate velocity for momentum
      if (deltaTime > 0) {
        velocity.current = -deltaX / deltaTime * 16 // Convert to pixels per frame (60fps)
      }
      
      lastX.current = touch.clientX
      lastTouchTime.current = currentTime
    }
    
    // Prevent default scrolling and zooming
    e.preventDefault()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || !isTouch.current) return
    
    isDragging.current = false
    const endTime = Date.now()
    const totalTime = endTime - touchStartTime.current
    const totalDistance = lastX.current - touchStartX.current
    
    // Apply momentum if gesture was fast enough and significant
    if (totalTime < 300 && Math.abs(totalDistance) > 20) {
      const finalVelocity = -totalDistance / totalTime * 16 * 0.3 // Reduced initial velocity
      velocity.current = Math.max(-5, Math.min(5, finalVelocity)) // Clamp velocity
      
      if (Math.abs(velocity.current) > 0.5) {
        momentumAnimationId.current = requestAnimationFrame(applyMomentum)
      }
    }
    
    isTouch.current = false
    e.preventDefault()
  }

  return {
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
  }
}