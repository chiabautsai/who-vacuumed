import { UserService } from '@/lib/db/services/user-service'
import type { NewUser } from '@/lib/db/types'
import { nanoid } from 'nanoid'

/**
 * Synchronizes Auth0 user data with the local database
 * This function should be called whenever a user authenticates
 */
export async function syncUserWithDatabase(auth0User: {
  sub: string
  email: string
  name: string
  picture?: string
}): Promise<void> {
  try {
    const userData: NewUser = {
      id: nanoid(),
      auth0Id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name,
      picture: auth0User.picture || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await UserService.upsert(userData)
  } catch (error) {
    console.error('Failed to sync user with database:', error)
    throw new Error('User synchronization failed')
  }
}

/**
 * Gets the current user from the database based on Auth0 ID
 */
export async function getCurrentUser(auth0Id: string) {
  try {
    return await UserService.findByAuth0Id(auth0Id)
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}