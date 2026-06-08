import { Card } from "@/components/ui/card"
import { Crown, Medal } from "lucide-react"

interface UserRankCardProps {
  rank: number
  username: string
  questXP: number
}

export function UserRankCard({ rank, username, questXP }: UserRankCardProps) {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />
      default:
        return null
    }
  }

  return (
    <Card className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-r from-primary/10 to-primary/5 p-4">
      {/* Highlight background */}
      <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-primary to-transparent" />

      <div className="relative flex items-center justify-between gap-4">
        {/* Rank Badge */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 flex-shrink-0">
          {getRankIcon() || <span className="text-sm font-bold text-primary">#{rank}</span>}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{username}</p>
          <p className="text-xs text-muted-foreground">Your Position</p>
        </div>

        {/* XP Display */}
        <div className="flex flex-col items-end gap-1">
          <p className="text-lg font-bold text-primary">{Math.round(questXP).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">XP</p>
        </div>
      </div>
    </Card>
  )
}
