import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, getCurrentUser, isUserAdmin } from '@/lib/supabase-client'
import { getTokenRegistry } from '@/lib/horizon-fetcher'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    console.log('[v0] Admin syncing tokens from Horizon...')

    // Fetch all tokens from Horizon API
    const tokens = await getTokenRegistry()
    console.log(`[v0] Fetched ${tokens.length} tokens from Horizon`)

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ 
        error: 'No tokens fetched from Horizon',
        count: 0 
      }, { status: 400 })
    }

    // Prepare tokens for insertion
    const tokensToInsert = tokens.map((token) => ({
      id: token.id,
      symbol: token.symbol,
      issuer: token.issuer,
      is_hidden: false, // All new tokens visible by default
      verified: false, // Not verified by default
      icon: token.icon || null,
      category: token.category || null,
      description: token.description || null,
      trade_url: token.tradeUrl || null,
      app_url: token.appUrl || null,
      circulating_supply: token.circulatingSupply || null,
      total_supply: token.totalSupply || null,
      market_cap: token.marketCap || null,
      website: token.website || null,
      twitter: token.twitter || null,
      telegram: token.telegram || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }))

    // Upsert tokens into Supabase (update if exists, insert if new)
    const { data: insertedTokens, error: insertError } = await supabaseServer
      .from('admin_tokens')
      .upsert(tokensToInsert, { onConflict: 'id' })
      .select()

    if (insertError) {
      console.error('[v0] Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Failed to sync tokens to database' }, { status: 500 })
    }

    console.log(`[v0] Successfully synced ${insertedTokens?.length || 0} tokens to Supabase`)

    // Log the sync action
    await supabaseServer.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'sync_tokens',
      table_name: 'admin_tokens',
      record_id: 'bulk_sync',
      changes: {
        tokens_synced: insertedTokens?.length || 0,
        from: 'horizon_api',
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      count: insertedTokens?.length || 0,
      message: `Successfully synced ${insertedTokens?.length || 0} tokens to database`,
    })
  } catch (error) {
    console.error('[v0] Failed to sync tokens:', error)
    return NextResponse.json(
      { error: 'Failed to sync tokens from Horizon' },
      { status: 500 }
    )
  }
}
