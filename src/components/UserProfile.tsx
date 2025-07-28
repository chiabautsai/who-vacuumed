import { auth0 } from '@/lib/auth/auth0'
import { syncCurrentUser } from '@/lib/actions/user-actions'
import { redirect } from 'next/navigation'

export default async function UserProfile() {
  const session = await auth0.getSession()
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  // Sync user with database on server side
  const user = await syncCurrentUser()

  if (!user) {
    return (
      <div className="text-red-600">
        Failed to sync user with database
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center space-x-4">
        {user.picture && (
          <img 
            src={user.picture} 
            alt={user.name}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div>
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
      </div>
    </div>
  )
}