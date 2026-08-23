import { NextResponse } from "next/server"
import { getTokenDetails } from "@/lib/horizon-fetcher"

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

    return new NextResponse(JSON.stringify(details), {
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
