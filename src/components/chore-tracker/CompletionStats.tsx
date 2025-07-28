import type { ChoreData, User, ChoreType, CompletionStats as StatsType } from "@/types/chore"

interface CompletionStatsProps {
  choreData: Record<string, ChoreData[]>
  users: User[]
  choreTypes: ChoreType[]
  visibleDays: number
}

export function CompletionStats({ choreData, users, choreTypes, visibleDays }: CompletionStatsProps) {
  const calculateStats = (): StatsType => {
    const totalCompletions = Object.values(choreData).reduce(
      (total, choreTypeData) =>
        total + choreTypeData.reduce((choreTotal, day) => choreTotal + day.completions.length, 0),
      0,
    )

    const completedDays = Object.values(choreData).reduce(
      (total, choreTypeData) => total + choreTypeData.filter((day) => day.completions.length > 0).length,
      0,
    )
    const completionRate = Math.round((completedDays / (choreTypes.length * visibleDays)) * 100)

    const mostActiveChore = choreTypes.length > 0 
      ? choreTypes
          .reduce((mostActive, choreType) => {
            const completions =
              choreData[choreType.name]?.reduce((total, day) => total + day.completions.length, 0) || 0
            const currentMostCompletions =
              choreData[mostActive.name]?.reduce((total, day) => total + day.completions.length, 0) || 0
            return completions > currentMostCompletions ? choreType : mostActive
          }, choreTypes[0])
          .name.split(" ")[0]
      : "None"

    const mostActiveMember = users.length > 0
      ? users
          .reduce((mostActive, user) => {
            const userCompletions = Object.values(choreData).reduce(
              (total, choreTypeData) =>
                total +
                choreTypeData.reduce(
                  (choreTotal, day) =>
                    choreTotal + day.completions.filter((c) => c.userId === user.id).length,
                  0,
                ),
              0,
            )
            const currentMostCompletions = Object.values(choreData).reduce(
              (total, choreTypeData) =>
                total +
                choreTypeData.reduce(
                  (choreTotal, day) =>
                    choreTotal + day.completions.filter((c) => c.userId === mostActive.id).length,
                  0,
                ),
              0,
            )
            return userCompletions > currentMostCompletions ? user : mostActive
          }, users[0])
          .name.split(" ")[0]
      : "None"

    return {
      totalCompletions,
      completionRate,
      mostActiveChore,
      mostActiveMember,
    }
  }

  const stats = calculateStats()

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-foreground">{stats.totalCompletions}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Total Completions</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-foreground">{stats.completionRate}%</div>
          <div className="text-xs md:text-sm text-muted-foreground">Completion Rate</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-foreground">{stats.mostActiveChore}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Most Active Chore</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-foreground">{stats.mostActiveMember}</div>
          <div className="text-xs md:text-sm text-muted-foreground">Most Active Member</div>
        </div>
      </div>
    </div>
  )
}