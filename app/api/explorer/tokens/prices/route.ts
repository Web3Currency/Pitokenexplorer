import { NextResponse } from "next/server"
import { getExplorerPrices } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET() {
  try { return NextResponse.json(await getExplorerPrices(), { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=30" } }) }
  catch (error) { console.error("[explorer] Supabase token prices failed:", error); return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 }) }
}
