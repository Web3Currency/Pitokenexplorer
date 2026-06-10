import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, getCurrentUser, isUserAdmin } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all pools from Supabase
    const { data: pools, error } = await supabaseServer
      .from('admin_pools')
      .select('*')
      .order('token_code', { ascending: true })

    if (error) {
      console.error('[v0] Supabase fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 })
    }

    // Check if any tokens are hidden and mark their pools
    const { data: hiddenTokens } = await supabaseServer
      .from('admin_tokens')
      .select('id')
      .eq('is_hidden', true)

    const hiddenTokenIds = (hiddenTokens || []).map((t) => t.id)

    // Map pools with visibility, considering hidden tokens
    const poolsWithVisibility = (pools || []).map((pool) => ({
      ...pool,
      is_hidden: pool.is_hidden || hiddenTokenIds.includes(pool.id),
    }))

    return NextResponse.json(poolsWithVisibility)
  } catch (error) {
    console.error('[v0] Failed to load pools:', error)
    return NextResponse.json({ error: 'Failed to load pools' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { poolId, action } = body

    if (!poolId || !action) {
      return NextResponse.json({ error: 'Missing poolId or action' }, { status: 400 })
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    if (action === 'hide') {
      updateData.is_hidden = true
    } else if (action === 'show') {
      updateData.is_hidden = false
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update pool in Supabase
    const { error: updateError } = await supabaseServer
      .from('admin_pools')
      .update(updateData)
      .eq('id', poolId)

    if (updateError) {
      console.error('[v0] Supabase update error:', updateError)
      return NextResponse.json({ error: 'Failed to update pool' }, { status: 500 })
    }

    // Log the action in audit log
    await supabaseServer.from('admin_audit_log').insert({
      admin_id: user.id,
      action,
      table_name: 'admin_pools',
      record_id: poolId,
      changes: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Failed to update pool visibility:', error)
    return NextResponse.json({ error: 'Failed to update pool visibility' }, { status: 500 })
  }
}
