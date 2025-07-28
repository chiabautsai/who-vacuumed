'use server'

import { getUsers, getChoreTypes, getChoreDataForTimeline } from '@/lib/queries/chore-queries'
import { ChoreEntryService } from '@/lib/db/services/chore-entry-service'
import { ChoreTypeService } from '@/lib/db/services/chore-type-service'
import { auth0 } from '@/lib/auth/auth0'
import { getCurrentUser } from '@/lib/auth/user-sync'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'
import { 
  ServerActionErrorHandler, 
  DatabaseErrorHandler,
  InputSanitizer,
  RateLimiter,
  createValidationError,
  createAuthenticationError,
  createNotFoundError,
  withServerActionErrorHandling,
  type ServerActionResponse
} from '@/lib/utils/server-error-utils'
import type { User, ChoreType, ChoreData } from '@/types/chore'
import type { NewChoreEntry, NewChoreType } from '@/lib/db/types'

/**
 * Enhanced server action to get all users with error handling
 */
export async function getUsersAction(): Promise<ServerActionResponse<User[]>> {
  try {
    const users = await DatabaseErrorHandler.withErrorHandling(
      () => getUsers(),
      'get-users'
    )
    
    return {
      success: true,
      data: users
    }
  } catch (error) {
    return ServerActionErrorHandler.handleError(error, {
      action: 'getUsersAction'
    }) as ServerActionResponse<User[]>
  }
}

/**
 * Enhanced server action to get chore types with error handling
 */
export async function getChoreTypesAction(): Promise<ServerActionResponse<ChoreType[]>> {
  try {
    const choreTypes = await DatabaseErrorHandler.withErrorHandling(
      () => getChoreTypes(),
      'get-chore-types'
    )
    
    return {
      success: true,
      data: choreTypes
    }
  } catch (error) {
    return ServerActionErrorHandler.handleError(error, {
      action: 'getChoreTypesAction'
    }) as ServerActionResponse<ChoreType[]>
  }
}

/**
 * Enhanced server action to get chore data with error handling
 */
export async function getChoreDataAction(
  startDate: Date,
  visibleDays: number,
  choreTypes: ChoreType[]
): Promise<ServerActionResponse<Record<string, ChoreData[]>>> {
  try {
    // Validate input parameters
    if (!startDate || isNaN(startDate.getTime())) {
      throw createValidationError('Invalid start date provided')
    }
    
    if (!visibleDays || visibleDays <= 0 || visibleDays > 365) {
      throw createValidationError('Visible days must be between 1 and 365')
    }
    
    // Allow empty chore types - return empty data instead of error
    if (!choreTypes || choreTypes.length === 0) {
      return {
        success: true,
        data: {}
      }
    }

    const choreData = await DatabaseErrorHandler.withErrorHandling(
      () => getChoreDataForTimeline(startDate, visibleDays, choreTypes),
      'get-chore-data-timeline'
    )
    
    return {
      success: true,
      data: choreData
    }
  } catch (error) {
    return ServerActionErrorHandler.handleError(error, {
      action: 'getChoreDataAction',
      startDate: startDate?.toISOString(),
      visibleDays,
      choreTypesCount: choreTypes?.length
    }) as ServerActionResponse<Record<string, ChoreData[]>>
  }
}

/**
 * Enhanced server action to get chore chunk data with error handling
 */
export async function getChoreChunkAction(
  startDate: Date,
  chunkSizeDays: number,
  choreTypes: ChoreType[],
  signal?: AbortSignal
): Promise<ServerActionResponse<Record<string, ChoreData[]>>> {
  try {
    // Check if request was aborted
    if (signal?.aborted) {
      throw new Error('Request was aborted')
    }

    // Validate input parameters
    if (!startDate || isNaN(startDate.getTime())) {
      throw createValidationError('Invalid start date provided')
    }
    
    if (!chunkSizeDays || chunkSizeDays <= 0 || chunkSizeDays > 90) {
      throw createValidationError('Chunk size must be between 1 and 90 days')
    }
    
    // Allow empty chore types - return empty data instead of error
    if (!choreTypes || choreTypes.length === 0) {
      return {
        success: true,
        data: {}
      }
    }

    const choreData = await DatabaseErrorHandler.withErrorHandling(
      () => getChoreDataForTimeline(startDate, chunkSizeDays, choreTypes),
      'get-chore-chunk-data'
    )
    
    return {
      success: true,
      data: choreData
    }
  } catch (error) {
    return ServerActionErrorHandler.handleError(error, {
      action: 'getChoreChunkAction',
      startDate: startDate?.toISOString(),
      chunkSizeDays,
      choreTypesCount: choreTypes?.length,
      aborted: signal?.aborted
    }) as ServerActionResponse<Record<string, ChoreData[]>>
  }
}

/**
 * Enhanced server action to log a completed chore with comprehensive error handling
 * Validates input, authenticates user, handles rate limiting, and saves to database
 */
