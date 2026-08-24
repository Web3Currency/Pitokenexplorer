import { NextResponse } from "next/server"
import { getPoolVolume } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ poolId: string }> }) {
  try {
    const { poolId } = await params

    if (!poolId) {
      return NextResponse.json({ error: "Pool ID is required" }, { status: 400 })
    }

    const volumeData = await getPoolVolume(poolId)

    return new NextResponse(JSON.stringify(volumeData), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=300", // 10min cache, 5min stale
      },
    })
  } catch (error) {
    console.error("Error fetching pool volume:", error)
    return NextResponse.json({ error: "Failed to fetch pool volume" }, { status: 500 })
  }
}
