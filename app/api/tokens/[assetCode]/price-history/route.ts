import { NextResponse } from "next/server"
import { getTokenPriceHistory } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

/**
 * GET /api/tokens/:assetCode/price-history
 * Fetches price history for a token from Token/PI pool swaps
 *
 * Query params:
 * - issuer: Token issuer address (required)
 *
 * Returns:
 * - 24h: hourly price buckets
 * - 7d: daily price buckets
 * - 30d: daily price buckets
 *
 * Price = last executed swap price per bucket (PI_amount / token_amount)
 * Empty arrays indicate no swap activity for that period
 */
export async function GET(request: Request, { params }: { params: Promise<{ assetCode: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const assetIssuer = searchParams.get("issuer")
    const { assetCode } = await params

    if (!assetIssuer) {
      return NextResponse.json({ error: "Issuer is required" }, { status: 400 })
    }

    const priceHistory = await getTokenPriceHistory(assetCode, assetIssuer)

    return new NextResponse(JSON.stringify(priceHistory), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600, stale-while-revalidate=300", // 10min cache, 5min stale
      },
    })
  } catch (error) {
    console.error("Error fetching token price history:", error)
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 })
  }
}
