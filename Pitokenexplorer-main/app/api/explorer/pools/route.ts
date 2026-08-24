import { NextResponse } from "next/server"
import { getProcessedPools } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const pools = await getProcessedPools()

    return new NextResponse(JSON.stringify(pools), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900, stale-while-revalidate=300", // 15min cache, 5min stale
      },
    })
  } catch (error) {
    console.error("Error fetching pools:", error)
    return NextResponse.json({ error: "Failed to fetch pools" }, { status: 500 })
  }
}
