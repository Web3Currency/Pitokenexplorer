import { NextResponse } from "next/server"
import { getLiveQuests } from "@/lib/admin/questStore"

export async function GET() {
  try {
    // Get only live quests for public display
    const liveQuests = await getLiveQuests()

    const quests = liveQuests.map((quest) => {
      // Determine quest status based on dates
      const now = new Date()
      const liveAt = quest.liveAt ? new Date(quest.liveAt) : null
      const endsAt = quest.endsAt ? new Date(quest.endsAt) : null

      let status = "ongoing"
      if (liveAt && liveAt > now) {
        status = "upcoming"
      } else if (endsAt && endsAt < now) {
        status = "finished"
      }

      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        bannerUrl: quest.bannerUrl,
        projectName: quest.projectName,
        projectLogo: quest.projectLogo,
        status,
        participants: quest.data?.participants || 0,
        rewardPool: quest.rewardPool,
        liveAt: quest.liveAt || new Date().toISOString(),
      }
    })

    return NextResponse.json({
      quests,
      dailyQuests: [],
      weeklyQuests: [],
      specialQuests: [],
    })
  } catch (error) {
    console.error("[v0] Error fetching quests:", error)
    return NextResponse.json({
      quests: [],
      dailyQuests: [],
      weeklyQuests: [],
      specialQuests: [],
    })
  }
}
