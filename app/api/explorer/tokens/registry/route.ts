import { NextResponse } from "next/server"
import { getTokenRegistry, getCacheTimestamp, CACHE_KEYS } from "@/lib/horizon-fetcher"
import { getHiddenTokenIds, getTokenMetadata } from "@/lib/admin/tokenStore"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const allTokens = await getTokenRegistry()
    const hiddenIds = await getHiddenTokenIds()
    const cacheTimestamp = getCacheTimestamp(CACHE_KEYS.TOKEN_REGISTRY)

    // Filter out hidden tokens and enforce ADMIN-ONLY metadata
    const visibleTokens = await Promise.all(
      allTokens
        .filter(token => !hiddenIds.includes(token.id))
        .map(async (token) => {
          const metadata = await getTokenMetadata(token.id)
          
          // ENFORCE: Admin Dashboard is the ONLY source of truth
          // Remove ALL fallbacks, auto-verify logic, and inferred values
          return {
            ...token,
            // Verification: ONLY from admin, no auto-verify
            verified: metadata.verified,
            // Logo: ONLY from admin, no fallbacks or generated icons
            logoUrl: metadata.logoUrl || null,
            // Category: ONLY from admin, no horizon-fetcher registry
            category: metadata.category || null,
            // Description: ONLY from admin
            description: metadata.description || null,
            // URLs: ONLY from admin
            tradeUrl: metadata.tradeUrl || null,
            appUrl: metadata.appUrl || null,
            // Token Metrics: ONLY from admin
            circulatingSupply: metadata.circulatingSupply || null,
            totalSupply: metadata.totalSupply || null,
            marketCap: metadata.marketCap || null,
            // Social Media: ONLY from admin
            website: metadata.website || null,
            twitter: metadata.twitter || null,
            telegram: metadata.telegram || null
          }
        })
    )

    return new NextResponse(JSON.stringify(visibleTokens), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=300", // 10min cache, 5min stale
        "X-Cache-Timestamp": cacheTimestamp ? new Date(cacheTimestamp).toISOString() : "fresh",
      },
    })
  } catch (error) {
    console.error("Error fetching token registry:", error)
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
  }
}
