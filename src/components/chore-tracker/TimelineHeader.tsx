interface TimelineHeaderProps {
  startDate: Date
  endDate: Date
  visibleDays: number
}

export function TimelineHeader({ startDate, endDate, visibleDays }: TimelineHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chore Completion Tracker</h1>
          <p className="text-muted-foreground mt-2">Visual overview of household chore completion over time</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Drag to scroll timeline • Click rectangles for details • Showing {visibleDays} days
          </div>
        </div>
      </div>
      
      {/* Date Range Display */}
      <div className="mt-6">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>
            {startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric", 
              year: "numeric",
            })}
          </span>
          <span>
            {endDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  )
}