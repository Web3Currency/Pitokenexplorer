import { NextRequest, NextResponse } from "next/server"
import { getQuestById } from "@/lib/admin/questStore"
import { getQuestParticipantCount } from "@/lib/admin/enrollmentStore"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quest = await getQuestById(params.id)
    
    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      )
    }
    
    // Only return quest if it's live
    if (quest.status !== "live") {
      return NextResponse.json(
        { error: "Quest not available" },
        { status: 403 }
      )
    }
    
    // Get participant count
    const participantCount = await getQuestParticipantCount(params.id)
    
    // Calculate time remaining
    let timeRemaining = { days: 0, hours: 0, minutes: 0 }
    if (quest.endsAt) {
      const now = new Date()
      const end = new Date(quest.endsAt)
      const diff = end.getTime() - now.getTime()
      
      if (diff > 0) {
        timeRemaining = {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        }
      }
    }
    
    // Format response with full quest details
    const response = {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      projectName: quest.projectName,
      projectLogo: quest.projectLogo,
      bannerUrl: quest.bannerUrl,
      rewardPool: quest.rewardPool,
      projectIntro: quest.data?.projectIntro || '',
      instructions: quest.data?.instructions || '',
      totalParticipants: participantCount,
      timeRemainingDD: timeRemaining.days,
      timeRemainingHH: timeRemaining.hours,
      timeRemainingMM: timeRemaining.minutes,
      categories: quest.data?.categories || [],
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[v0] Error fetching quest details:', error)
    return NextResponse.json(
      { error: "Failed to fetch quest" },
      { status: 500 }
    )
  }
}
