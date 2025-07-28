import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CompletionPopoverContent } from "./CompletionPopover"
import { TIMELINE_CONFIG } from "@/constants/chore"
import type { ChoreCompletion, User } from "@/types/chore"

interface CompletionRectangleProps {
  completions: ChoreCompletion[]
  date: string
  choreType: string
  users: User[]
}

export function CompletionRectangle({
  completions,
  date,
  choreType,
  users,
}: CompletionRectangleProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if any completion has comments
  const hasComments = completions.some((completion) => completion.comments)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < TIMELINE_CONFIG.MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPopoverOpen(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsPopoverOpen(true)
  }

  // Mobile-responsive classes
  const rectangleClasses = isMobile 
    ? "w-5 h-8 md:w-4 md:h-7" // Larger on mobile
    : "w-4 h-7"
  
  const popoverWidth = isMobile ? "w-72" : "w-80"
  const popoverAlign: "start" | "center" | "end" = isMobile ? "start" : "center"

  if (completions.length === 0) {
    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            className={`${rectangleClasses} bg-muted border border-border rounded-sm hover:ring-2 hover:ring-primary/50 cursor-pointer transition-all flex-shrink-0 touch-manipulation`}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </PopoverTrigger>
        <PopoverContent className={popoverWidth} align={popoverAlign} side={isMobile ? "top" : "bottom"}>
          <CompletionPopoverContent
            date={date}
            choreType={choreType}
            completions={completions}
            users={users}
          />
        </PopoverContent>
      </Popover>
    )
  }

  // If multiple completions, show them stacked
  if (completions.length > 1) {
    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            className={`${rectangleClasses} border border-border rounded-sm hover:ring-2 hover:ring-primary/50 cursor-pointer transition-all relative overflow-hidden flex-shrink-0 touch-manipulation`}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {completions.map((completion, index) => {
              const user = users.find((u) => u.id === completion.userId)
              const height = (completion.completionPercentage * 100) / completions.length
              return (
                <div
                  key={index}
                  className={`absolute bottom-0 left-0 right-0 ${user?.color || "bg-muted-foreground"}`}
                  style={{
                    height: `${height}%`,
                    transform: `translateY(${index * (100 / completions.length)}%)`,
                  }}
                />
              )
            })}
            {/* Comment indicator for multiple completions */}
            {hasComments && (
              <div className={`absolute top-0 right-0 ${isMobile ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-yellow-400 rounded-full border border-background`} />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className={popoverWidth} align={popoverAlign} side={isMobile ? "top" : "bottom"}>
          <CompletionPopoverContent
            date={date}
            choreType={choreType}
            completions={completions}
            users={users}
          />
        </PopoverContent>
      </Popover>
    )
  }

  // Single completion
  const completion = completions[0]
  const user = users.find((u) => u.id === completion.userId)
  const fillHeight = completion.completionPercentage * 100

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          className={`${rectangleClasses} bg-muted border border-border rounded-sm hover:ring-2 hover:ring-primary/50 cursor-pointer transition-all relative overflow-hidden flex-shrink-0 touch-manipulation`}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`absolute bottom-0 left-0 right-0 ${user?.color || "bg-muted-foreground"}`}
            style={{ height: `${fillHeight}%` }}
          />
          {/* Comment indicator for single completion */}
          {completion.comments && (
            <div className={`absolute top-0 right-0 ${isMobile ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-yellow-400 rounded-full border border-background`} />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className={popoverWidth} align={popoverAlign} side={isMobile ? "top" : "bottom"}>
        <CompletionPopoverContent
          date={date}
          choreType={choreType}
          completions={completions}
          users={users}
        />
      </PopoverContent>
    </Popover>
  )
}