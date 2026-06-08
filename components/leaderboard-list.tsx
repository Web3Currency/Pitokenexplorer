"use client"

import { useMemo } from "react"
import { Medal } from "lucide-react"

interface LeaderboardEntryProps {
  rank: number
  username: string
  questXP: number
  isCurrentUser?: boolean
}

function LeaderboardEntry({ rank, username, questXP, isCurrentUser }: LeaderboardEntryProps) {
  const getRankColor = () => {
    if (rank === 1) return "text-yellow-500"
    if (rank === 2) return "text-gray-400"
    if (rank === 3) return "text-orange-600"
    return "text-muted-foreground"
  }

  const getRankIcon = () => {
    if (rank === 1 || rank === 2 || rank === 3) {
      return <Medal className={`h-4 w-4 ${getRankColor()}`} />
    }
    return null
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors ${
        isCurrentUser
          ? "bg-primary/5 border-primary/30"
          : "bg-card border-border hover:border-accent/50 hover:bg-card/80"
      }`}
    >
      {/* Rank Badge */}
      <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
        {getRankIcon() ? (
          getRankIcon()
        ) : (
          <span className={`text-sm font-bold ${getRankColor()}`}>#{rank}</span>
        )}
      </div>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrentUser ? "text-primary font-semibold" : "text-foreground"}`}>
          {username}
          {isCurrentUser && <span className="ml-2 text-xs text-primary font-bold">(YOU)</span>}
        </p>
      </div>

      {/* XP Display */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
          {Math.round(questXP).toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">XP</p>
      </div>
    </div>
  )
}

interface LeaderboardListProps {
  entries: Array<{
    rank: number
    username: string
    questXP: number
  }>
  currentUserRank?: number
}

export function LeaderboardList({ entries, currentUserRank }: LeaderboardListProps) {
  const sortedEntries = useMemo(
    () =>
      entries.sort((a, b) => {
        if (b.questXP !== a.questXP) return b.questXP - a.questXP
        return a.rank - b.rank
      }),
    [entries]
  )

  return (
    <div className="space-y-2">
      {sortedEntries.map((entry) => (
        <LeaderboardEntry
          key={entry.rank}
          rank={entry.rank}
          username={entry.username}
          questXP={entry.questXP}
          isCurrentUser={entry.rank === currentUserRank}
        />
      ))}
    </div>
  )
}
