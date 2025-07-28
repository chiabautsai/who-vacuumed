"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { AddChoreTypeDialog } from "./AddChoreTypeDialog"

interface EmptyChoreTypesStateProps {
  onAddChoreType?: () => void
}

/**
 * Component to display when there are no chore types configured
 * Provides guidance and actions for users to get started
 */
export function EmptyChoreTypesState({ onAddChoreType }: EmptyChoreTypesStateProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Chore Types Found</CardTitle>
          <CardDescription>
            Get started by adding your first chore type to begin tracking household tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Common chore types include:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-2 py-1 bg-muted rounded-md text-xs">Vacuuming</span>
              <span className="px-2 py-1 bg-muted rounded-md text-xs">Dishes</span>
              <span className="px-2 py-1 bg-muted rounded-md text-xs">Laundry</span>
              <span className="px-2 py-1 bg-muted rounded-md text-xs">Cleaning</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <AddChoreTypeDialog
              onChoreTypeAdded={onAddChoreType}
              trigger={
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Chore Type
                </Button>
              }
            />
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/log-chore">
                <Users className="h-4 w-4 mr-2" />
                Log a Chore
              </Link>
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Once you add chore types, you&apos;ll see your household&apos;s chore completion timeline here.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}