import { auth0 } from '@/lib/auth/auth0'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Server component that protects routes by checking for valid Auth0 session
 * Redirects to login if no session is found
 */
export default async function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  try {
    const session = await auth0.getSession()
    
    if (!session?.user) {
      redirect('/auth/login')
    }

    return <>{children}</>
  } catch (error) {
    console.error('Error checking authentication:', error)
    
    // If there's an error checking the session, show fallback or redirect
    if (fallback) {
      return <>{fallback}</>
    }
    
    redirect('/auth/login')
  }
}