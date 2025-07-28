import { TrendsServer } from '@/components/chore-tracker/TrendsServer'
import { Navigation } from '@/components/chore-tracker/Navigation'
import { getCurrentUserAction } from '@/lib/actions/user-actions'

// Force dynamic rendering since we use Auth0 session
export const dynamic = 'force-dynamic'

export default async function Trends() {
  // Get current user for navigation
  const user = await getCurrentUserAction()

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Trends & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Detailed insights into your household chore patterns and statistics.
          </p>
        </div>

        <TrendsServer />
      </div>
    </div>
  )
}
