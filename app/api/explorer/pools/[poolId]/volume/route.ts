import { NextResponse } from "next/server"
import { getExplorerPoolVolume } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET(request: Request, { params }: { params: Promise<{ poolId: string }> }) {
  try {
    const { poolId } = await params
    if (!poolId) return NextResponse.json({error:"Pool ID is required"},{status:400})
    return NextResponse.json(await getExplorerPoolVolume(poolId),{headers:{"Cache-Control":"public, max-age=600, stale-while-revalidate=300"}})
  } catch (error) { console.error("[explorer] Supabase pool volume failed:",error); return NextResponse.json({error:"Failed to fetch pool volume"},{status:500}) }
}
