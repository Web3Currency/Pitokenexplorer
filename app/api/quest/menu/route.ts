import { NextResponse } from "next/server"

interface QuestHistory {
  id: string
  title: string
  completedAt: string
  reward: string
}

interface QuestProgress {
  totalCompleted: number
  totalAvailable: number
  totalRewardsEarned: string
  currentStreak: number
}

interface QuestMenuResponse {
  history: QuestHistory[]
  progress: QuestProgress
}

export async function GET() {
  // Return empty data (admin disabled)
  const response: QuestMenuResponse = {
    history: [],
    progress: {
      totalCompleted: 0,
      totalAvailable: 0,
      totalRewardsEarned: "0π",
      currentStreak: 0,
    },
  }

  return NextResponse.json(response)
}
