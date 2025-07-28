import { TIMELINE_CONFIG } from "@/constants/chore"

interface ScrollIndicatorProps {
  scrollOffset: number
  visibleDays: number
}

export function ScrollIndicator({ scrollOffset, visibleDays }: ScrollIndicatorProps) {
  return (
    <div className="mt-6 flex justify-center">
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <div className="w-32 h-1 bg-muted rounded-full relative">
          <div
            className="h-1 bg-primary rounded-full transition-all duration-200"
            style={{
              width: `${(visibleDays / TIMELINE_CONFIG.TOTAL_DAYS) * 100}%`,
              transform: `translateX(${(scrollOffset / (TIMELINE_CONFIG.TOTAL_DAYS - visibleDays)) * (128 - (visibleDays / TIMELINE_CONFIG.TOTAL_DAYS) * 128)}px)`,
            }}
          />
        </div>
        <span>
          {scrollOffset + 1}-{scrollOffset + visibleDays} of {TIMELINE_CONFIG.TOTAL_DAYS} days
        </span>
      </div>
    </div>
  )
}