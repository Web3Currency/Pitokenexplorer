"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X, Trophy, UserPlus, Loader2 } from "lucide-react"
import { QuestStatsCard } from "@/components/quest-stats-card"
import { QuestIntroSection } from "@/components/quest-intro-section"
import { QuestTaskCategory } from "@/components/quest-task-category"
import { QuestTaskModal } from "@/components/quest-task-modal"
import { LeaderboardModal } from "@/components/leaderboard-modal"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"

interface QuestData {
  id: string
  title: string
  description: string
  projectName: string
  projectLogo: string
  bannerUrl: string
  rewardPool: string
  projectIntro: string
  instructions: string
  totalParticipants: number
  timeRemainingDD: number
  timeRemainingHH: number
  timeRemainingMM: number
  categories: any[]
}

interface LeaderboardData {
  currentUserRank: number
  entries: any[]
}

export default function QuestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [questData, setQuestData] = useState<QuestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [userXP, setUserXP] = useState(0)

  // Fetch quest details and enrollment status
  useEffect(() => {
    const fetchQuestDetails = async () => {
      try {
        const response = await fetch(`/api/quest/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Quest not found")
          } else if (response.status === 403) {
            setError("This quest is not available yet")
          } else {
            setError("Failed to load quest")
          }
          setLoading(false)
          return
        }
        
        const data = await response.json()
        setQuestData(data)
        
        // Check enrollment status if user is authenticated
        if (user?.uid) {
          const enrollResponse = await fetch(`/api/quest/${params.id}/enroll?userId=${user.uid}`)
          if (enrollResponse.ok) {
            const enrollData = await enrollResponse.json()
            setIsEnrolled(enrollData.enrolled)
            if (enrollData.enrollment) {
              setUserXP(enrollData.enrollment.totalXP)
            }
          }
        }
      } catch (err) {
        console.error("[v0] Failed to fetch quest details:", err)
        setError("Failed to load quest")
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuestDetails()
  }, [params.id, user])

  const selectedTaskData = questData?.categories
    .flatMap((cat) => cat.tasks)
    .find((task) => task.id === selectedTask)

  const handleCloseQuest = () => {
    // Navigate back to quest home
    router.push('/?tab=quest')
  }

  const handleLeaderboardClick = () => {
    setIsLeaderboardOpen(true)
  }

  const handleOpenModal = (taskId: string) => {
    setSelectedTask(taskId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleBackClick = () => {
    router.back()
  }

  const handleEnroll = async () => {
    if (!user?.uid || !user?.username) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Pi Network to join this quest",
        variant: "destructive",
      })
      return
    }

    try {
      setEnrolling(true)
      const response = await fetch(`/api/quest/${params.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          username: user.username,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enroll')
      }

      setIsEnrolled(true)
      toast({
        title: "Successfully Joined!",
        description: "You can now complete tasks and earn XP",
      })
    } catch (error) {
      console.error('[v0] Enrollment error:', error)
      toast({
        title: "Enrollment Failed",
        description: "Could not join quest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEnrolling(false)
    }
  }

  const handleTaskComplete = async (taskId: string, proof: string, xpReward: number) => {
    if (!user?.uid || !user?.username) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete tasks",
        variant: "destructive",
      })
      return
    }

    if (!isEnrolled) {
      toast({
        title: "Join Quest First",
        description: "You must join the quest before completing tasks",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/quest/${params.id}/complete-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          userId: user.uid,
          username: user.username,
          proof,
          proofType: 'screenshot',
          xpEarned: xpReward,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete task')
      }

      setUserXP(prev => prev + xpReward)
      toast({
        title: "Task Completed!",
        description: data.message || `+${xpReward} XP earned`,
      })
      
      handleCloseModal()
    } catch (error) {
      console.error('[v0] Task completion error:', error)
      toast({
        title: "Task Completion Failed",
        description: error instanceof Error ? error.message : "Could not complete task",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Close Button and Leaderboard Icon */}
      <div className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center justify-between px-4">
          <h1 className="text-lg font-semibold tracking-wide flex-1">{questData?.title}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLeaderboardClick}
              title="View Leaderboard"
              className="text-muted-foreground hover:text-foreground"
            >
              <Trophy className="w-5 h-5 text-orange-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseQuest}
              title="Close quest detail"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 max-w-2xl mx-auto space-y-6">
          {/* Enrollment Banner */}
          {!isEnrolled && (
            <div className="border-2 border-primary bg-primary/5 rounded-lg p-4 space-y-3">
              <div>
                <h3 className="font-bold text-lg">Join This Quest</h3>
                <p className="text-sm text-muted-foreground">
                  Enroll to complete tasks, earn XP, and compete for rewards
                </p>
              </div>
              <Button 
                onClick={handleEnroll} 
                disabled={enrolling || !user?.uid}
                className="w-full gap-2"
              >
                {enrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Join Quest
                  </>
                )}
              </Button>
              {!user?.uid && (
                <p className="text-xs text-center text-muted-foreground">
                  Sign in with Pi Network to join
                </p>
              )}
            </div>
          )}

          {/* 1. Quest Stats Card */}
          <QuestStatsCard
            totalParticipants={questData?.totalParticipants}
            timeDD={questData?.timeRemainingDD}
            timeHH={questData?.timeRemainingHH}
            timeMM={questData?.timeRemainingMM}
            userXP={userXP}
          />

          {/* 2. Project Identity & Intro */}
          <QuestIntroSection
            projectLogo={questData?.projectLogo}
            projectName={questData?.projectName}
            intro={questData?.projectIntro}
            rewardPool={questData?.rewardPool}
            instructions={questData?.instructions}
          />

          {/* 3. Task Section - Categorized Tasks */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold px-1">Tasks</h2>
            {questData?.categories.map((category) => (
              <QuestTaskCategory
                key={category.type}
                label={category.label}
                type={category.type}
                tasks={category.tasks}
                onOpenModal={handleOpenModal}
              />
            ))}
          </div>

          {/* Completion Encouragement */}
          {questData?.categories.length > 0 && (
            <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-foreground">
                Complete all tasks to maximize your XP score and reward eligibility!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {questData?.rewardPool} in W3C/PI rewards distributed based on final XP rankings
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Task Detail Modal */}
      {selectedTaskData && (
        <QuestTaskModal
          isOpen={isModalOpen}
          taskTitle={selectedTaskData.title}
          taskDescription={selectedTaskData.description}
          taskType={selectedTaskData.type}
          xpReward={selectedTaskData.xpReward}
          onClose={handleCloseModal}
          onSubmit={(proof) => {
            handleTaskComplete(selectedTaskData.id, proof, selectedTaskData.xpReward)
          }}
        />
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        open={isLeaderboardOpen}
        onOpenChange={setIsLeaderboardOpen}
        currentUserRank={0}
        leaderboardEntries={[]}
      />
    </div>
  )
}
