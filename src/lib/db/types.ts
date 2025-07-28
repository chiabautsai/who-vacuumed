import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { users, choreTypes, choreEntries } from './schema'

// User types
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

// Chore type types
export type ChoreType = InferSelectModel<typeof choreTypes>
export type NewChoreType = InferInsertModel<typeof choreTypes>

// Chore entry types
export type ChoreEntry = InferSelectModel<typeof choreEntries>
export type NewChoreEntry = InferInsertModel<typeof choreEntries>

// Extended types with relations
export type ChoreEntryWithRelations = ChoreEntry & {
  user: User
  choreType: ChoreType
}

export type UserWithChoreEntries = User & {
  choreEntries: ChoreEntry[]
}

export type ChoreTypeWithEntries = ChoreType & {
  choreEntries: ChoreEntry[]
}

// API request/response types
export interface ChoreLogRequest {
  choreTypeId: string
  completionPercentage: number
  comments?: string
  completedAt?: Date
}

export interface WeeklyStats {
  totalChores: number
  userContributions: UserContribution[]
  completionRate: number
  weekOverWeekChange: number
}

export interface UserContribution {
  userId: string
  userName: string
  choreCount: number
  percentage: number
}

export interface TimelineData {
  startDate: Date
  endDate: Date
  choreEntries: ChoreEntryWithRelations[]
  dailyCompletions: DailyCompletion[]
}

export interface DailyCompletion {
  date: Date
  choreType: string
  completions: CompletionDetail[]
}

export interface CompletionDetail {
  id: string
  userId: string
  userName: string
  completionPercentage: number
  comments?: string
  completedAt: Date
}

// Auth types
export interface AuthSession {
  user: User
  accessToken: string
  refreshToken?: string
  expiresAt: Date
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: Date
}