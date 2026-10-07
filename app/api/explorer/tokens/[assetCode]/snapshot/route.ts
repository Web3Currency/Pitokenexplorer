import { NextResponse } from "next/server"
import { getExplorerTokenSnapshot } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET(request: Request, { params }: { params: Promise<{ assetCode: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const issuer = searchParams.get("issuer")
    const { assetCode } = await params
    if (!issuer) return NextResponse.json({ error:"Issuer is required" }, { status:400 })
    const snapshot = await getExplorerTokenSnapshot(assetCode,issuer)
    return NextResponse.json(snapshot,{headers:{"Cache-Control":"public, max-age=30, stale-while-revalidate=30"}})
  } catch (error) { console.error("[explorer] Supabase token snapshot failed:",error); return NextResponse.json({error:"Failed to fetch token snapshot"},{status:500}) }
}
