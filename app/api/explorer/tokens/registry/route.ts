import { NextResponse } from "next/server"
import { getExplorerTokens } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET() {
  try { return NextResponse.json(await getExplorerTokens(), { headers: { "Cache-Control": "public, max-age=600, stale-while-revalidate=300" } }) }
  catch (error) { console.error("[explorer] Supabase token registry failed:", error); return NextResponse.json({ error: "Failed to fetch token registry" }, { status: 500 }) }
}
