import { NextResponse } from "next/server"
import { getTokenSnapshot } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ assetCode: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const assetIssuer = searchParams.get("issuer")
    const { assetCode } = await params
    if (!assetIssuer) return NextResponse.json({ error: "Issuer is required" }, { status: 400 })
    const snapshot = await getTokenSnapshot(assetCode, assetIssuer)
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=30" } })
  } catch (error) {
    console.error("Error fetching token snapshot:", error)
    return NextResponse.json({ error: "Failed to fetch token snapshot" }, { status: 500 })
  }
}
