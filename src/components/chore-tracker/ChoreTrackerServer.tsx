import { getUsersAction, getChoreTypesAction, getChoreDataAction } from '@/lib/actions/chore-actions'
import { getCurrentUserAction } from '@/lib/actions/user-actions'
import { ChoreTrackerClient } from './ChoreTrackerClient'
import { EmptyChoreTypesState } from './EmptyChoreTypesState'
import { Navigation } from './Navigation'
import { TIMELINE_CONFIG } from '@/constants/chore'

export async function ChoreTrackerServer() {
  // Fetch initial data on the server
  const [usersResponse, choreTypesResponse, currentUser] = await Promise.all([
    getUsersAction(),
    getChoreTypesAction(),
    getCurrentUserAction()
  ])

  // Handle potential errors in data fetching
  if (!usersResponse.success || !choreTypesResponse.success) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Failed to load initial data. Please refresh the page.</p>
      </div>
    )
  }

  const users = usersResponse.data || []
  const choreTypes = choreTypesResponse.data || []

  // If no chore types exist, show empty state with consistent navigation
  if (choreTypes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={currentUser} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Chore Tracker Dashboard</h1>
            <p className="text-muted-foreground mt-2">Track and manage household chores</p>
          </div>
          
          <EmptyChoreTypesState />
        </div>
      </div>
    )
  }

  // Calculate initial date range (showing latest dates by default)
  const today = new Date()
  const startDate = new Date(today)
  const defaultVisibleDays = 30
  const defaultScrollOffset = Math.max(0, TIMELINE_CONFIG.TOTAL_DAYS - defaultVisibleDays)
  startDate.setDate(today.getDate() - TIMELINE_CONFIG.TOTAL_DAYS + 1 + defaultScrollOffset)

  // Fetch initial chore data
  const choreDataResponse = await getChoreDataAction(startDate, defaultVisibleDays, choreTypes)
  
  if (!choreDataResponse.success) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Failed to load chore data. Please refresh the page.</p>
      </div>
    )
  }

  const initialChoreData = choreDataResponse.data || {}

  return (
    <ChoreTrackerClient
      initialUsers={users}
      initialChoreTypes={choreTypes}
      initialChoreData={initialChoreData}
      initialScrollOffset={defaultScrollOffset}
      initialVisibleDays={defaultVisibleDays}
      currentUser={currentUser}
    />
  )
}