export async function logChoreAction(formData: FormData): Promise<ServerActionResponse<NewChoreEntry>> {
  try {
    // Rate limiting check
    const session = await auth0.getSession()
    const userId = session?.user?.sub || 'anonymous'
    
    if (!RateLimiter.checkRateLimit(`chore-log:${userId}`, 10, 60000)) {
      throw createValidationError('Too many requests. Please wait before submitting again.')
    }

    // Authentication check
    if (!session?.user) {
      throw createAuthenticationError('You must be logged in to log chores')
    }

    // Get user from database with error handling
    const user = await DatabaseErrorHandler.withErrorHandling(
      () => getCurrentUser(session.user.sub),
      'get-current-user'
    )
    
    if (!user) {
      throw createNotFoundError('User profile')
    }

    // Sanitize and extract form data
    const sanitizedData = InputSanitizer.sanitizeFormData(formData)
    const choreTypeId = sanitizedData.choreTypeId
    const completionPercentageStr = sanitizedData.completionPercentage
    const comments = sanitizedData.comments

    // Comprehensive server-side validation
    const errors: Record<string, string> = {}

    // Validate chore type
    if (!choreTypeId || choreTypeId.trim() === '') {
      errors.choreTypeId = 'Chore type is required'
    } else {
      // Validate chore type exists and is active
      try {
        const choreType = await DatabaseErrorHandler.withErrorHandling(
          () => ChoreTypeService.findById(choreTypeId),
          'find-chore-type'
        )
        
        if (!choreType) {
          errors.choreTypeId = 'Invalid chore type selected'
        } else if (!choreType.isActive) {
          errors.choreTypeId = 'This chore type is no longer available'
        }
      } catch (error) {
        errors.choreTypeId = 'Unable to validate chore type'
      }
    }

    // Validate completion percentage
    if (!completionPercentageStr || completionPercentageStr.trim() === '') {
      errors.completionPercentage = 'Completion percentage is required'
    } else {
      const completionPercentage = parseFloat(completionPercentageStr)
      if (isNaN(completionPercentage)) {
        errors.completionPercentage = 'Completion percentage must be a valid number'
      } else if (completionPercentage < 0 || completionPercentage > 1) {
        errors.completionPercentage = 'Completion percentage must be between 0% and 100%'
      }
    }

    // Validate comments length
    if (comments && comments.length > 500) {
      errors.comments = 'Comments must be less than 500 characters'
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      throw createValidationError('Please correct the errors and try again', errors)
    }

    // Parse validated data
    const completionPercentage = parseFloat(completionPercentageStr)
    const sanitizedComments = comments ? InputSanitizer.sanitizeHtml(comments.trim()) : null

    // Create new chore entry with transaction support
    const newEntry: NewChoreEntry = {
      id: randomUUID(),
      userId: user.id,
      choreTypeId,
      completionPercentage,
      comments: sanitizedComments,
      completedAt: new Date(),
      createdAt: new Date()
    }

    // Save to database with error handling
    const createdEntry = await DatabaseErrorHandler.withErrorHandling(
      () => ChoreEntryService.create(newEntry),
      'create-chore-entry'
    )

    return {
      success: true,
      data: createdEntry,
      message: 'Chore logged successfully!'
    }

  } catch (error) {
    return ServerActionErrorHandler.handleError(error, {
      action: 'logChoreAction',
      userId: (await auth0.getSession())?.user?.sub,
      formDataKeys: Array.from(formData.keys())
    }) as ServerActionResponse<NewChoreEntry>
  }
}

/**
 * Enhanced server action to create a new chore type with comprehensive error handling
 * Validates input, authenticates user, and saves to database
 */
export async function createChoreTypeAction(formData: FormData): Promise<ServerActionResponse<NewChoreType>> {
  try {
    // Rate limiting check
    const session = await auth0.getSession()
    const userId = session?.user?.sub || 'anonymous'
    
    if (!RateLimiter.checkRateLimit(`chore-type-create:${userId}`, 5, 60000)) {
      throw createValidationError('Too many requests. Please wait before creating another chore type.')
    }

    // Authentication check
    if (!session?.user) {
      throw createAuthenticationError('You must be logged in to create chore types')
    }

    // Get user from database with error handling
    const user = await DatabaseErrorHandler.withErrorHandling(
      () => getCurrentUser(session.user.sub),
      'get-current-user'
    )
    
    if (!user) {
      throw createNotFoundError('User profile')
    }

    // Sanitize and extract form data
    const sanitizedData = InputSanitizer.sanitizeFormData(formData)
    const name = sanitizedData.name
    const description = sanitizedData.description

    // Comprehensive server-side validation
    const errors: Record<string, string> = {}

    // Validate name
    if (!name || name.trim() === '') {
      errors.name = 'Chore type name is required'
    } else if (name.length < 2) {
      errors.name = 'Chore type name must be at least 2 characters'
    } else if (name.length > 50) {
      errors.name = 'Chore type name must be less than 50 characters'
    } else {
      // Check if chore type with this name already exists
      try {
        const existingChoreType = await DatabaseErrorHandler.withErrorHandling(
          () => ChoreTypeService.findByName(name.trim()),
          'find-chore-type-by-name'
        )
        
        if (existingChoreType) {
          errors.name = 'A chore type with this name already exists'
        }
      } catch (error) {
        errors.name = 'Unable to validate chore type name'
      }
    }

    // Validate description
    if (description && description.length > 200) {
      errors.description = 'Description must be less than 200 characters'
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      throw createValidationError('Please correct the errors and try again', errors)
    }

    // Create new chore type
    const newChoreType: NewChoreType = {
      id: randomUUID(),
      name: name.trim(),
      description: description?.trim() || null,
      isActive: true,
      createdAt: new Date()
    }

    // Save to database with error handling
    const createdChoreType = await DatabaseErrorHandler.withErrorHandling(
      () => ChoreTypeService.create(newChoreType),
      'create-chore-type'
    )

    return {
      success: true,
      data: createdChoreType,
      message: 'Chore type created successfully!'
    }

  } catch (error) {
    return ServerActionErrorHandler.handleError(error, {
      action: 'createChoreTypeAction',
      userId: (await auth0.getSession())?.user?.sub,
      formDataKeys: Array.from(formData.keys())
    }) as ServerActionResponse<NewChoreType>
  }
}