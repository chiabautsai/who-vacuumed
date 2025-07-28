"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { AddChoreTypeDialog } from "./AddChoreTypeDialog"

/**
 * Component to display when user tries to log a chore but no chore types exist
 * Provides guidance and actions to resolve the situation
 */
export function NoChoreTypesForLogging() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <CardTitle>No Chore Types Available</CardTitle>
        <CardDescription>
          You need to set up chore types before you can log completed chores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Chore types help organize and track different household tasks like:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Vacuuming</li>
            <li>Washing dishes</li>
            <li>Doing laundry</li>
            <li>Cleaning bathrooms</li>
          </ul>
        </div>
        
        <div className="flex flex-col gap-2">
          <AddChoreTypeDialog
            trigger={
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Set Up Chore Types
              </Button>
            }
          />
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          Once you&apos;ve added chore types, you&apos;ll be able to log your completed tasks here.
        </div>
      </CardContent>
    </Card>
  )
}