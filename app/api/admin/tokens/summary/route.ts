import { NextResponse } from "next/server"
import { getTokensWithVisibility } from "@/lib/admin/tokenStore"

export const dynamic = "force-dynamic"

/**
 * Get summary of admin token configuration
 * Useful for debugging and verification
 */
export async function GET() {
  try {
    const tokens = await getTokensWithVisibility()
    
    const summary = {
      totalTokens: tokens.length,
      verifiedTokens: tokens.filter(t => t.verified).length,
      tokensWithLogo: tokens.filter(t => t.logoUrl).length,
      tokensWithDescription: tokens.filter(t => t.description).length,
      tokensWithMetrics: tokens.filter(t => t.circulatingSupply || t.totalSupply || t.marketCap).length,
      tokensWithSocial: tokens.filter(t => t.website || t.twitter || t.telegram).length,
      tokensWithTradeUrl: tokens.filter(t => t.tradeUrl).length,
      tokensWithAppUrl: tokens.filter(t => t.appUrl).length,
      sampleTokens: tokens.slice(0, 3).map(t => ({
        symbol: t.symbol,
        verified: t.verified,
        hasLogo: !!t.logoUrl,
        hasDescription: !!t.description,
        hasMetrics: !!(t.circulatingSupply || t.totalSupply || t.marketCap),
        hasSocial: !!(t.website || t.twitter || t.telegram),
        hasTradeUrl: !!t.tradeUrl,
        hasAppUrl: !!t.appUrl
      }))
    }
    
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error getting admin token summary:", error)
    return NextResponse.json({ error: "Failed to get summary" }, { status: 500 })
  }
}
