import { useState, useEffect } from 'react'
import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// Loading state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'partial'

interface LoadingIndicatorProps {
  state: LoadingState
  progress?: number
  message?: string
  className?: string
}

export function LoadingIndicator({ state, progress, message, className }: LoadingIndicatorProps) {
  const [dots, setDots] = useState('')

  // Animated dots for loading states
  useEffect(() => {
    if (state === 'loading') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.')
      }, 500)
      return () => clearInterval(interval)
    }
  }, [state])

  if (state === 'idle' || state === 'success') return null

  return (
    <div className={cn(
      "flex items-center justify-center py-2 px-3 rounded-md transition-all duration-200",
      state === 'loading' && "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
      state === 'error' && "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
      state === 'partial' && "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400",
      className
    )}>
      <div className="flex items-center space-x-2">
        {state === 'loading' && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        {state === 'error' && (
          <WifiOff className="h-3 w-3" />
        )}
        {state === 'partial' && (
          <Wifi className="h-3 w-3" />
        )}
        
        <span className="text-xs font-medium">
          {message || getDefaultMessage(state)}{state === 'loading' && dots}
        </span>
        
        {progress !== undefined && (
          <div className="w-16 h-1 bg-current/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function getDefaultMessage(state: LoadingState): string {
  switch (state) {
    case 'loading': return 'Loading timeline'
    case 'error': return 'Connection error'
    case 'partial': return 'Partial data loaded'
    default: return ''
  }
}

interface SkeletonRectangleProps {
  variant?: 'default' | 'shimmer' | 'pulse' | 'wave'
  delay?: number
  className?: string
}

export function SkeletonRectangle({ 
  variant = 'shimmer', 
  delay = 0,
  className 
}: SkeletonRectangleProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div 
      className={cn(
        "w-4 h-7 border border-border rounded-sm flex-shrink-0 transition-opacity duration-200",
        !isVisible && "opacity-0",
        variant === 'pulse' && "bg-muted animate-pulse",
        variant === 'shimmer' && "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]",
        variant === 'wave' && "bg-muted animate-[wave_2s_ease-in-out_infinite]",
        variant === 'default' && "bg-muted",
        className
      )}
      style={{
        animationDelay: variant === 'wave' ? `${delay * 0.1}s` : undefined
      }}
    />
  )
}

interface ProgressiveLoadingProps {
  totalItems: number
  loadedItems: number
  isLoading: boolean
  children: (index: number, isLoaded: boolean) => React.ReactNode
  className?: string
}

export function ProgressiveLoading({ 
  totalItems, 
  loadedItems, 
  isLoading, 
  children,
  className 
}: ProgressiveLoadingProps) {
  return (
    <div className={cn("flex gap-1 w-full justify-between", className)}>
      {Array.from({ length: totalItems }).map((_, index) => {
        const isLoaded = index < loadedItems
        const shouldShowSkeleton = isLoading && !isLoaded
        
        if (shouldShowSkeleton) {
          return (
            <SkeletonRectangle 
              key={`skeleton-${index}`}
              variant="shimmer"
              delay={index * 50} // Staggered animation
            />
          )
        }
        
        return children(index, isLoaded)
      })}
    </div>
  )
}

// Add shimmer animation to global CSS
export const skeletonStyles = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.8); }
}
`