import { NextResponse } from "next/server"
import { getTokenRegistry } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

/**
 * Explorer Token Registry
 * Fetches tokens from Horizon via the working getTokenRegistry() function
 */
export async function GET() {
  try {
    const tokens = await getTokenRegistry()
    
    return new NextResponse(JSON.stringify(tokens), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching token registry:", error)
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
  }
}
