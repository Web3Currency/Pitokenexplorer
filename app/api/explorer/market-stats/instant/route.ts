import { NextResponse } from "next/server"
import { getMarketStatsInstant } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

/**
 * Instant market stats endpoint - returns immediately without 24h calculations
 * New endpoint for non-blocking initial render
 */
export async function GET() {
  try {
    const stats = await getMarketStatsInstant()

    return new NextResponse(JSON.stringify(stats), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60", // 5min cache, 1min stale
      },
    })
  } catch (error) {
    console.error("Error fetching instant market stats:", error)
    return NextResponse.json({ error: "Failed to fetch market stats" }, { status: 500 })
  }
}
