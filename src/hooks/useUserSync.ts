'use client'

import { useUser } from '@/contexts/UserContext'
import { useUser as useAuth0User } from '@auth0/nextjs-auth0'
import { useEffect } from 'react'

/**
 * Hook to ensure user is synchronized with the database
 * This hook automatically syncs the user when Auth0 authentication changes
 */
export function useUserSync() {
  const { user, isLoading, error, refreshUser } = useUser()
  const { user: auth0User, isLoading: auth0Loading } = useAuth0User()

  // Auto-sync when Auth0 user changes
  useEffect(() => {
    if (!auth0Loading && auth0User && !user && !isLoading) {
      refreshUser()
    }
  }, [auth0User, auth0Loading, user, isLoading, refreshUser])

  return {
    user,
    isLoading: isLoading || auth0Loading,
    error,
    refreshUser,
    isAuthenticated: !!auth0User && !!user,
  }
}