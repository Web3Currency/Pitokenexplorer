import { NextResponse } from "next/server"
import { getExplorerPools } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET() {
  try { return NextResponse.json(await getExplorerPools(), { headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=300" } }) }
  catch (error) { console.error("[explorer] Supabase pools failed:", error); return NextResponse.json({ error: "Failed to fetch pools" }, { status: 500 }) }
}
