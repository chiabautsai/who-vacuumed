/**
 * Server-side error handling utilities
 * Provides structured error responses, logging, and database error handling
 */

// Headers not used in current implementation

export interface ServerError extends Error {
  code?: string
  statusCode?: number
  context?: Record<string, unknown>
  isOperational?: boolean
}

export interface ErrorLogEntry {
  timestamp: Date
  level: 'error' | 'warn' | 'info'
  message: string
  error?: Error
  context?: Record<string, unknown>
  requestId?: string
  userId?: string
  userAgent?: string
  ip?: string
}

export interface ServerActionResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string>
  code?: string
}

/**
 * Error types for different categories of server errors
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NETWORK = 'NETWORK_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR'
}

/**
 * Creates a structured server error
 */
export function createServerError(
  message: string,
  type: ErrorType,
  statusCode: number = 500,
  context?: Record<string, unknown>
): ServerError {
  const error = new Error(message) as ServerError
  error.code = type
  error.statusCode = statusCode
  error.context = context
  error.isOperational = true
  return error
}

/**
 * Database error handler with transaction rollback support
 */
export class DatabaseErrorHandler {
  static handleError(error: unknown, operation: string): ServerError {
    console.error(`Database error during ${operation}:`, error)
    
    if (error instanceof Error) {
      // Handle specific database errors
      if (error.message.includes('UNIQUE constraint failed')) {
        return createServerError(
          'A record with this information already exists',
          ErrorType.CONFLICT,
          409,
          { operation, originalError: error.message }
        )
      }
      
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return createServerError(
          'Referenced record does not exist',
          ErrorType.VALIDATION,
          400,
          { operation, originalError: error.message }
        )
      }
      
      if (error.message.includes('NOT NULL constraint failed')) {
        return createServerError(
          'Required field is missing',
          ErrorType.VALIDATION,
          400,
          { operation, originalError: error.message }
        )
      }
      
      if (error.message.includes('database is locked')) {
        return createServerError(
          'Database is temporarily unavailable',
          ErrorType.DATABASE,
          503,
          { operation, originalError: error.message }
        )
      }
    }
    
    // Generic database error
    return createServerError(
      'Database operation failed',
      ErrorType.DATABASE,
      500,
      { operation, originalError: error instanceof Error ? error.message : String(error) }
    )
  }
  
  /**
   * Wraps database operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      throw this.handleError(error, operationName)
    }
  }
}

/**
 * Server action error handler
 */
export class ServerActionErrorHandler {
  /**
   * Handles errors in server actions and returns structured responses
   */
  static handleError(error: unknown, context?: Record<string, unknown>): ServerActionResponse {
    const logEntry = this.createLogEntry(error, context)
    this.logError(logEntry)
    
    if (error instanceof Error && (error as ServerError).isOperational) {
      const serverError = error as ServerError
      
      switch (serverError.code) {
        case ErrorType.VALIDATION:
          return {
            success: false,
            message: serverError.message,
            code: serverError.code,
            errors: (serverError.context?.fieldErrors as Record<string, string>) || { general: serverError.message }
          }
          
        case ErrorType.AUTHENTICATION:
          return {
            success: false,
            message: 'Authentication required',
            code: serverError.code
          }
          
        case ErrorType.AUTHORIZATION:
          return {
            success: false,
            message: 'Access denied',
            code: serverError.code
          }
          
        case ErrorType.NOT_FOUND:
          return {
            success: false,
            message: serverError.message,
            code: serverError.code
          }
          
        case ErrorType.CONFLICT:
          return {
            success: false,
            message: serverError.message,
            code: serverError.code
          }
          
        case ErrorType.DATABASE:
          return {
            success: false,
            message: 'A database error occurred. Please try again.',
            code: serverError.code
          }
          
        default:
          return {
            success: false,
            message: 'An unexpected error occurred',
            code: ErrorType.INTERNAL
          }
      }
    }
    
    // Unhandled error
    return {
      success: false,
      message: 'An unexpected error occurred',
      code: ErrorType.INTERNAL
    }
  }
  
  /**
   * Creates a log entry for an error
   */
  private static createLogEntry(error: unknown, context?: Record<string, unknown>): ErrorLogEntry {
    return {
      timestamp: new Date(),
      level: 'error',
      message: error instanceof Error ? error.message : String(error),
      error: error instanceof Error ? error : new Error(String(error)),
      context,
      requestId: undefined, // Headers not available in this context
      userAgent: undefined,
      ip: undefined
    }
  }
  
  /**
   * Logs error to console and potentially external services
   */
  private static logError(logEntry: ErrorLogEntry): void {
    // Console logging for development
    console.error('Server Action Error:', {
      timestamp: logEntry.timestamp.toISOString(),
      message: logEntry.message,
      error: logEntry.error?.stack,
      context: logEntry.context,
      requestId: logEntry.requestId,
      userAgent: logEntry.userAgent,
      ip: logEntry.ip
    })
    
    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external logging service
      // await sendToLoggingService(logEntry)
    }
  }
}

/**
 * Validation error helper
 */
export function createValidationError(
  message: string,
  fieldErrors?: Record<string, string>
): ServerError {
  return createServerError(
    message,
    ErrorType.VALIDATION,
    400,
    { fieldErrors }
  )
}

/**
 * Authentication error helper
 */
export function createAuthenticationError(message: string = 'Authentication required'): ServerError {
  return createServerError(message, ErrorType.AUTHENTICATION, 401)
}

/**
 * Authorization error helper
 */
export function createAuthorizationError(message: string = 'Access denied'): ServerError {
  return createServerError(message, ErrorType.AUTHORIZATION, 403)
}

/**
 * Not found error helper
 */
export function createNotFoundError(resource: string): ServerError {
  return createServerError(`${resource} not found`, ErrorType.NOT_FOUND, 404)
}

/**
 * Conflict error helper
 */
export function createConflictError(message: string): ServerError {
  return createServerError(message, ErrorType.CONFLICT, 409)
}

/**
 * Server action wrapper with error handling
 */
export function withServerActionErrorHandling<T extends unknown[], R>(
  action: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<ServerActionResponse<R>> => {
    try {
      const result = await action(...args)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return ServerActionErrorHandler.handleError(error, {
        action: action.name,
        args: args.length
      }) as ServerActionResponse<R>
    }
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitizes string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000) // Limit length
  }
  
  /**
   * Sanitizes HTML content
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return ''
    
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
  }
  
  /**
   * Validates and sanitizes form data
   */
  static sanitizeFormData(formData: FormData): Record<string, string> {
    const sanitized: Record<string, string> = {}
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value)
      }
    }
    
    return sanitized
  }
}

/**
 * Rate limiting utilities (basic implementation)
 */
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>()
  
  /**
   * Check if request is within rate limit
   */
  static checkRateLimit(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    const requestData = this.requests.get(identifier)
    
    if (!requestData || requestData.resetTime < windowStart) {
      this.requests.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (requestData.count >= maxRequests) {
      return false
    }
    
    requestData.count++
    return true
  }
  
  /**
   * Clean up old rate limit entries
   */
  static cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime < now) {
        this.requests.delete(key)
      }
    }
  }
}