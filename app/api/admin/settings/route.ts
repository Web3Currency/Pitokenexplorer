import { NextRequest, NextResponse } from "next/server"
import { getSettings, updateSettings, resetSettings } from "@/lib/admin/settingsStore"

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("[v0] Failed to get settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json()
    
    await updateSettings(updates)
    
    return NextResponse.json({ success: true, message: "Settings updated successfully" })
  } catch (error) {
    console.error("[v0] Failed to update settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await resetSettings()
    
    return NextResponse.json({ success: true, message: "Settings reset to defaults" })
  } catch (error) {
    console.error("[v0] Failed to reset settings:", error)
    return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 })
  }
}
