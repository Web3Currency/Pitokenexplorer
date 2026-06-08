"use client"

import { Users, Clock, Zap } from "lucide-react"

interface QuestStatsCardProps {
  totalParticipants: number
  timeDD: number
  timeHH: number
  timeMM: number
  userXP: number
}

export function QuestStatsCard({
  totalParticipants,
  timeDD,
  timeHH,
  timeMM,
  userXP,
}: QuestStatsCardProps) {
  return (
    <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-border bg-card">
      {/* Participants Section */}
      <div className="flex flex-col items-center justify-center p-6 border-r border-border hover:bg-card/80 transition-colors">
        <Users className="h-6 w-6 mb-3 text-purple-600" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Participants</p>
        <p className="text-2xl font-bold mt-2">{totalParticipants.toLocaleString()}</p>
      </div>

      {/* Time Left Section */}
      <div className="flex flex-col items-center justify-center p-6 border-r border-border hover:bg-card/80 transition-colors">
        <Clock className="h-6 w-6 mb-3 text-purple-600" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time Left</p>
        <p className="text-2xl font-bold mt-2 font-mono">
          {String(timeDD).padStart(2, "0")}:{String(timeHH).padStart(2, "0")}:{String(timeMM).padStart(2, "0")}
        </p>
      </div>

      {/* Your XP Section */}
      <div className="flex flex-col items-center justify-center p-6 hover:bg-card/80 transition-colors">
        <Zap className="h-6 w-6 mb-3 text-purple-600 shadow-none" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">XP Score</p>
        <p className="text-2xl font-bold mt-2">{userXP.toLocaleString()}</p>
        
      </div>
    </div>
  )
}
