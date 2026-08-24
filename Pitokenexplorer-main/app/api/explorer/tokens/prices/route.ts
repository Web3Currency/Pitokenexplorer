import { NextResponse } from "next/server"
import { getAllTokenPrices } from "@/lib/horizon-fetcher"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const prices = await getAllTokenPrices()

    return new NextResponse(JSON.stringify(prices), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120, stale-while-revalidate=30", // 2min cache, 30s stale
      },
    })
  } catch (error) {
    console.error("Error fetching token prices:", error)
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
}
