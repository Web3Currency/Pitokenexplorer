function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error("Supabase explorer environment variables are not configured")
  return { url, key }
}


async function supabaseGet<T>(view: string, params: Record<string, string | number | undefined> = {}, range?: { from: number; to: number }): Promise<T[]> {
  const { url: baseUrl, key } = getSupabaseConfig()
  const url = new URL(`${baseUrl}/rest/v1/${view}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  }
  if (range) headers.Range = `${range.from}-${range.to}`
  const response = await fetch(url, { headers, cache: "no-store" })
  if (!response.ok) throw new Error(`Supabase ${view} request failed: ${response.status}`)
  return response.json()
}

export async function getExplorerTokens() {
  const rows = await supabaseGet<any>("explorer_tokens", {
    select: "id,asset_code,asset_issuer,name,description,image_url,toml_url,home_domain,circulating_supply,trustlines,holders,pool_balance,has_pi_pool",
    order: "has_pi_pool.desc,asset_code.asc",
    limit: 1000,
  })
  return rows.map((t, index) => ({
    id: `${t.asset_code}:${t.asset_issuer}`,
    rank: index + 1,
    name: t.asset_code,
    symbol: t.asset_code,
    issuer: t.asset_issuer ? `${t.asset_issuer.slice(0, 5)}...${t.asset_issuer.slice(-5)}` : "Native",
    fullIssuer: t.asset_issuer,
    category: null,
    verified: false,
    logoUrl: t.image_url ?? null,
    hasPiPool: Boolean(t.has_pi_pool),
    price: null, marketCap: null, liquidity: null, change: null,
    holders: t.holders ?? null, trustlines: t.trustlines ?? null,
    totalSupply: null, circulatingSupply: t.circulating_supply?.toString() ?? null,
    sparklineData: [], poolId: null,
  }))
}

export async function getExplorerPrices() {
  const rows = await supabaseGet<any>("explorer_market", {
    select: "token_id,price_pi,liquidity_pi,total_liquidity_pi",
    limit: 1000,
  })
  const tokens = await supabaseGet<any>("explorer_tokens", {
    select: "id,asset_code,asset_issuer",
    order: "has_pi_pool.desc,asset_code.asc",
    limit: 1000,
  })
  const byId = new Map(tokens.map(t => [t.id, t]))
  const result: Record<string, any> = {}
  for (const row of rows) {
    const token = byId.get(row.token_id)
    if (!token) continue
    result[`${token.asset_code}:${token.asset_issuer}`] = {
      price: row.price_pi == null ? null : Number(row.price_pi).toFixed(4),
      liquidity: row.liquidity_pi == null ? null : Number(row.liquidity_pi).toLocaleString(),
      totalLiquidity: row.total_liquidity_pi == null ? null : Number(row.total_liquidity_pi).toLocaleString(),
    }
  }
  return result
}

export async function getExplorerStats() {
  const rows = await supabaseGet<any>("explorer_stats", { network: "eq.Testnet", select: "*" })
  return rows[0] ?? null
}

export async function getExplorerTokenSnapshot(assetCode: string, issuer: string) {
  const tokens = await supabaseGet<any>("explorer_tokens", { asset_code: `eq.${assetCode}`, asset_issuer: `eq.${issuer}`, select: "*", limit: 1 })
  const token = tokens[0]
  if (!token) throw new Error("Token not found")
  const pools = await supabaseGet<any>("explorer_token_pools", { asset_code: `eq.${assetCode}`, asset_issuer: `eq.${issuer}`, select: "pool_id,pair,token_reserve,pi_reserve,fee_bp,total_shares,providers,last_active_at", limit: 100 })
  const piPools = pools.filter((p:any) => p.pi_reserve != null).sort((a:any,b:any)=>(Number(b.pi_reserve)||0)-(Number(a.pi_reserve)||0))
  const main = piPools[0]
  const marketRows = token.id == null ? [] : await supabaseGet<any>("explorer_market", { token_id: `eq.${token.id}`, select: "*", limit: 1 })
  const market = marketRows[0] ?? {}
  const orders = token.id == null ? [] : await supabaseGet<any>("explorer_token_orders", { token_id: `eq.${token.id}`, select: "side,price_pi,amount,total_pi,rank", order: "rank.asc", limit: 100 })
  const bids = orders.filter((o:any) => o.side === "bid").map((o:any) => ({ price: String(o.price_pi ?? ""), amount: String(o.amount ?? "") }))
  const asks = orders.filter((o:any) => o.side === "ask").map((o:any) => ({ price: String(o.price_pi ?? ""), amount: String(o.amount ?? "") }))
  const bestBid = bids[0]?.price ?? null
  const bestAsk = asks[0]?.price ?? null
  const spread = bestBid != null && bestAsk != null ? String(Number(bestAsk) - Number(bestBid)) : null
  const derivedPrice = main && Number(main.token_reserve) > 0 ? Number(main.pi_reserve) / Number(main.token_reserve) : null
  const derivedLiquidity = main?.pi_reserve == null ? null : Number(main.pi_reserve)
  const derivedTotalLiquidity = piPools.reduce((sum:number,p:any)=>sum+(Number(p.pi_reserve)||0),0)
  return {
    id: `${assetCode}:${issuer}`,
    price: market.price_pi != null ? Number(market.price_pi).toFixed(4) : derivedPrice == null ? null : derivedPrice.toFixed(4),
    liquidity: market.liquidity_pi != null ? Number(market.liquidity_pi).toLocaleString() : derivedLiquidity == null ? null : derivedLiquidity.toLocaleString(),
    totalLiquidity: market.total_liquidity_pi != null ? Number(market.total_liquidity_pi).toLocaleString() : derivedTotalLiquidity.toLocaleString(),
    trustlines: token.trustlines ?? null,
    holders: token.holders ?? null,
    circulatingSupply: token.circulating_supply == null ? null : Number(token.circulating_supply).toLocaleString(),
    poolBalance: token.pool_balance == null ? null : Number(token.pool_balance).toLocaleString(),
    poolId: market.pool_id ?? main?.pool_id ?? null,
    athPrice: market.ath_price_pi == null ? null : Number(market.ath_price_pi).toString(),
    atlPrice: market.atl_price_pi == null ? null : Number(market.atl_price_pi).toString(),
    volume24h: market.volume_24h_pi == null ? null : Number(market.volume_24h_pi).toLocaleString(),
    marketCap: market.market_cap_pi == null ? null : Number(market.market_cap_pi).toLocaleString(),
    flags: { authRequired: token.auth_required ?? null, authRevocable: token.auth_revocable ?? null, authClawbackEnabled: token.auth_clawback_enabled ?? null },
    orderBook: { bestBid, bestAsk, spread, bids, asks },
    metadata: { image: token.image_url ?? null, desc: token.description ?? null, tomlUrl: token.toml_url ?? null },
    updatedAt: market.updated_at ?? token.updated_at ?? new Date().toISOString(),
    status: { price: market.price_pi != null || derivedPrice != null ? "ok" : "unavailable", supply: token.circulating_supply != null ? "ok" : "unavailable", trustlines: token.trustlines != null ? "ok" : "unavailable", holders: token.holders != null ? "ok" : "unavailable", poolBalance: token.pool_balance != null ? "ok" : "unavailable", marketCap: market.market_cap_pi != null ? "ok" : "unavailable", volume24h: market.volume_24h_pi != null ? "ok" : "unavailable", atlPrice: market.atl_price_pi != null ? "ok" : "unavailable", athPrice: market.ath_price_pi != null ? "ok" : "unavailable", flags: "ok", orderBook: orders.length ? "ok" : "unavailable", metadata: token.image_url || token.description ? "ok" : "unavailable" },
  }
}

export async function getExplorerPools() {
  const select = "token_id,pool_id,pair,tvl_pi,token_reserve,pi_reserve,liquidity_pi,fee_bp,total_shares,providers,last_active_at,reserves,asset_code,asset_issuer,name"
  const pageSize = 1000
  const rows: any[] = []
  for (let from = 0; ; from += pageSize) {
    const page = await supabaseGet<any>(
      "explorer_token_pools",
      { select, order: "tvl_pi.desc.nullslast" },
      { from, to: from + pageSize - 1 },
    )
    rows.push(...page)
    if (page.length < pageSize) break
  }

  const grouped = new Map<string, any>()
  for (const p of rows) {
    const key = `${p.asset_code}:${p.asset_issuer}`
    if (!grouped.has(key)) grouped.set(key, { id: key, code: p.asset_code, issuer: p.asset_issuer, piPools: [], otherPools: [] })
    const g = grouped.get(key)
    if (p.pi_reserve != null) g.piPools.push(p); else g.otherPools.push(p)
  }
  return [...grouped.values()].map(t => {
    t.piPools.sort((a:any,b:any)=>(Number(b.pi_reserve)||0)-(Number(a.pi_reserve)||0))
    const main=t.piPools[0]
    const all=[...t.piPools,...t.otherPools].sort((a:any,b:any)=>(Number(b.token_reserve)||0)-(Number(a.token_reserve)||0))
    const tokenName=all.find((p:any)=>p.name)?.name || t.code
    const totalTVL=t.piPools.reduce((s:number,p:any)=>s+(Number(p.pi_reserve)||0),0)
    const totalLocked=all.reduce((s:number,p:any)=>s+(Number(p.token_reserve)||0),0)
    const providers=t.piPools.reduce((s:number,p:any)=>s+(Number(p.providers)||0),0)
    const price=main && Number(main.token_reserve)>0 ? Number(main.pi_reserve)/Number(main.token_reserve) : null
    return {
      id: main?.pool_id || t.id, tokenCode:t.code, tokenIssuer:t.issuer, title:`${tokenName} Pools`, mainPair:`${t.code}/PI`,
      tvl: totalTVL.toLocaleString(), totalLockedAsset: totalLocked.toLocaleString(),
      liquidity: main ? Number(main.pi_reserve).toLocaleString() : null,
      price: price == null ? null : price.toFixed(4), volume24h:null, providers,
      fee: main?.fee_bp == null ? null : `${(Number(main.fee_bp)/100).toFixed(2)}%`,
      totalShares: main?.total_shares == null ? null : Number(main.total_shares).toLocaleString(),
      lastActive: main?.last_active_at ? new Date(main.last_active_at).toLocaleString() : null,
      allPools: all.map((p:any)=>({id:p.pool_id,pair:p.pair,lockedToken:Number(p.token_reserve||0).toLocaleString(),providers:Number(p.providers||0),fee:p.fee_bp==null?null:`${(Number(p.fee_bp)/100).toFixed(2)}%`}))
    }
  }).sort((a,b)=>(Number(b.tvl.replace(/,/g,""))||0)-(Number(a.tvl.replace(/,/g,""))||0))
}

export async function getExplorerPoolVolume(poolId: string) {
  const rows = await supabaseGet<any>("explorer_pool_volume", { pool_id: `eq.${poolId}`, select: "range,bucket_at,volume_pi", order: "bucket_at.asc", limit: 1000 })
  const result: any = { "24h": [], "7d": [], "30d": [] }
  for (const r of rows) if (result[r.range]) result[r.range].push({ timestamp: r.bucket_at, volumePI: Number(r.volume_pi) || 0 })
  return result
}

export async function getExplorerPriceHistory(assetCode:string,issuer:string){
  const tokens=await supabaseGet<any>("explorer_tokens",{asset_code:`eq.${assetCode}`,asset_issuer:`eq.${issuer}`,select:"id",limit:1})
  const id=tokens[0]?.id
  if(!id)return {"24h":[],"7d":[],"30d":[]}
  const rows=await supabaseGet<any>("explorer_token_history",{token_id:`eq.${id}`,select:"range,bucket_at,price_pi",order:"bucket_at.asc",limit:1000})
  const out:any={"24h":[],"7d":[],"30d":[]}
  for(const r of rows)if(out[r.range])out[r.range].push({timestamp:r.bucket_at,pricePI:Number(r.price_pi)||0})
  return out
}
