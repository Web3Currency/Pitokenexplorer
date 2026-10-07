import { NextResponse } from "next/server"
import { getExplorerStats } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const s:any = await getExplorerStats()
    return NextResponse.json(s ? { liquidity: Number(s.liquidity ?? 0).toLocaleString()+" π", tokenCount:s.token_count ?? 0, poolCount:s.pool_count ?? 0, largestPool:s.largest_pool ?? "—", largestPoolLiquidity:Number(s.largest_pool_liquidity ?? 0).toLocaleString(), activePools:s.active_pools ?? 0, network:s.network ?? "Testnet" } : null, { headers:{ "Cache-Control":"public, max-age=300, stale-while-revalidate=60" }})
  } catch (error) { console.error("[explorer] Supabase instant stats failed:",error); return NextResponse.json({error:"Failed to fetch market stats"},{status:500}) }
}
