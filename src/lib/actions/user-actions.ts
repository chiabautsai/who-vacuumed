'use server'

import { auth0 } from '@/lib/auth/auth0'
import { syncUserWithDatabase, getCurrentUser } from '@/lib/auth/user-sync'
import { redirect } from 'next/navigation'

/**
 * Server action to sync the current authenticated user with the database
 * This can be called from server components or client components
 */
export async function syncCurrentUser() {
  try {
    const session = await auth0.getSession()
    
    if (!session?.user) {
      redirect('/auth/login')
    }

    // Sync user with database
    await syncUserWithDatabase({
      sub: session.user.sub,
      email: session.user.email || '',
      name: session.user.name || '',
      picture: session.user.picture,
    })

    // Return the synced user
    const user = await getCurrentUser(session.user.sub)
    return user
  } catch (error) {
    console.error('Failed to sync current user:', error)
    throw new Error('User synchronization failed')
  }
}

/**
 * Server action to get the current user from the database
 */
export async function getCurrentUserAction() {
  try {
    const session = await auth0.getSession()
    
    if (!session?.user) {
      return null
    }

    return await getCurrentUser(session.user.sub)
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Server action to handle user logout
 * This will clear the session and redirect to the logout URL
 */
export async function logoutAction() {
  // Redirect to Auth0 logout endpoint which will clear the session
  // and redirect back to the application
  // Note: redirect() throws an error in Next.js, which is expected behavior
  redirect('/auth/logout')
}