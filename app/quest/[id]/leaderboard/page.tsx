"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import { UserRankCard } from "@/components/user-rank-card"
import { LeaderboardList } from "@/components/leaderboard-list"
import { useUser } from "@/lib/user-context"

interface LeaderboardEntry {
  rank: number
  username: string
  questXP: number
  userId: string
}

interface LeaderboardData {
  currentUserRank: {
    rank: number
    username: string
    questXP: number
  } | null
  entries: LeaderboardEntry[]
}

export default function LeaderboardPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    currentUserRank: null,
    entries: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const url = user?.uid 
          ? `/api/quest/${params.id}/leaderboard?userId=${user.uid}`
          : `/api/quest/${params.id}/leaderboard`
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setLeaderboardData(data)
        }
      } catch (error) {
        console.error('[v0] Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeaderboard()
  }, [params.id, user])

  const handleBackClick = () => {
    // Always navigate back to the quest detail page
    // This ensures predictable behavior and prevents navigation loops
    router.push(`/quest/${params.id}?from=leaderboard`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-wide">Leaderboard</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 max-w-2xl mx-auto space-y-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && (
            <div>
              {/* Header Section */}
              <div>
                <h2 className="text-xl font-bold mb-2">Quest Rankings</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  XP represents your contribution and proof of work within this quest. Final W3C/PI coin rewards are distributed proportionally based on your XP ranking at the end of the campaign.
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Higher XP score = higher rank = larger share of the reward pool
                </p>
              </div>

              {/* Current User Card (Pinned) */}
              {leaderboardData.currentUserRank && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground px-1">YOUR POSITION</p>
                  <UserRankCard
                    rank={leaderboardData.currentUserRank.rank}
                    username={leaderboardData.currentUserRank.username}
                    questXP={leaderboardData.currentUserRank.questXP}
                  />
                </div>
              )}

              {/* Participants List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground px-1">ALL PARTICIPANTS</p>
                {leaderboardData.entries.length > 0 ? (
                  <LeaderboardList
                    entries={leaderboardData.entries.map((entry) => ({
                      rank: entry.rank,
                      username: entry.username,
                      questXP: entry.questXP,
                    }))}
                    currentUserRank={leaderboardData.currentUserRank?.rank}
                  />
                ) : (
                  <div className="border border-border rounded-lg p-8 text-center bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      No participants yet. Be the first to complete tasks!
                    </p>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="border border-accent/30 bg-accent/5 rounded-lg p-4">
                <p className="text-xs font-semibold text-foreground mb-2">HOW REWARDS ARE DISTRIBUTED</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• XP Score is earned by completing and claiming tasks</li>
                  <li>• Your ranking determines your share of the total W3C/PI reward pool</li>
                  <li>• Higher XP score = larger reward allocation</li>
                  <li>• All rewards are paid in actual tokens W3C/PI</li>
                  <li>• Top 3 ranked participants earn special badges</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
