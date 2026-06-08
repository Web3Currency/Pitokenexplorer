import { NextRequest, NextResponse } from "next/server"
import { getAllQuests, updateQuestStatus, type QuestStatus } from "@/lib/admin/questStore"

export async function GET() {
  try {
    const quests = await getAllQuests()
    return NextResponse.json(quests)
  } catch (error) {
    console.error("[v0] Error fetching quests:", error)
    return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
    }

    const success = await updateQuestStatus(id, status as QuestStatus)

    if (success) {
      return NextResponse.json({ success: true, message: "Quest status updated" })
    } else {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("[v0] Error updating quest:", error)
    return NextResponse.json({ error: "Failed to update quest" }, { status: 500 })
  }
}
