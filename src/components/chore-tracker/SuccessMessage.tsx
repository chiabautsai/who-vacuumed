"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Client component to display success messages based on URL search parameters
 * Automatically dismisses after a few seconds and cleans up the URL
 */
export default function SuccessMessage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const success = searchParams.get('success')
    
    if (success === 'chore-logged') {
      setMessage("Chore logged successfully!")
      setShowMessage(true)
      
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setShowMessage(false)
        // Clean up URL parameter
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        router.replace(url.pathname + url.search, { scroll: false })
      }, 4000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  if (!showMessage) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg shadow-lg dark:text-green-200 dark:bg-green-900/20 dark:border-green-800">
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <button
            onClick={() => setShowMessage(false)}
            className="ml-3 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}