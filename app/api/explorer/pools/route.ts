import { NextResponse } from "next/server"
import { getProcessedPools } from "@/lib/horizon-fetcher"
import { getHiddenPoolIds } from "@/lib/admin/poolStore"
import { getHiddenTokenIds } from "@/lib/admin/tokenStore"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const pools = await getProcessedPools()
    const hiddenPoolIds = await getHiddenPoolIds()
    const hiddenTokenIds = await getHiddenTokenIds()

    // Filter out hidden pools and pools using hidden tokens
    const visiblePools = pools.filter((pool) => {
      const tokenId = `${pool.tokenCode}:${pool.tokenIssuer}`
      const isPoolHidden = hiddenPoolIds.includes(pool.id)
      const isTokenHidden = hiddenTokenIds.includes(tokenId)
      
      return !isPoolHidden && !isTokenHidden
    })

    return new NextResponse(JSON.stringify(visiblePools), {
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
