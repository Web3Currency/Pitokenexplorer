"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { UserRankCard } from "@/components/user-rank-card"
import { LeaderboardList } from "@/components/leaderboard-list"
import { useUser } from "@/lib/user-context"

interface LeaderboardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserRank?: {
    rank: number
    username: string
    questXP: number
  }
  leaderboardEntries?: Array<{
    rank: number
    username: string
    questXP: number
  }>
}

export function LeaderboardModal({
  open,
  onOpenChange,
}: LeaderboardModalProps) {
  const params = useParams()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [currentUserRank, setCurrentUserRank] = useState<any>(null)
  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([])

  useEffect(() => {
    if (open && params?.id) {
      fetchLeaderboard()
    }
  }, [open, params?.id, user])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const url = user?.uid 
        ? `/api/quest/${params.id}/leaderboard?userId=${user.uid}`
        : `/api/quest/${params.id}/leaderboard`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCurrentUserRank(data.currentUserRank)
        setLeaderboardEntries(data.entries || [])
      }
    } catch (error) {
      console.error('[v0] Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto w-full max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold"> LEADERBOARD</DialogTitle>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              XP represents your contribution and proof of work within this quest. Final W3C/PI coin rewards are distributed proportionally based on your XP ranking at the end of the campaign.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1 text-center">
              Higher XP score = higher rank = larger share of the reward pool
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="shrink-0 h-8 w-8"
          >
            <span className="sr-only">Close leaderboard</span>
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && leaderboardEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No participants yet. Be the first to join!</p>
            </div>
          )}

          {!loading && leaderboardEntries.length > 0 && (
            <div className="space-y-6 py-4">
              {/* Current User Card (Pinned) */}
              {currentUserRank && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground px-1">YOUR POSITION</p>
                  <UserRankCard
                    rank={currentUserRank.rank}
                    username={currentUserRank.username}
                    questXP={currentUserRank.questXP}
                  />
                </div>
              )}

              {/* Leaderboard List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground px-1">RANKINGS</p>
                <LeaderboardList entries={leaderboardEntries} currentUserRank={currentUserRank?.rank} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
