import { NextResponse } from "next/server"
import { getExplorerStats } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const s:any = await getExplorerStats()
    return NextResponse.json({ liquidityChange:s?.liquidity_change ?? null, volume24hChange:s?.volume_24h_change ?? null, totalVolume24h:s?.total_volume_24h_pi == null ? null : Number(s.total_volume_24h_pi).toLocaleString()+" π", tokenCountChange:null, newTokens7d:s?.new_tokens_7d ?? 0 }, { headers:{ "Cache-Control":"public, max-age=300, stale-while-revalidate=60" }})
  } catch (error) { console.error("[explorer] Supabase deferred stats failed:",error); return NextResponse.json({error:"Failed to fetch market stats changes"},{status:500}) }
}
