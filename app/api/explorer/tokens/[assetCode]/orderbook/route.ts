import { NextResponse } from "next/server"
import { getExplorerTokenSnapshot } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET(request: Request,{params}:{params:Promise<{assetCode:string}>}) {
 try { const {assetCode}=await params; const issuer=new URL(request.url).searchParams.get("issuer"); if(!assetCode||!issuer)return NextResponse.json({error:"asset and issuer are required"},{status:400}); const s=await getExplorerTokenSnapshot(assetCode,issuer); return NextResponse.json(s.orderBook) }
 catch(error){console.error("[explorer] Supabase orderbook failed:",error);return NextResponse.json({error:"Failed to fetch order book"},{status:500})}
}
