import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import type { User } from "@/types/chore"

interface LegendProps {
  users: User[]
}

export function Legend({ users }: LegendProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Info className="h-5 w-5 mr-2" />
          Legend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">House Members</h4>
            <div className="flex flex-wrap gap-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 ${user.color} rounded`} />
                  <span className="text-sm">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Completion Levels</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-muted border border-border rounded-sm" />
                <span className="text-sm">No completion</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-muted border border-border rounded-sm relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-500" style={{ height: "50%" }} />
                </div>
                <span className="text-sm">Partial completion (height = completion %)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 border border-border rounded-sm" />
                <span className="text-sm">Full completion</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 border border-border rounded-sm relative">
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full border border-background" />
                </div>
                <span className="text-sm">Has comments</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}