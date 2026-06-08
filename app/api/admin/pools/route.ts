import { NextRequest, NextResponse } from 'next/server'
import { getProcessedPools } from '@/lib/horizon-fetcher'
import { getHiddenPoolIds, hidePool, showPool, type PoolVisibility } from '@/lib/admin/poolStore'
import { getHiddenTokenIds } from '@/lib/admin/tokenStore'

export async function GET() {
  try {
    const pools = await getProcessedPools()
    const hiddenPoolIds = await getHiddenPoolIds()
    const hiddenTokenIds = await getHiddenTokenIds()
    
    const poolsWithVisibility: PoolVisibility[] = pools.map((pool) => {
      // Check if pool should be hidden due to token being hidden
      const tokenId = `${pool.tokenCode}:${pool.tokenIssuer}`
      const hiddenByToken = hiddenTokenIds.includes(tokenId)
      
      return {
        id: pool.id,
        tokenCode: pool.tokenCode,
        tokenIssuer: pool.tokenIssuer,
        mainPair: pool.mainPair,
        isHidden: hiddenPoolIds.includes(pool.id) || hiddenByToken
      }
    })
    
    return NextResponse.json(poolsWithVisibility)
  } catch (error) {
    console.error('[v0] Failed to load pools:', error)
    return NextResponse.json({ error: 'Failed to load pools' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { poolId, action } = body
    
    if (!poolId || !action) {
      return NextResponse.json({ error: 'Missing poolId or action' }, { status: 400 })
    }
    
    if (action === 'hide') {
      await hidePool(poolId)
    } else if (action === 'show') {
      await showPool(poolId)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Failed to update pool visibility:', error)
    return NextResponse.json({ error: 'Failed to update pool visibility' }, { status: 500 })
  }
}
