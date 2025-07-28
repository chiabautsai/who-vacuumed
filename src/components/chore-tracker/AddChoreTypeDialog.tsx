"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { useFormValidation } from "@/hooks/useFormValidation"
import { validationRules } from "@/lib/utils/error-utils"
import { createChoreTypeAction } from "@/lib/actions/chore-actions"

interface AddChoreTypeDialogProps {
  onChoreTypeAdded?: () => void
  trigger?: React.ReactNode
}

interface ChoreTypeFormData extends Record<string, unknown> {
  name: string
  description: string
}

/**
 * Dialog component for adding new chore types
 * Provides a form to create new chore types with validation
 */
export function AddChoreTypeDialog({ onChoreTypeAdded, trigger }: AddChoreTypeDialogProps) {
  const [open, setOpen] = useState(false)

  const {
    values,
    errors,
    isSubmitting,
    setValue,
    setSubmitting,
    reset,
    handleSubmit
  } = useFormValidation<ChoreTypeFormData>({
    initialValues: {
      name: "",
      description: "",
    },
    validationRules: {
      name: validationRules.required,
      description: (value) => {
        if (value && String(value).length > 200) {
          return 'Description must be less than 200 characters'
        }
        return null
      }
    },
    validateOnChange: false,
    validateOnBlur: true
  })

  const onSubmit = handleSubmit(async (formValues) => {
    try {
      // Create FormData for server action
      const formData = new FormData()
      formData.append('name', String(formValues.name))
      formData.append('description', String(formValues.description))

      // Call server action to create chore type
      const result = await createChoreTypeAction(formData)

      if (result.success) {
        // Reset form and close dialog
        reset()
        setOpen(false)
        
        // Notify parent component
        if (onChoreTypeAdded) {
          onChoreTypeAdded()
        }
        
        // Refresh page to show new chore type
        window.location.reload()
      } else {
        // Handle server-side validation errors
        if (result.errors) {
          // Set field-specific errors
          Object.entries(result.errors).forEach(([field, message]) => {
            if (field !== 'general') {
              setValue(field as keyof ChoreTypeFormData, formValues[field as keyof ChoreTypeFormData])
            }
          })
        }
        
        // Show general error message
        alert(result.message || 'Failed to create chore type. Please try again.')
      }
      
    } catch (error) {
      console.error('Error creating chore type:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  })

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Chore Type
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Chore Type</DialogTitle>
          <DialogDescription>
            Create a new chore type to track household tasks. This will be available for logging chores.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Vacuuming, Dishes, Laundry"
              value={values.name}
              onChange={(e) => setValue('name', e.target.value)}
              disabled={isSubmitting}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this chore type..."
              value={values.description}
              onChange={(e) => setValue('description', e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {String(values.description).length}/200 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Chore Type
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}