import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-client"

export const dynamic = "force-dynamic"

/**
 * Explorer Token Registry - ONLY fetches from Supabase admin_tokens
 * 
 * Data flow:
 * 1. Admin clicks "Fetch & Sync Tokens" in /admin/explorer
 * 2. Admin API endpoint (/api/admin/tokens/sync) fetches from Horizon
 * 3. Tokens saved to admin_tokens table in Supabase
 * 4. Explorer fetches ONLY from admin_tokens (is_hidden = false)
 * 5. Users see only what admin has approved
 * 
 * This ensures admin has complete control over what appears in Explorer
 */
export async function GET() {
  try {
    // Fetch only visible tokens from Supabase admin_tokens table
    const { data: tokens, error } = await supabaseServer
      .from('admin_tokens')
      .select('*')
      .eq('is_hidden', false)
      .order('symbol', { ascending: true })

    if (error) {
      console.error('[v0] Supabase fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    // Transform database columns to match expected frontend format
    const transformedTokens = (tokens || []).map((token: any) => ({
      id: token.id,
      symbol: token.symbol,
      issuer: token.issuer,
      icon: token.icon,
      category: token.category,
      description: token.description,
      tradeUrl: token.trade_url,
      appUrl: token.app_url,
      circulatingSupply: token.circulating_supply,
      totalSupply: token.total_supply,
      marketCap: token.market_cap,
      website: token.website,
      twitter: token.twitter,
      telegram: token.telegram,
      verified: token.verified,
    }))

    return new NextResponse(JSON.stringify(transformedTokens), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // 5min cache
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching token registry:', error)
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
  }
}
