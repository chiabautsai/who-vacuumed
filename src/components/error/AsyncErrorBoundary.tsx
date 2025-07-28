"use client"

import React, { ReactNode, useEffect, useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface AsyncErrorBoundaryState {
  asyncError?: Error
}

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

/**
 * Error boundary that also handles async errors and promise rejections
 * Useful for catching errors in async operations that don't bubble up to React
 */
export function AsyncErrorBoundary({ 
  children, 
  fallback, 
  onError 
}: AsyncErrorBoundaryProps) {
  const [asyncError, setAsyncError] = useState<Error | undefined>()

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      console.error('Unhandled promise rejection:', error)
      setAsyncError(error)
      
      if (onError) {
        onError(error)
      }
      
      // Prevent the default browser behavior
      event.preventDefault()
    }

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error instanceof Error 
        ? event.error 
        : new Error(event.message)
      
      console.error('Uncaught error:', error)
      setAsyncError(error)
      
      if (onError) {
        onError(error)
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [onError])

  // If we have an async error, throw it so the ErrorBoundary can catch it
  if (asyncError) {
    throw asyncError
  }

  return (
    <ErrorBoundary 
      fallback={fallback} 
      onError={(error, errorInfo) => {
        if (onError) {
          onError(error)
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Hook for handling async errors in components
 */
export function useAsyncError() {
  const [, setError] = useState<Error>()
  
  return (error: Error) => {
    setError(() => {
      throw error
    })
  }
}