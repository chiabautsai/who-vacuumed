/**
 * Utility functions for error handling and network error detection
 */

export interface NetworkError extends Error {
  code?: string
  status?: number
  isNetworkError: boolean
}

export interface ValidationError {
  field: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string>
  code?: string
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Checks if an error is a network-related error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  if (error instanceof Error) {
    // Check for common network error patterns
    const networkErrorPatterns = [
      'fetch',
      'network',
      'connection',
      'timeout',
      'offline',
      'econnrefused',
      'enotfound',
      'etimedout'
    ]
    
    const errorMessage = error.message.toLowerCase()
    const hasNetworkPattern = networkErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    )
    
    // Check if it's a custom NetworkError
    const isCustomNetworkError = 'isNetworkError' in error && Boolean(error.isNetworkError)
    
    return hasNetworkPattern || isCustomNetworkError
  }
  
  return false
}

/**
 * Creates a standardized network error
 */
export function createNetworkError(
  message: string, 
  code?: string, 
  status?: number
): NetworkError {
  const error = new Error(message) as NetworkError
  error.code = code
  error.status = status
  error.isNetworkError = true
  return error
}

/**
 * Checks if the user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Creates a promise that rejects after a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(createNetworkError(
          `Request timed out after ${timeoutMs}ms`,
          'TIMEOUT'
        ))
      }, timeoutMs)
    })
  ])
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Don't retry non-network errors
      if (!isNetworkError(lastError)) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Formats error messages for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (isNetworkError(error)) {
      if (!isOnline()) {
        return 'You appear to be offline. Please check your internet connection.'
      }
      return 'Network error. Please check your connection and try again.'
    }
    
    return error.message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Validates form data and returns validation errors
 */
export function validateFormData(
  data: Record<string, unknown>,
  rules: Record<string, (value: unknown) => string | null>
): Record<string, string> {
  const errors: Record<string, string> = {}
  
  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(data[field])
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required'
    }
    return null
  },
  
  email: (value: string) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Please enter a valid email address'
  },
  
  minLength: (min: number) => (value: string) => {
    if (!value) return null
    return value.length >= min ? null : `Must be at least ${min} characters`
  },
  
  maxLength: (max: number) => (value: string) => {
    if (!value) return null
    return value.length <= max ? null : `Must be no more than ${max} characters`
  },
  
  numeric: (value: string) => {
    if (!value) return null
    return !isNaN(Number(value)) ? null : 'Must be a valid number'
  },
  
  percentage: (value: string) => {
    if (!value) return null
    const num = parseFloat(value)
    return !isNaN(num) && num >= 0 && num <= 1 
      ? null 
      : 'Must be a valid percentage between 0 and 100'
  }
}

/**
 * Debounce function for reducing API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}