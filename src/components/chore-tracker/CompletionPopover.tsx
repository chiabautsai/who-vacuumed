import { Badge } from "@/components/ui/badge"
import { Calendar, User, Clock, MessageSquare } from "lucide-react"
import type { ChoreCompletion, User as UserType } from "@/types/chore"

interface CompletionPopoverContentProps {
  date: string
  choreType: string
  completions: ChoreCompletion[]
  users: UserType[]
}

export function CompletionPopoverContent({ 
  date, 
  choreType, 
  completions, 
  users 
}: CompletionPopoverContentProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric", 
      month: "long",
      day: "numeric",
    })
  }

  if (completions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatDate(date)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <strong>{choreType}</strong>
        </div>
        <div className="text-sm text-muted-foreground">No completions recorded for this day.</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{formatDate(date)}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        <strong>{choreType}</strong>
      </div>
      <div className="space-y-3">
        {completions.map((completion, index) => {
          const user = users.find((u) => u.id === completion.userId)
          return (
            <div key={index} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user?.name}</span>
                </div>
                <Badge variant={completion.completionPercentage === 1 ? "default" : "secondary"}>
                  {completion.completionPercentage === 1 
                    ? "Complete" 
                    : `${Math.round(completion.completionPercentage * 100)}%`}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{completion.time}</span>
              </div>
              {completion.comments && (
                <div className="flex items-start space-x-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground italic">{completion.comments}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}