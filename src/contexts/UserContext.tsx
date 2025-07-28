'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser as useAuth0User } from '@auth0/nextjs-auth0'
import type { User } from '@/lib/db/types'

interface UserContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  isSessionExpired: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: auth0User, isLoading: auth0Loading, error: auth0Error } = useAuth0User()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  const fetchUser = async () => {
    if (!auth0User?.sub) {
      setUser(null)
      setIsLoading(false)
      setIsSessionExpired(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setIsSessionExpired(false)

      // Sync user with database and get the database user
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0Id: auth0User.sub,
          email: auth0User.email,
          name: auth0User.name,
          picture: auth0User.picture,
        }),
      })

      if (!response.ok) {
        // Check if it's an authentication error (401/403)
        if (response.status === 401 || response.status === 403) {
          setIsSessionExpired(true)
          setUser(null)
          // Redirect to login after a short delay to allow UI to show session expired message
          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 2000)
          return
        }
        throw new Error('Failed to sync user')
      }

      const userData = await response.json()
      setUser(userData)
    } catch (err) {
      console.error('Error fetching user:', err)
      
      // Check if it's a network error that might indicate session issues
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setIsSessionExpired(true)
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load user')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  useEffect(() => {
    if (auth0Loading) {
      setIsLoading(true)
      return
    }

    if (auth0Error) {
      setError(auth0Error.message)
      setIsLoading(false)
      return
    }

    fetchUser()
  }, [auth0User, auth0Loading, auth0Error])

  const value: UserContextType = {
    user,
    isLoading: isLoading || auth0Loading,
    error: error || (auth0Error?.message ?? null),
    refreshUser,
    isSessionExpired,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}