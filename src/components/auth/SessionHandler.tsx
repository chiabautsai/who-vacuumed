'use client'

import { useUser } from '@/contexts/UserContext'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Client component that handles session expiration and provides user feedback
 */
export function SessionHandler() {
  const { isSessionExpired, error, refreshUser, isLoading } = useUser()
  const [showExpiredMessage, setShowExpiredMessage] = useState(false)

  useEffect(() => {
    if (isSessionExpired) {
      setShowExpiredMessage(true)
    }
  }, [isSessionExpired])

  const handleRetry = async () => {
    try {
      await refreshUser()
      setShowExpiredMessage(false)
    } catch (error) {
      console.error('Failed to refresh user session:', error)
    }
  }

  const handleLoginRedirect = () => {
    window.location.href = '/auth/login'
  }

  if (!showExpiredMessage && !isSessionExpired) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle>Session Expired</CardTitle>
          <CardDescription>
            Your session has expired. Please log in again to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </>
              )}
            </Button>
            <Button 
              onClick={handleLoginRedirect} 
              className="flex-1"
            >
              Log In Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}