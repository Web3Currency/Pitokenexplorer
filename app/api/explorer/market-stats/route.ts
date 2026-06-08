import { NextResponse } from "next/server"
import { getMarketStats } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stats = await getMarketStats()

    return new NextResponse(JSON.stringify(stats), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60", // 5min cache, 1min stale
      },
    })
  } catch (error) {
    console.error("Error fetching market stats:", error)
    return NextResponse.json({ error: "Failed to fetch market stats" }, { status: 500 })
  }
}
