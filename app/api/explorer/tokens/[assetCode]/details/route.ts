import { NextResponse } from "next/server"
import { getTokenDetails } from "@/lib/horizon-fetcher"
import { getTokenMetadata } from "@/lib/admin/tokenStore"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ assetCode: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const assetIssuer = searchParams.get("issuer")
    const { assetCode } = await params

    if (!assetIssuer) {
      return NextResponse.json({ error: "Issuer is required" }, { status: 400 })
    }

    const details = await getTokenDetails(assetCode, assetIssuer)
    
    // Get custom metadata from admin store
    const tokenId = `${assetCode}:${assetIssuer}`
    const metadata = await getTokenMetadata(tokenId)
    
    // Merge metadata with details
    const enrichedDetails = {
      ...details,
      circulatingSupply: metadata.circulatingSupply || details.circulatingSupply,
      totalSupply: metadata.totalSupply || details.totalSupply,
      marketCap: metadata.marketCap,
      website: metadata.website,
      twitter: metadata.twitter,
      telegram: metadata.telegram,
      description: metadata.description || details.description,
    }

    return new NextResponse(JSON.stringify(enrichedDetails), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120, stale-while-revalidate=60", // 2min cache, 1min stale
      },
    })
  } catch (error) {
    console.error("Error fetching token details:", error)
    return NextResponse.json({ error: "Failed to fetch token details" }, { status: 500 })
  }
}
