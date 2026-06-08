import { NextResponse } from "next/server"
import { getMarketStatsDeferred } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

/**
 * Deferred market stats endpoint - 24h changes (slow calculations)
 * New endpoint for async 24h change calculations
 */
export async function GET() {
  try {
    const stats = await getMarketStatsDeferred()

    return new NextResponse(JSON.stringify(stats), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60", // 5min cache, 1min stale
      },
    })
  } catch (error) {
    console.error("Error fetching deferred market stats:", error)
    return NextResponse.json({ error: "Failed to fetch market stats changes" }, { status: 500 })
  }
}
