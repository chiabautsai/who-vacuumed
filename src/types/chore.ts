export interface User {
  id: string
  name: string
  email: string
  picture?: string
  color: string // For UI display
}

export interface ChoreType {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface ChoreCompletion {
  id: string
  userId: string
  choreTypeId: string
  completionPercentage: number
  comments?: string
  completedAt: Date
  time: string // Formatted time for display
}

export interface ChoreData {
  date: string
  completions: ChoreCompletion[]
}

export interface TimelineState {
  scrollOffset: number
  visibleDays: number
  isDragging: boolean
  lastX: number
}

export interface CompletionStats {
  totalCompletions: number
  completionRate: number
  mostActiveChore: string
  mostActiveMember: string
}