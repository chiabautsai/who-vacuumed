"use client"

import { useState, useCallback, useEffect } from 'react'
import { validateFormData, validationRules } from '@/lib/utils/error-utils'

export interface ValidationRule {
  (value: unknown): string | null
}

export interface FormValidationConfig<T> {
  initialValues: T
  validationRules: Partial<Record<keyof T, ValidationRule>>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export interface FormValidationReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  isValid: boolean
  isSubmitting: boolean
  touched: Partial<Record<keyof T, boolean>>
  setValue: (field: keyof T, value: unknown) => void
  setValues: (values: Partial<T>) => void
  setError: (field: keyof T, error: string) => void
  setErrors: (errors: Partial<Record<keyof T, string>>) => void
  clearError: (field: keyof T) => void
  clearErrors: () => void
  setTouched: (field: keyof T, touched?: boolean) => void
  setSubmitting: (submitting: boolean) => void
  validate: (field?: keyof T) => boolean
  validateAll: () => boolean
  reset: () => void
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>
}

/**
 * Enhanced form validation hook with comprehensive error handling
 */
export function useFormValidation<T extends Record<string, unknown>>({
  initialValues,
  validationRules: rules,
  validateOnChange = false,
  validateOnBlur = true
}: FormValidationConfig<T>): FormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues)
  const [errors, setErrorsState] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate if form is valid
  const isValid = Object.keys(errors).length === 0

  // Set individual field value
  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValuesState(prev => ({ ...prev, [field]: value }))
    
    if (validateOnChange && rules[field]) {
      const error = rules[field]!(value)
      if (error) {
        setErrorsState(prev => ({ ...prev, [field]: error }))
      } else {
        setErrorsState(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }
  }, [rules, validateOnChange])

  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }))
  }, [])

  // Set individual error
  const setError = useCallback((field: keyof T, error: string) => {
    setErrorsState(prev => ({ ...prev, [field]: error }))
  }, [])

  // Set multiple errors
  const setErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrorsState(prev => ({ ...prev, ...newErrors }))
  }, [])

  // Clear individual error
  const clearError = useCallback((field: keyof T) => {
    setErrorsState(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrorsState({})
  }, [])

  // Set touched state
  const setTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }))
  }, [])

  // Set submitting state
  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting)
  }, [])

  // Validate single field
  const validate = useCallback((field?: keyof T) => {
    if (!field || !rules[field]) return true
    
    const error = rules[field]!(values[field])
    if (error) {
      setError(field, error)
      return false
    } else {
      clearError(field)
      return true
    }
  }, [values, rules, setError, clearError])

  // Validate all fields
  const validateAll = useCallback(() => {
    const validationErrors = validateFormData(values, rules as Record<string, (value: unknown) => string | null>)
    setErrors(validationErrors as Partial<Record<keyof T, string>>)
    return Object.keys(validationErrors).length === 0
  }, [values, rules, setErrors])

  // Reset form
  const reset = useCallback(() => {
    setValuesState(initialValues)
    setErrorsState({})
    setTouchedState({})
    setIsSubmitting(false)
  }, [initialValues])

  // Handle form submission
  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void> | void) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      setIsSubmitting(true)
      
      try {
        // Validate all fields before submission
        if (!validateAll()) {
          return
        }

        await onSubmit(values)
      } catch (error) {
        console.error('Form submission error:', error)
        // Error handling is left to the onSubmit function
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validateAll])

  return {
    values,
    errors,
    isValid,
    isSubmitting,
    touched,
    setValue,
    setValues,
    setError,
    setErrors,
    clearError,
    clearErrors,
    setTouched,
    setSubmitting,
    validate,
    validateAll,
    reset,
    handleSubmit
  }
}

/**
 * Hook for handling network errors and retry logic
 */
export function useNetworkError() {
  const [isOnline, setIsOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1)
  }, [])

  const resetRetry = useCallback(() => {
    setRetryCount(0)
  }, [])

  return {
    isOnline,
    retryCount,
    retry,
    resetRetry
  }
}