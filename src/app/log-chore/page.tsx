import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { ChoreTypeService } from '@/lib/db/services/chore-type-service'
import { getCurrentUserAction } from '@/lib/actions/user-actions'
import ChoreLogForm from '@/components/chore-tracker/ChoreLogForm'
import { Navigation } from '@/components/chore-tracker/Navigation'
import { NoChoreTypesForLogging } from '@/components/chore-tracker/NoChoreTypesForLogging'

// Force dynamic rendering since we use Auth0 session
export const dynamic = 'force-dynamic'

/**
 * Server component that fetches chore types from database and renders the chore logging form
 * Protected by authentication - redirects to login if not authenticated
 */
export default async function LogChore() {
  // Fetch chore types from database
  const choreTypes = await ChoreTypeService.findAllActive()
  
  // Get current user for navigation
  const user = await getCurrentUserAction()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Log Chore</h1>
            <p className="text-muted-foreground mt-2">Record a completed household task</p>
          </div>

          {choreTypes.length === 0 ? (
            <NoChoreTypesForLogging />
          ) : (
            <ChoreLogForm choreTypes={choreTypes} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
