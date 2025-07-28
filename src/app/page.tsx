import { ChoreTrackerServer } from "@/components/chore-tracker/ChoreTrackerServer"
import { Suspense } from "react"
import SuccessMessage from "@/components/chore-tracker/SuccessMessage"

// This page requires authentication and database access, so it must be dynamic
export const dynamic = 'force-dynamic'

export default function ChoreTracker() {
  return (
    <>
      <Suspense fallback={null}>
        <SuccessMessage />
      </Suspense>
      <ChoreTrackerServer />
    </>
  )
}
