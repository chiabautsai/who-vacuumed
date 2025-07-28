"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { logChoreAction } from "@/lib/actions/chore-actions"
import { useFormValidation, useNetworkError } from "@/hooks/useFormValidation"
import { validationRules, formatErrorMessage, isNetworkError } from "@/lib/utils/error-utils"
import { AsyncErrorBoundary } from "@/components/error/AsyncErrorBoundary"
import { LoadingIndicator } from "@/components/chore-tracker/LoadingStates"
import { AlertCircle, Wifi, WifiOff } from "lucide-react"
import type { ChoreType } from "@/lib/db/types"

interface ChoreLogFormProps {
  choreTypes: ChoreType[]
}

const completionOptions = [
  { value: "1", label: "Complete (100%)" },
  { value: "0.75", label: "Three Quarters (75%)" },
  { value: "0.67", label: "Two Thirds (67%)" },
  { value: "0.5", label: "Half (50%)" },
  { value: "0.33", label: "One Third (33%)" },
  { value: "0.25", label: "One Quarter (25%)" },
]

interface ChoreFormData extends Record<string, unknown> {
  choreTypeId: string
  completionPercentage: string
  comments: string
}

/**
 * Enhanced client component for chore logging form with comprehensive error handling
 * Handles form state, validation, network errors, and submission with retry logic
 */
function ChoreLogFormContent({ choreTypes }: ChoreLogFormProps) {
  const router = useRouter()
  const { isOnline, retryCount, retry, resetRetry } = useNetworkError()
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [networkError, setNetworkError] = useState<string>("")

  // Form validation configuration
  const {
    values,
    errors,
    isValid,
    isSubmitting,
    touched,
    setValue,
    setError,
    setErrors,
    clearErrors,
    setTouched,
    setSubmitting,
    validateAll,
    reset,
    handleSubmit
  } = useFormValidation<ChoreFormData>({
    initialValues: {
      choreTypeId: "",
      completionPercentage: "",
      comments: "",
    },
    validationRules: {
      choreTypeId: validationRules.required,
      completionPercentage: (value) => {
        if (!value) return 'Please select completion status'
        const num = parseFloat(String(value))
        if (isNaN(num) || num < 0 || num > 1) {
          return 'Invalid completion percentage'
        }
        return null
      },
      comments: (value) => {
        if (value && String(value).length > 500) {
          return 'Comments must be less than 500 characters'
        }
        return null
      }
    },
    validateOnChange: false,
    validateOnBlur: true
  })

  // Handle form submission with enhanced error handling
  const onSubmit = handleSubmit(async (formValues) => {
    setNetworkError("")
    setSuccessMessage("")
    clearErrors()
    resetRetry()

    try {
      // Create FormData for server action
      const formDataObj = new FormData()
      formDataObj.append('choreTypeId', formValues.choreTypeId)
      formDataObj.append('completionPercentage', formValues.completionPercentage)
      formDataObj.append('comments', formValues.comments)

      // Call server action
      const result = await logChoreAction(formDataObj)

      if (result.success) {
        // Show success message
        setSuccessMessage(result.message || "Chore logged successfully!")
        
        // Reset form
        reset()
        
        // Redirect to dashboard after a brief delay to show success message
        setTimeout(() => {
          router.push("/?success=chore-logged")
        }, 1500)
      } else {
        // Handle server-side validation errors
        if (result.errors) {
          setErrors(result.errors)
        } else {
          setError('general' as keyof ChoreFormData, result.message || "Failed to log chore. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error logging chore:", error)
      
      if (isNetworkError(error)) {
        setNetworkError(formatErrorMessage(error))
      } else {
        setError('general' as keyof ChoreFormData, formatErrorMessage(error))
      }
    }
  })

  // Handle retry for network errors
  const handleRetry = () => {
    retry()
    onSubmit()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chore Details</CardTitle>
        <CardDescription>Fill out the information below to log your completed chore</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Network Status Indicator */}
        {!isOnline && (
          <div className="mb-4 p-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md dark:text-amber-200 dark:bg-amber-900/20 dark:border-amber-800 flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            You&apos;re currently offline. Please check your connection.
          </div>
        )}

        {/* Network Error with Retry */}
        {networkError && (
          <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              {networkError}
            </div>
            <Button 
              onClick={handleRetry} 
              size="sm" 
              variant="outline"
              disabled={isSubmitting}
            >
              <Wifi className="h-3 w-3 mr-1" />
              Retry {retryCount > 0 && `(${retryCount})`}
            </Button>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md dark:text-green-200 dark:bg-green-900/20 dark:border-green-800">
              {successMessage}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.general}
            </div>
          )}

          {/* Loading Indicator */}
          {isSubmitting && (
            <LoadingIndicator 
              state="loading" 
              message="Submitting chore entry"
              className="mb-4"
            />
          )}

          {/* Chore Type */}
          <div className="space-y-2">
            <Label htmlFor="choreType">Chore Type *</Label>
            <Select
              value={values.choreTypeId}
              onValueChange={(value) => {
                setValue('choreTypeId', value)
                setTouched('choreTypeId')
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.choreTypeId ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a chore type" />
              </SelectTrigger>
              <SelectContent>
                {choreTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.choreTypeId && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.choreTypeId}
              </p>
            )}
          </div>

          {/* Completion Status */}
          <div className="space-y-2">
            <Label htmlFor="completionStatus">Completion Status *</Label>
            <Select
              value={values.completionPercentage}
              onValueChange={(value) => {
                setValue('completionPercentage', value)
                setTouched('completionPercentage')
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.completionPercentage ? "border-destructive" : ""}>
                <SelectValue placeholder="How much did you complete?" />
              </SelectTrigger>
              <SelectContent>
                {completionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.completionPercentage && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.completionPercentage}
              </p>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Any additional notes about the chore..."
              value={values.comments}
              onChange={(e) => {
                setValue('comments', e.target.value)
                setTouched('comments')
              }}
              onBlur={() => setTouched('comments')}
              disabled={isSubmitting}
              rows={3}
              className={errors.comments ? "border-destructive" : ""}
            />
            {errors.comments && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.comments}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {values.comments.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !isOnline} 
              className="flex-1"
            >
              {isSubmitting ? "Logging Chore..." : "Log Chore"}
            </Button>
            <Link href="/">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Main export with error boundary wrapper
 */
export default function ChoreLogForm({ choreTypes }: ChoreLogFormProps) {
  return (
    <AsyncErrorBoundary
      fallback={
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-destructive">Form Error</CardTitle>
            <CardDescription>
              There was an error loading the chore logging form. Please refresh the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      }
      onError={(error) => {
        console.error('ChoreLogForm error:', error)
      }}
    >
      <ChoreLogFormContent choreTypes={choreTypes} />
    </AsyncErrorBoundary>
  )
}