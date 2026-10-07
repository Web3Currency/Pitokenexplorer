import { NextResponse } from "next/server"
import { getExplorerPriceHistory } from "@/lib/supabase-explorer"
export const dynamic = "force-dynamic"
export async function GET(request:Request,{params}:{params:Promise<{assetCode:string}>}) {
 try {const {assetCode}=await params;const issuer=new URL(request.url).searchParams.get("issuer");if(!issuer)return NextResponse.json({error:"Issuer is required"},{status:400});return NextResponse.json(await getExplorerPriceHistory(assetCode,issuer),{headers:{"Cache-Control":"public, max-age=600, stale-while-revalidate=300"}})}
 catch(error){console.error("[explorer] Supabase price history failed:",error);return NextResponse.json({error:"Failed to fetch price history"},{status:500})}
}
