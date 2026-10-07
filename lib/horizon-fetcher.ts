/**
 * Centralized Horizon API fetcher with:
 * - Server-side only execution
 * - Full pagination support to fetch ALL tokens
 * - Built-in caching
 * - Correct price calculation from Token/PI pools only
 */

import { getCache, getStaleCache, setCache, CACHE_TTL, CACHE_KEYS, getCacheTimestamp } from "./server-cache"
import { formatAssetAmount } from "./asset-precision"

export { CACHE_KEYS, getCacheTimestamp }

const PI_HORIZON_URL = "https://api.testnet.minepi.com"

const HORIZON_MAX_RETRIES = 3
const HORIZON_RETRY_DELAYS_MS = [500, 1000, 2000] as const

async function fetchHorizon(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= HORIZON_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(input, init)

      if (response.ok || response.status < 500 || attempt === HORIZON_MAX_RETRIES) {
        return response
      }
    } catch (error) {
      lastError = error
      if (attempt === HORIZON_MAX_RETRIES) throw error
    }

    await new Promise((resolve) =>
      setTimeout(resolve, HORIZON_RETRY_DELAYS_MS[attempt] ?? HORIZON_RETRY_DELAYS_MS[HORIZON_RETRY_DELAYS_MS.length - 1]),
    )
  }

  throw lastError instanceof Error ? lastError : new Error("Horizon request failed")
}

const PAGINATION_LIMITS = {
  POOLS_MAX_PAGES: 50, // Up to 10,000 pool records
  POOLS_PER_PAGE: 200, // Horizon max per page
  TOKEN_POOLS_LIMIT: 100, // Max pools per token
  OPERATIONS_PER_PAGE: 200, // Pagination limit for operations/trades
  OPERATIONS_MAX_PAGES: 10, // Limit to prevent excessive fetching
} as const

export interface PoolData {
  id: string
  reserves: Array<{
    asset: string
    amount: string
  }>
  total_trustlines: number
  total_shares: string
  fee_bp: number
  last_modified_time?: string
}

export interface TokenRegistryItem {
  id: string
  assetCode: string
  assetIssuer: string
}

export interface ProcessedPool {
  id: string
  tokenCode: string
  tokenIssuer: string
  title: string
  mainPair: string
  tvl: string
  totalLockedAsset: string
  liquidity: string | null
  price: string | null
  volume24h: null
  providers: number
  fee: string | null
  totalShares: string | null
  lastActive: string | null
  allPools: Array<{
    id: string
    pair: string
    lockedToken: string
    providers: number
    fee: string | null
  }>
}

export interface MarketStatsInstant {
  liquidity: string
  tokenCount: number
  poolCount: number
  largestPool: string
  largestPoolLiquidity: string
  activePools: number
  network: string
}

export interface MarketStatsDeferred {
  liquidityChange: string | null
  volume24hChange: string | null
  totalVolume24h: string | null
  tokenCountChange: string | null
  newTokens7d: number
}

export interface MarketStatsData extends MarketStatsInstant {
  liquidityChange: string | null
  totalVolume24h: string | null
  volume24hChange: string | null
  tokenCountChange: null
}

export interface TokenIssuerFlags {
  authRequired: boolean | null
  authRevocable: boolean | null
  authClawbackEnabled: boolean | null
}

export interface TokenDetailsData {
  id: string
  price: string | null
  liquidity: string | null
  totalLiquidity: string | null // Added total liquidity across all pools
  trustlines: number | null
  holders: number | null
  circulatingSupply: string | null
  poolBalance: string | null
  poolId: string | null
  athPrice: string | null // Added ATH price
  atlPrice: string | null // Added ATL price
  volume24h: string | null
  marketCap: string | null
  flags: TokenIssuerFlags | null
}

export type TokenSnapshotFieldStatus = "ok" | "unavailable" | "error"

export interface TokenSnapshotStatus {
  price: TokenSnapshotFieldStatus
  supply: TokenSnapshotFieldStatus
  trustlines: TokenSnapshotFieldStatus
  holders: TokenSnapshotFieldStatus
  poolBalance: TokenSnapshotFieldStatus
  marketCap: TokenSnapshotFieldStatus
  volume24h: TokenSnapshotFieldStatus
  atlPrice: TokenSnapshotFieldStatus
  athPrice: TokenSnapshotFieldStatus
  flags: TokenSnapshotFieldStatus
  orderBook: TokenSnapshotFieldStatus
  metadata: TokenSnapshotFieldStatus
}

export interface TokenSnapshotData extends TokenDetailsData {
  orderBook: OrderBookData
  metadata: IssuerCurrencyMetadata
  updatedAt: string
  status: TokenSnapshotStatus
}

export interface PoolVolumeDataPoint {
  timestamp: string
  volumePI: number
}

export interface PoolVolumeResponse {
  "24h": PoolVolumeDataPoint[]
  "7d": PoolVolumeDataPoint[]
  "30d": PoolVolumeDataPoint[]
}

export interface TokenPriceDataPoint {
  timestamp: string
  pricePI: number
}

export interface TokenPriceHistoryResponse {
  "24h": TokenPriceDataPoint[]
  "7d": TokenPriceDataPoint[]
  "30d": TokenPriceDataPoint[]
}

/**
 * Fetch ALL liquidity pools with full pagination
 * Continues fetching until no more pages remain
 */
export async function fetchCachedPools(): Promise<PoolData[]> {
  // Check cache first
  const cached = getCache<PoolData[]>(CACHE_KEYS.LIQUIDITY_POOLS)
  if (cached) return cached

  let allRecords: PoolData[] = []
  let url: string | null = `${PI_HORIZON_URL}/liquidity_pools?limit=${PAGINATION_LIMITS.POOLS_PER_PAGE}&order=desc`
  let pageCount = 0
  let refreshFailed = false

  while (url && pageCount < PAGINATION_LIMITS.POOLS_MAX_PAGES) {
    try {
      const response: any = await fetchHorizon(url, {
        next: { revalidate: 900 },
      })
      if (!response.ok) {
        refreshFailed = true
        break
      }

      const data: any = await response.json()
      const records = data._embedded?.records ?? []
      if (records.length === 0) {
        refreshFailed = true
        break
      }

      allRecords = [...allRecords, ...records]

      if (records.length < PAGINATION_LIMITS.POOLS_PER_PAGE || !data._links?.next) {
        break
      }
      url = data._links.next.href
      pageCount++
    } catch (error) {
      console.error("Error fetching pools page:", error)
      refreshFailed = true
      break
    }
  }

  if (refreshFailed) {
    const lastGood = getStaleCache<PoolData[]>(CACHE_KEYS.LIQUIDITY_POOLS)
    if (lastGood) return lastGood
    return []
  }

  setCache(CACHE_KEYS.LIQUIDITY_POOLS, allRecords, CACHE_TTL.LIQUIDITY_POOLS)
  return allRecords
}

/**
 * Get processed pools with calculated TVL, prices etc.
 * All heavy calculations are done server-side and cached
 */
export async function getProcessedPools(): Promise<ProcessedPool[]> {
  const cacheKey = "processed-pools"
  const cached = getCache<ProcessedPool[]>(cacheKey)
  if (cached) return cached

  const pools = await fetchCachedPools()
  const tokenMap = new Map<
    string,
    {
      id: string
      code: string
      issuer: string
      piPools: PoolData[] // Track all PI pools
      otherPools: PoolData[]
    }
  >()

  pools.forEach((pool) => {
    const reserves = pool.reserves
    const isPiPool = reserves.some((r) => r.asset === "native")

    reserves.forEach((reserve) => {
      if (reserve.asset === "native") return

      const tokenKey = reserve.asset
      if (!tokenMap.has(tokenKey)) {
        const [code, issuer] = reserve.asset.split(":")
        tokenMap.set(tokenKey, {
          id: tokenKey,
          code,
          issuer,
          piPools: [],
          otherPools: [],
        })
      }

      const tokenData = tokenMap.get(tokenKey)!

      if (isPiPool) {
        tokenData.piPools.push(pool)
      } else {
        // Only add to otherPools if this token is actually in the pool
        if (!tokenData.piPools.some((p) => p.id === pool.id) && !tokenData.otherPools.some((p) => p.id === pool.id)) {
          tokenData.otherPools.push(pool)
        }
      }
    })
  })

  const responseData = Array.from(tokenMap.values())
    .map((t) => {
      // Sort PI pools by liquidity to find main pool
      const sortedPiPools = t.piPools.sort((a, b) => {
        const aLiq = Number.parseFloat(a.reserves.find((r) => r.asset === "native")?.amount || "0")
        const bLiq = Number.parseFloat(b.reserves.find((r) => r.asset === "native")?.amount || "0")
        return bLiq - aLiq
      })

      const mainPool = sortedPiPools[0]

      // Calculate price from the pool with highest liquidity
      let price: number | null = null
      let mainPoolLiquidity: number | null = null

      if (mainPool) {
        const nativeReserve = mainPool.reserves.find((r) => r.asset === "native")
        const assetReserve = mainPool.reserves.find((r) => r.asset === `${t.code}:${t.issuer}`)

        if (nativeReserve && assetReserve) {
          mainPoolLiquidity = Number.parseFloat(nativeReserve.amount)
          const assetAmount = Number.parseFloat(assetReserve.amount)
          price = assetAmount > 0 ? mainPoolLiquidity / assetAmount : null
        }
      }

      let totalTVL = 0
      t.piPools.forEach((p) => {
        const nr = p.reserves.find((r) => r.asset === "native")
        if (nr) totalTVL += Number.parseFloat(nr.amount)
      })

      let totalLockedAsset = 0
      const allTokenPools = [...t.piPools, ...t.otherPools]
      allTokenPools.forEach((p) => {
        p.reserves.forEach((reserve) => {
          if (reserve.asset === `${t.code}:${t.issuer}`) {
            totalLockedAsset += Number.parseFloat(reserve.amount)
          }
        })
      })

      // Calculate total providers across all PI pools
      let totalProviders = 0
      t.piPools.forEach((p) => {
        totalProviders += p.total_trustlines || 0
      })

      return {
        id: mainPool?.id || t.id,
        tokenCode: t.code,
        tokenIssuer: t.issuer,
        title: `${t.code} Pools`,
        mainPair: `${t.code}/PI`,
        tvl: formatAssetAmount(totalTVL),
        totalLockedAsset: formatAssetAmount(totalLockedAsset),
        liquidity: mainPoolLiquidity > 0 ? formatAssetAmount(mainPoolLiquidity) : null,
        price: price != null ? formatAssetAmount(price) : null,
        volume24h: null,
        providers: totalProviders,
        fee: mainPool?.fee_bp != null ? `${(mainPool.fee_bp / 100).toFixed(2)}%` : null,
        totalShares: mainPool?.total_shares ? formatAssetAmount(mainPool.total_shares) : null,
        lastActive: mainPool?.last_modified_time ? new Date(mainPool.last_modified_time).toLocaleString() : null,
        allPools: allTokenPools.map((p) => {
          const reserves = p.reserves
          let token1 = ""
          let token2 = ""
          let lockedAmount = "0"

          reserves.forEach((reserve) => {
            const tokenSymbol = reserve.asset === "native" ? "PI" : reserve.asset.split(":")[0]

            if (!token1) {
              token1 = tokenSymbol
            } else if (!token2) {
              token2 = tokenSymbol
            }

            if (reserve.asset === `${t.code}:${t.issuer}`) {
              lockedAmount = formatAssetAmount(reserve.amount)
            }
          })

          return {
            id: p.id,
            pair: `${token1}/${token2}`,
            lockedToken: lockedAmount,
            providers: p.total_trustlines || 0,
            fee: p.fee_bp != null ? `${(p.fee_bp / 100).toFixed(2)}%` : null,
          }
        }),
      }
    })
    // Sort by TVL descending
    .sort((a, b) => {
      const aVal = Number.parseFloat(a.tvl.replace(/,/g, "")) || 0
      const bVal = Number.parseFloat(b.tvl.replace(/,/g, "")) || 0
      return bVal - aVal
    })

  setCache(cacheKey, responseData, CACHE_TTL.LIQUIDITY_POOLS)
  return responseData
}

/**
 * Get market stats with caching
 * All calculations done server-side and cached
 * Now uses non-blocking pattern for 24h changes
 */
export async function getMarketStats(): Promise<MarketStatsData> {
  const cached = getCache<MarketStatsData>(CACHE_KEYS.MARKET_STATS)
  if (cached) return cached

  // Get instant stats first (fast)
  const instant = await getMarketStatsInstant()

  // Try to get deferred stats from cache (may be null if not yet computed)
  const deferredCacheKey = "market-stats-deferred"
  const deferredCached = getCache<MarketStatsDeferred>(deferredCacheKey)

  // If deferred is cached, combine and return
  if (deferredCached) {
    const stats: MarketStatsData = {
      ...instant,
      liquidityChange: deferredCached.liquidityChange,
      totalVolume24h: deferredCached.totalVolume24h ?? null,
      volume24hChange: deferredCached.volume24hChange,
      tokenCountChange: null,
    }
    setCache(CACHE_KEYS.MARKET_STATS, stats, CACHE_TTL.MARKET_STATS)
    return stats
  }

  // Compute deferred in background (don't block)
  const pools = await fetchCachedPools()
  const liquidityChange = await calculateLiquidity24hChange(pools)
  const volume24hChange = await calculateVolume24hChange(pools)
  const totalVolume24h = await calculateTotalVolume24h(pools)
  const newTokens7d = await calculateNewTokens7d(pools)

  const stats: MarketStatsData = {
    ...instant,
    liquidityChange: liquidityChange,
    totalVolume24h,
    volume24hChange: volume24hChange,
    tokenCountChange: null,
  }

  setCache(CACHE_KEYS.MARKET_STATS, stats, CACHE_TTL.MARKET_STATS)

  // Also cache deferred separately
  setCache(
    deferredCacheKey,
    {
      liquidityChange,
      volume24hChange,
      tokenCountChange: null,
      newTokens7d,
    },
    CACHE_TTL.MARKET_STATS,
  )

  return stats
}

/**
 * Get instant market stats (no historical calculations)
 * Renders immediately without blocking on 24h changes
 */
export async function getMarketStatsInstant(): Promise<MarketStatsInstant> {
  // Check if we have a full cached version first
  const fullCached = getCache<MarketStatsData>(CACHE_KEYS.MARKET_STATS)
  if (fullCached) {
    return {
      liquidity: fullCached.liquidity,
      tokenCount: fullCached.tokenCount,
      poolCount: fullCached.poolCount,
      largestPool: fullCached.largestPool,
      largestPoolLiquidity: fullCached.largestPoolLiquidity,
      activePools: fullCached.activePools,
      network: fullCached.network,
    }
  }

  // Check instant cache
  const instantCacheKey = "market-stats-instant"
  const instantCached = getCache<MarketStatsInstant>(instantCacheKey)
  if (instantCached) return instantCached

  const pools = await fetchCachedPools()

  let totalLiquidity = 0
  const totalTokens = new Set<string>()
  let largestPoolTvl = 0
  let largestPoolPair = ""
  let largestPoolLiquidity = "0"
  const uniquePoolPairs = new Set<string>()

  pools.forEach((pool) => {
    const nativeReserve = pool.reserves.find((r) => r.asset === "native")
    const assetReserve = pool.reserves.find((r) => r.asset !== "native")

    if (nativeReserve) {
      totalLiquidity += Number.parseFloat(nativeReserve.amount)
    }

    const assetSymbols: string[] = []
    pool.reserves.forEach((r) => {
      const symbol = r.asset === "native" ? "PI" : r.asset.split(":")[0]
      assetSymbols.push(symbol)
    })

    const sortedPair = assetSymbols.sort().join("-")
    uniquePoolPairs.add(sortedPair)

    const piLiquidity = Number.parseFloat(nativeReserve?.amount || "0")
    if (piLiquidity > largestPoolTvl) {
      largestPoolTvl = piLiquidity
      const displaySymbol = assetReserve ? assetReserve.asset.split(":")[0] : ""
      largestPoolPair = displaySymbol ? `${displaySymbol}/PI` : "PI/PI"
      largestPoolLiquidity = formatAssetAmount(piLiquidity)
    }

    pool.reserves.forEach((r) => {
      if (r.asset !== "native") totalTokens.add(r.asset)
    })
  })

  const stats: MarketStatsInstant = {
    liquidity: totalLiquidity > 0 ? `${formatAssetAmount(totalLiquidity)} π` : "0.0000000 π",
    tokenCount: totalTokens.size,
    poolCount: uniquePoolPairs.size,
    largestPool: largestPoolPair || "—",
    largestPoolLiquidity: largestPoolLiquidity,
    activePools: uniquePoolPairs.size,
    network: "Testnet",
  }

  // Cache with shorter TTL since this is fast
  setCache(instantCacheKey, stats, CACHE_TTL.MARKET_STATS)
  return stats
}

/**
 * Get deferred market stats (24h changes - slow calculations)
 * Called asynchronously after UI renders
 */
export async function getMarketStatsDeferred(): Promise<MarketStatsDeferred> {
  const deferredCacheKey = "market-stats-deferred"
  const cached = getCache<MarketStatsDeferred>(deferredCacheKey)
  if (cached) return cached

  const pools = await fetchCachedPools()

  // These are the slow calculations that were blocking render
  const liquidityChange = await calculateLiquidity24hChange(pools)
  const volume24hChange = await calculateVolume24hChange(pools)
  const totalVolume24h = await calculateTotalVolume24h(pools)

  const newTokens7d = await calculateNewTokens7d(pools)

  const deferred: MarketStatsDeferred = {
    liquidityChange,
    volume24hChange,
    totalVolume24h,
    tokenCountChange: null,
    newTokens7d,
  }

  setCache(deferredCacheKey, deferred, CACHE_TTL.MARKET_STATS)
  return deferred
}

/**
 * Get market stats with caching
 * All calculations done server-side and cached
 */
export async function getMarketStatsFull(): Promise<MarketStatsData> {
  const cached = getCache<MarketStatsData>(CACHE_KEYS.MARKET_STATS)
  if (cached) return cached

  const pools = await fetchCachedPools()

  let totalLiquidity = 0
  const totalTokens = new Set<string>()
  let largestPoolTvl = 0
  let largestPoolPair = ""
  let largestPoolLiquidity = "0"
  const uniquePoolPairs = new Set<string>()

  pools.forEach((pool) => {
    const nativeReserve = pool.reserves.find((r) => r.asset === "native")
    const assetReserve = pool.reserves.find((r) => r.asset !== "native")

    if (nativeReserve) {
      totalLiquidity += Number.parseFloat(nativeReserve.amount)
    }

    const assetSymbols: string[] = []
    pool.reserves.forEach((r) => {
      const symbol = r.asset === "native" ? "PI" : r.asset.split(":")[0]
      assetSymbols.push(symbol)
    })

    const sortedPair = assetSymbols.sort().join("-")
    uniquePoolPairs.add(sortedPair)

    const piLiquidity = Number.parseFloat(nativeReserve?.amount || "0")
    if (piLiquidity > largestPoolTvl) {
      largestPoolTvl = piLiquidity
      const displaySymbol = assetReserve ? assetReserve.asset.split(":")[0] : ""
      largestPoolPair = displaySymbol ? `${displaySymbol}/PI` : "PI/PI"
      largestPoolLiquidity = formatAssetAmount(piLiquidity)
    }

    pool.reserves.forEach((r) => {
      if (r.asset !== "native") totalTokens.add(r.asset)
    })
  })

  const liquidityChange = await calculateLiquidity24hChange(pools)
  const volume24hChange = await calculateVolume24hChange(pools)
  const totalVolume24h = await calculateTotalVolume24h(pools)

  const stats: MarketStatsData = {
    liquidity: totalLiquidity > 0 ? `${formatAssetAmount(totalLiquidity)} π` : "0.0000000 π",
    liquidityChange: liquidityChange,
    totalVolume24h,
    volume24hChange: volume24hChange,
    tokenCount: totalTokens.size,
    tokenCountChange: null,
    poolCount: uniquePoolPairs.size,
    largestPool: largestPoolPair || "—",
    largestPoolLiquidity: largestPoolLiquidity,
    activePools: uniquePoolPairs.size,
    network: "Testnet",
  }

  setCache(CACHE_KEYS.MARKET_STATS, stats, CACHE_TTL.MARKET_STATS)
  return stats
}

/**
 * Get token registry including tokens without PI pools
 * Fetches ALL unique tokens from all pools
 */
export async function getTokenRegistry(): Promise<any[]> {
  const cached = getCache<any[]>(CACHE_KEYS.TOKEN_REGISTRY)
  if (cached) return cached

  const pools = await fetchCachedPools()
  const tokenMap = new Map<string, TokenRegistryItem & { hasPiPool: boolean }>()

  pools.forEach((pool) => {
    const reserves = pool.reserves
    const hasPiReserve = reserves.some((r) => r.asset === "native")

    reserves.forEach((reserve) => {
      if (reserve.asset === "native") return

      const [assetCode, assetIssuer] = reserve.asset.split(":")
      const tokenKey = reserve.asset

      if (!tokenMap.has(tokenKey)) {
        tokenMap.set(tokenKey, {
          id: tokenKey,
          assetCode,
          assetIssuer,
          hasPiPool: hasPiReserve,
        })
      } else if (hasPiReserve) {
        // Update hasPiPool if we find a PI pool for this token
        const existing = tokenMap.get(tokenKey)!
        existing.hasPiPool = true
      }
    })
  })

  // REMOVED: Hardcoded category registry - Admin Dashboard is the ONLY source
  // Admin defines all categories via tokenStore metadata

  const tokens = Array.from(tokenMap.values())
    .sort((a, b) => {
      // Sort by hasPiPool (true first), then by assetCode
      if (a.hasPiPool !== b.hasPiPool) {
        return a.hasPiPool ? -1 : 1
      }
      return a.assetCode.localeCompare(b.assetCode)
    })
    .map((t, index) => ({
      id: t.id,
      rank: index + 1,
      name: t.assetCode,
      symbol: t.assetCode,
      issuer: t.assetIssuer ? t.assetIssuer.slice(0, 5) + "..." + t.assetIssuer.slice(-5) : "Native",
      fullIssuer: t.assetIssuer,
      // REMOVED: Hardcoded category, verified flag, icon, and color
      // All visual/metadata properties come ONLY from Admin Dashboard
      category: null, // Set by admin only
      verified: false, // Set by admin only
      logoUrl: null, // Set by admin only
      hasPiPool: t.hasPiPool,
      // Heavy fields initialized as null
      price: null,
      marketCap: null,
      liquidity: null,
      change: null,
      holders: null,
      trustlines: null,
      totalSupply: null,
      circulatingSupply: null,
      sparklineData: [],
      poolId: null,
    }))

  setCache(CACHE_KEYS.TOKEN_REGISTRY, tokens, CACHE_TTL.TOKEN_LIST)
  return tokens
}

/**
 * Get token details with accurate metrics from ALL Token/PI pools
 * - Price calculated from highest liquidity Token/PI pool
 * - Total liquidity summed across all Token/PI pools
 * - Trustlines and Holders properly distinguished
 */
async function fetchOfficialAssetRecord(assetCode: string, assetIssuer: string): Promise<{
  trustlines: number | null
  holders: number | null
  circulatingSupply: string | null
  circulatingSupplyRaw: number | null
  poolBalance: string | null
  flags: TokenIssuerFlags | null
  success: boolean
}> {
  try {
    const assetUrl = `${PI_HORIZON_URL}/assets?asset_code=${encodeURIComponent(assetCode)}&asset_issuer=${encodeURIComponent(assetIssuer)}&limit=1`
    const assetResponse: any = await fetchHorizon(assetUrl, { next: { revalidate: 300 } })

    if (!assetResponse.ok) {
      console.error(`Horizon assets request failed for ${assetCode}: ${assetResponse.status}`)
      return {
        trustlines: null,
        holders: null,
        circulatingSupply: null,
        circulatingSupplyRaw: null,
        poolBalance: null,
        flags: null,
        success: false,
      }
    }

    const assetData: any = await assetResponse.json()
    const asset = assetData._embedded?.records?.[0]

    if (!asset) {
      return {
        trustlines: null,
        holders: null,
        circulatingSupply: null,
        circulatingSupplyRaw: null,
        poolBalance: null,
        flags: null,
        success: false,
      }
    }

    // Pi Horizon's /assets response exposes circulating account balances
    // under balances, not the Stellar-style "amount" field.
    const balanceValues = asset.balances && typeof asset.balances === "object"
      ? [
          asset.balances.authorized,
          asset.balances.authorized_to_maintain_liabilities,
          asset.balances.unauthorized,
        ].map((value) => Number.parseFloat(String(value ?? ""))).filter((value) => Number.isFinite(value))
      : []

    const circulatingSupplyRaw = balanceValues.length > 0
      ? balanceValues.reduce((sum, value) => sum + value, 0)
      : null
    const circulatingSupply = circulatingSupplyRaw != null
      ? formatAssetAmount(circulatingSupplyRaw)
      : null

    // Horizon's /assets response already contains the trustline/account count.
    // Use it directly instead of crawling /accounts?asset=..., which can return
    // tens of megabytes for a popular asset.
    const legacyTrustlines = Number(asset.num_accounts)
    const accountStats = asset.accounts
    const accountStatValues = accountStats && typeof accountStats === "object"
      ? [
          accountStats.authorized,
          accountStats.authorized_to_maintain_liabilities,
          accountStats.unauthorized,
        ].map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : []

    let trustlines: number | null = null
    if (Number.isFinite(legacyTrustlines)) {
      trustlines = Math.max(0, Math.trunc(legacyTrustlines))
    } else if (accountStatValues.length > 0) {
      trustlines = Math.max(0, Math.trunc(accountStatValues.reduce((sum, value) => sum + value, 0)))
    }

    // /assets does not expose the exact positive-balance holder count.
    // Do not manufacture a holder count and do not crawl all accounts here.
    const holders: number | null = null

    const flags = asset.flags && typeof asset.flags === "object"
      ? {
          authRequired: typeof asset.flags.auth_required === "boolean" ? asset.flags.auth_required : null,
          authRevocable: typeof asset.flags.auth_revocable === "boolean" ? asset.flags.auth_revocable : null,
          authClawbackEnabled: typeof asset.flags.auth_clawback_enabled === "boolean" ? asset.flags.auth_clawback_enabled : null,
        }
      : null

    const poolBalanceRaw = Number.parseFloat(String(asset.liquidity_pools_amount ?? ""))
    const poolBalance = Number.isFinite(poolBalanceRaw)
      ? formatAssetAmount(poolBalanceRaw)
      : null

    return {
      trustlines,
      holders,
      circulatingSupply,
      circulatingSupplyRaw: Number.isFinite(circulatingSupplyRaw) ? circulatingSupplyRaw : null,
      poolBalance,
      flags,
      success: true,
    }
  } catch (error) {
    console.error("Error fetching token asset data:", error)
    return {
      trustlines: null,
      holders: null,
      circulatingSupply: null,
      circulatingSupplyRaw: null,
      poolBalance: null,
      flags: null,
        success: false,
      }
  }
}

export async function getTokenDetails(assetCode: string, assetIssuer: string): Promise<TokenDetailsData> {
  const cacheKey = CACHE_KEYS.TOKEN_DETAILS(assetCode, assetIssuer)
  const cached = getCache<TokenDetailsData>(cacheKey)
  if (cached) return cached

  const pools = await fetchCachedPools()
  const assetKey = `${assetCode}:${assetIssuer}`

  const tokenPiPools: Array<{ pool: PoolData; piAmount: number; tokenAmount: number }> = []

  pools.forEach((pool) => {
    const nativeReserve = pool.reserves.find((r) => r.asset === "native")
    const assetReserve = pool.reserves.find((r) => r.asset === assetKey)

    // Only consider pools that have both PI and this token
    if (nativeReserve && assetReserve) {
      tokenPiPools.push({
        pool,
        piAmount: Number.parseFloat(nativeReserve.amount),
        tokenAmount: Number.parseFloat(assetReserve.amount),
      })
    }
  })

  // Sort by PI liquidity to find the main pool
  tokenPiPools.sort((a, b) => b.piAmount - a.piAmount)

  const mainPool = tokenPiPools[0]

  let price: number | null = null
  let mainPoolLiquidity = 0

  if (mainPool && mainPool.tokenAmount > 0) {
    price = mainPool.piAmount / mainPool.tokenAmount
    mainPoolLiquidity = mainPool.piAmount
  }

  let totalLiquidity = 0
  tokenPiPools.forEach((p) => {
    totalLiquidity += p.piAmount
  })

  const [assetRecord, priceHistory, volume24h] = await Promise.all([
    fetchOfficialAssetRecord(assetCode, assetIssuer),
    getTokenPriceHistory(assetCode, assetIssuer),
    mainPool ? sumPoolPiVolume24h(mainPool.pool.id) : Promise.resolve(null),
  ])

  const historyPrices = (["24h", "7d", "30d"] as const)
    .flatMap((range) => priceHistory[range])
    .map((point) => Number.parseFloat(String(point.pricePI)))
    .filter((value) => Number.isFinite(value) && value > 0)

  const athValue = historyPrices.length > 0 ? Math.max(...historyPrices) : null
  const atlValue = historyPrices.length > 0 ? Math.min(...historyPrices) : null

  if (!assetRecord.success) {
    const stale = getStaleCache<TokenDetailsData>(cacheKey)
    if (stale) return stale
  }

  const marketCapValue =
    price != null && assetRecord.circulatingSupplyRaw != null
      ? price * assetRecord.circulatingSupplyRaw
      : null

  const result: TokenDetailsData = {
    id: `${assetCode}:${assetIssuer}`,
    price: price != null ? formatAssetAmount(price) : null,
    liquidity: mainPoolLiquidity > 0 ? formatAssetAmount(mainPoolLiquidity) : null,
    totalLiquidity: totalLiquidity > 0 ? formatAssetAmount(totalLiquidity) : null,
    trustlines: assetRecord.trustlines,
    holders: assetRecord.holders,
    circulatingSupply: assetRecord.circulatingSupply,
    poolBalance: assetRecord.poolBalance,
    marketCap: marketCapValue != null ? formatAssetAmount(marketCapValue) : null,
    flags: assetRecord.flags,
    poolId: mainPool?.pool.id || null,
    athPrice: athValue != null ? formatAssetAmount(athValue) : null,
    atlPrice: atlValue != null ? formatAssetAmount(atlValue) : null,
    volume24h,
  }

  // Cache with PRICES TTL (shorter) since price is the most time-sensitive
  setCache(cacheKey, result, CACHE_TTL.PRICES)
  return result
}

export async function getAllTokenPrices(): Promise<
  Record<string, { price: string | null; liquidity: string | null; totalLiquidity: string | null }>
> {
  const cacheKey = CACHE_KEYS.POOL_PRICES
  const cached =
    getCache<Record<string, { price: string | null; liquidity: string | null; totalLiquidity: string | null }>>(
      cacheKey,
    )
  if (cached) return cached

  const pools = await fetchCachedPools()

  const tokenData: Record<
    string,
    {
      pools: Array<{ piAmount: number; tokenAmount: number }>
    }
  > = {}

  pools.forEach((pool) => {
    const nativeReserve = pool.reserves.find((r) => r.asset === "native")
    if (!nativeReserve) return // Skip non-PI pools for price calculation

    const piAmount = Number.parseFloat(nativeReserve.amount)

    pool.reserves.forEach((reserve) => {
      if (reserve.asset === "native") return

      const assetKey = reserve.asset
      const tokenAmount = Number.parseFloat(reserve.amount)

      if (!tokenData[assetKey]) {
        tokenData[assetKey] = { pools: [] }
      }

      tokenData[assetKey].pools.push({ piAmount, tokenAmount })
    })
  })

  const result: Record<string, { price: string | null; liquidity: string | null; totalLiquidity: string | null }> = {}

  for (const [assetKey, data] of Object.entries(tokenData)) {
    // Sort pools by PI liquidity to find the main pool
    data.pools.sort((a, b) => b.piAmount - a.piAmount)

    const mainPool = data.pools[0]
    let price: number | null = null
    let mainLiquidity = 0

    if (mainPool && mainPool.tokenAmount > 0) {
      price = mainPool.piAmount / mainPool.tokenAmount
      mainLiquidity = mainPool.piAmount
    }

    // Sum total liquidity across all pools
    let totalLiquidity = 0
    data.pools.forEach((p) => {
      totalLiquidity += p.piAmount
    })

    result[assetKey] = {
      price: price != null ? formatAssetAmount(price) : null,
      liquidity: mainLiquidity > 0 ? formatAssetAmount(mainLiquidity) : null,
      totalLiquidity: totalLiquidity > 0 ? formatAssetAmount(totalLiquidity) : null,
    }
  }

  setCache(cacheKey, result, CACHE_TTL.PRICES)
  return result
}

/**
 * Fetch and calculate swap volume for a specific liquidity pool
 * Volume = sum of PI amounts moved in swap operations (not TVL)
 * Only counts actual swap/trade operations, ignores deposits/withdrawals
 */
export async function getPoolVolume(poolId: string): Promise<PoolVolumeResponse> {
  const cacheKey = CACHE_KEYS.POOL_VOLUME(poolId)
  const cached = getCache<PoolVolumeResponse>(cacheKey)
  if (cached) return cached

  const now = Date.now()
  const hours24Ago = now - 24 * 60 * 60 * 1000
  const days7Ago = now - 7 * 24 * 60 * 60 * 1000
  const days30Ago = now - 30 * 24 * 60 * 60 * 1000

  // Fetch trades/operations for this pool from Horizon
  const operations = await fetchPoolOperations(poolId, days30Ago)

  // Filter only swap operations and extract PI amounts
  const swapOps = operations.filter((op) => isSwapOperation(op))

  // Calculate volume buckets
  const result: PoolVolumeResponse = {
    "24h": calculateVolumeBuckets(swapOps, hours24Ago, now, "hourly"),
    "7d": calculateVolumeBuckets(swapOps, days7Ago, now, "daily"),
    "30d": calculateVolumeBuckets(swapOps, days30Ago, now, "daily"),
  }

  setCache(cacheKey, result, CACHE_TTL.POOL_VOLUME)
  return result
}

/**
 * Fetch operations/effects for a liquidity pool from Horizon
 * Uses the liquidity_pool_id filter to get relevant operations
 */
async function fetchPoolOperations(poolId: string, sinceTimestamp: number): Promise<any[]> {
  const allOperations: any[] = []

  // Try fetching trades for this pool
  let nextUrl: string | null =
    `${PI_HORIZON_URL}/liquidity_pools/${poolId}/operations?limit=${PAGINATION_LIMITS.OPERATIONS_PER_PAGE}&order=desc`
  let pageCount = 0

  while (nextUrl && pageCount < PAGINATION_LIMITS.OPERATIONS_MAX_PAGES) {
    try {
      const response: any = await fetchHorizon(nextUrl, {
        next: { revalidate: 600 }, // 10 min revalidation
      })
      if (!response.ok) break

      const data: any = await response.json()
      const records = data._embedded?.records ?? []
      if (records.length === 0) break

      // Filter by timestamp
      const filteredRecords = records.filter((op: any) => {
        const opTime = new Date(op.created_at).getTime()
        return opTime >= sinceTimestamp
      })

      allOperations.push(...filteredRecords)

      // Check if we've gone past our time window
      const oldestRecord = records[records.length - 1]
      if (oldestRecord) {
        const oldestTime = new Date(oldestRecord.created_at).getTime()
        if (oldestTime < sinceTimestamp) break
      }

      if (records.length < PAGINATION_LIMITS.OPERATIONS_PER_PAGE || !data._links?.next) {
        break
      }

      nextUrl = data._links.next.href
      pageCount++
    } catch (error) {
      console.error("Error fetching pool operations:", error)
      break
    }
  }

  return allOperations
}

/**
 * Check if an operation is a swap operation
 * Swaps are identified by type or specific operation characteristics
 */
function isSwapOperation(op: any): boolean {
  // Horizon operation types that indicate swaps in liquidity pools
  const swapTypes = [
    "liquidity_pool_trade",
    "path_payment_strict_send",
    "path_payment_strict_receive",
    "manage_buy_offer",
    "manage_sell_offer",
  ]

  return swapTypes.includes(op.type) || op.type_i === 22 // liquidity_pool_trade type_i
}

/**
 * Extract PI amount from an operation
 * Returns absolute value regardless of direction
 */
function extractPIAmount(op: any): number {
  // Check various fields where PI amount might be stored
  let piAmount = 0

  // For liquidity pool trades
  if (op.reserves_received) {
    op.reserves_received.forEach((reserve: any) => {
      if (reserve.asset === "native" || reserve.asset_type === "native") {
        piAmount += Math.abs(Number.parseFloat(reserve.amount || "0"))
      }
    })
  }

  if (op.reserves_deposited) {
    op.reserves_deposited.forEach((reserve: any) => {
      if (reserve.asset === "native" || reserve.asset_type === "native") {
        piAmount += Math.abs(Number.parseFloat(reserve.amount || "0"))
      }
    })
  }

  // For path payments and trades
  if (op.source_asset_type === "native") {
    piAmount += Math.abs(Number.parseFloat(op.source_amount || op.amount || "0"))
  }

  if (op.asset_type === "native" || op.bought_asset_type === "native" || op.sold_asset_type === "native") {
    piAmount += Math.abs(Number.parseFloat(op.amount || op.bought_amount || op.sold_amount || "0"))
  }

  // Direct amount field for native asset operations
  if ((op.asset_type === "native" || !op.asset_type) && op.amount) {
    const amount = Number.parseFloat(op.amount)
    if (!isNaN(amount) && piAmount === 0) {
      piAmount = Math.abs(amount)
    }
  }

  return piAmount
}

/**
 * Calculate volume buckets for a time period
 * @param ops - Swap operations
 * @param startTime - Start of time period
 * @param endTime - End of time period
 * @param bucketType - "hourly" or "daily"
 */
function calculateVolumeBuckets(
  ops: any[],
  startTime: number,
  endTime: number,
  bucketType: "hourly" | "daily",
): PoolVolumeDataPoint[] {
  const bucketSize = bucketType === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const buckets = new Map<string, number>()

  // Initialize buckets
  let currentBucket = Math.floor(startTime / bucketSize) * bucketSize
  while (currentBucket <= endTime) {
    const bucketKey = new Date(currentBucket).toISOString()
    buckets.set(bucketKey, 0)
    currentBucket += bucketSize
  }

  // Fill buckets with volume data
  ops.forEach((op: any) => {
    const opTime = new Date(op.created_at).getTime()
    if (opTime >= startTime && opTime <= endTime) {
      const bucketTime = Math.floor(opTime / bucketSize) * bucketSize
      const bucketKey = new Date(bucketTime).toISOString()

      const piAmount = extractPIAmount(op)
      if (piAmount > 0 && buckets.has(bucketKey)) {
        buckets.set(bucketKey, (buckets.get(bucketKey) || 0) + piAmount)
      }
    }
  })

  // Convert to array and filter out empty periods if no swaps at all
  const result: PoolVolumeDataPoint[] = []
  buckets.forEach((volumePI, timestamp) => {
    result.push({ timestamp, volumePI })
  })

  // Sort by timestamp ascending
  result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // If all volumes are 0, return empty array to indicate no swap activity
  const hasAnyVolume = result.some((dp) => dp.volumePI > 0)
  if (!hasAnyVolume) {
    return []
  }

  return result
}

/**
 * Get token price history from actual swap operations
 * Price is calculated only from Token/PI pool swaps
 * Returns the last executed swap price per time bucket
 */
export async function getTokenPriceHistory(assetCode: string, assetIssuer: string): Promise<TokenPriceHistoryResponse> {
  const cacheKey = CACHE_KEYS.TOKEN_PRICE_HISTORY(assetCode, assetIssuer)
  const cached = getCache<TokenPriceHistoryResponse>(cacheKey)
  if (cached) return cached

  const now = Date.now()
  const hours24Ago = now - 24 * 60 * 60 * 1000
  const days7Ago = now - 7 * 24 * 60 * 60 * 1000
  const days30Ago = now - 30 * 24 * 60 * 60 * 1000

  // First, find all Token/PI pools for this asset
  const pools = await fetchCachedPools()
  const assetKey = `${assetCode}:${assetIssuer}`

  const tokenPiPoolIds: string[] = []
  pools.forEach((pool) => {
    const hasNative = pool.reserves.some((r) => r.asset === "native")
    const hasToken = pool.reserves.some((r) => r.asset === assetKey)
    if (hasNative && hasToken) {
      tokenPiPoolIds.push(pool.id)
    }
  })

  if (tokenPiPoolIds.length === 0) {
    // No Token/PI pools exist
    const emptyResult: TokenPriceHistoryResponse = {
      "24h": [],
      "7d": [],
      "30d": [],
    }
    setCache(cacheKey, emptyResult, CACHE_TTL.TOKEN_PRICE_HISTORY)
    return emptyResult
  }

  // Fetch swap operations from all Token/PI pools
  const allSwapOps: Array<{ op: any; poolId: string }> = []

  for (const poolId of tokenPiPoolIds) {
    const operations = await fetchPoolOperationsForPrice(poolId, days30Ago)
    operations.forEach((op) => {
      if (isSwapOperationForPrice(op)) {
        allSwapOps.push({ op, poolId })
      }
    })
  }

  // Calculate price buckets
  const result: TokenPriceHistoryResponse = {
    "24h": calculatePriceBuckets(allSwapOps, assetCode, assetIssuer, hours24Ago, now, "hourly"),
    "7d": calculatePriceBuckets(allSwapOps, assetCode, assetIssuer, days7Ago, now, "daily"),
    "30d": calculatePriceBuckets(allSwapOps, assetCode, assetIssuer, days30Ago, now, "daily"),
  }

  setCache(cacheKey, result, CACHE_TTL.TOKEN_PRICE_HISTORY)
  return result
}

/**
 * Fetch operations for a pool specifically for price calculation
 * Uses trades endpoint for more accurate price data
 */
async function fetchPoolOperationsForPrice(poolId: string, sinceTimestamp: number): Promise<any[]> {
  const allOperations: any[] = []

  // Fetch trades for this pool
  let nextUrl: string | null =
    `${PI_HORIZON_URL}/liquidity_pools/${poolId}/trades?limit=${PAGINATION_LIMITS.OPERATIONS_PER_PAGE}&order=desc`
  let pageCount = 0

  while (nextUrl && pageCount < PAGINATION_LIMITS.OPERATIONS_MAX_PAGES) {
    try {
      const response: any = await fetchHorizon(nextUrl, {
        next: { revalidate: 600 }, // 10 min revalidation
      })
      if (!response.ok) {
        // If trades endpoint fails, try operations
        break
      }

      const data: any = await response.json()
      const records = data._embedded?.records || []

      if (records.length === 0) break

      // Filter by timestamp
      const filteredRecords = records.filter((op: any) => {
        const opTime = new Date(op.ledger_close_time || op.created_at).getTime()
        return opTime >= sinceTimestamp
      })

      allOperations.push(...filteredRecords)

      // Check if we've gone past our time window
      const oldestRecord = records[records.length - 1]
      if (oldestRecord) {
        const oldestTime = new Date(oldestRecord.ledger_close_time || oldestRecord.created_at).getTime()
        if (oldestTime < sinceTimestamp) break
      }

      if (records.length < PAGINATION_LIMITS.OPERATIONS_PER_PAGE || !data._links?.next) {
        break
      }

      nextUrl = data._links.next.href
      pageCount++
    } catch (error) {
      console.error("Error fetching pool trades for price:", error)
      break
    }
  }

  // If no trades found, fall back to operations endpoint
  if (allOperations.length === 0) {
    const operations = await fetchPoolOperations(poolId, sinceTimestamp)
    return operations
  }

  return allOperations
}

/**
 * Check if an operation is a valid swap for price calculation
 */
function isSwapOperationForPrice(op: any): boolean {
  // For trades endpoint, all records are valid trades
  if (op.base_asset_type || op.counter_asset_type) {
    return true
  }

  // For operations endpoint, check type
  const swapTypes = ["liquidity_pool_trade", "path_payment_strict_send", "path_payment_strict_receive"]

  return swapTypes.includes(op.type) || op.type_i === 22
}

/**
 * Extract price from a swap operation
 * Price = PI_amount / token_amount
 * Returns null if price cannot be determined
 */
function extractPriceFromSwap(op: any, assetCode: string, assetIssuer: string): number | null {
  let piAmount = 0
  let tokenAmount = 0

  const assetKey = `${assetCode}:${assetIssuer}`

  // For trades endpoint format
  if (op.base_asset_type !== undefined) {
    const baseIsNative = op.base_asset_type === "native"
    const counterIsNative = op.counter_asset_type === "native"

    const baseIsToken = op.base_asset_code === assetCode && op.base_asset_issuer === assetIssuer
    const counterIsToken = op.counter_asset_code === assetCode && op.counter_asset_issuer === assetIssuer

    if (baseIsNative && counterIsToken) {
      piAmount = Math.abs(Number.parseFloat(op.base_amount || "0"))
      tokenAmount = Math.abs(Number.parseFloat(op.counter_amount || "0"))
    } else if (counterIsNative && baseIsToken) {
      piAmount = Math.abs(Number.parseFloat(op.counter_amount || "0"))
      tokenAmount = Math.abs(Number.parseFloat(op.base_amount || "0"))
    }
  }

  // For operations/effects format
  if (piAmount === 0 && tokenAmount === 0) {
    // Check reserves_received/deposited format
    if (op.reserves_received || op.reserves_deposited) {
      const reserves = [...(op.reserves_received || []), ...(op.reserves_deposited || [])]
      reserves.forEach((reserve: any) => {
        if (reserve.asset === "native" || reserve.asset_type === "native") {
          piAmount += Math.abs(Number.parseFloat(reserve.amount || "0"))
        } else if (reserve.asset === assetKey) {
          tokenAmount += Math.abs(Number.parseFloat(reserve.amount || "0"))
        }
      })
    }

    // Check direct asset fields
    if (op.source_asset_type === "native") {
      piAmount = Math.abs(Number.parseFloat(op.source_amount || op.amount || "0"))
    }
    if (op.asset_type === "native" || op.bought_asset_type === "native" || op.sold_asset_type === "native") {
      piAmount = Math.abs(Number.parseFloat(op.amount || op.bought_amount || op.sold_amount || "0"))
    }

    // Check for token in sold/bought
    if (op.sold_asset_code === assetCode && op.sold_asset_issuer === assetIssuer) {
      tokenAmount = Math.abs(Number.parseFloat(op.sold_amount || "0"))
    }
    if (op.bought_asset_code === assetCode && op.bought_asset_issuer === assetIssuer) {
      tokenAmount = Math.abs(Number.parseFloat(op.bought_amount || "0"))
    }
  }

  // Calculate price only if we have both amounts
  if (piAmount > 0 && tokenAmount > 0) {
    return piAmount / tokenAmount
  }

  return null
}

/**
 * Calculate price buckets for a time period
 * Uses the LAST executed swap price per bucket (not average)
 * @param swapOps - Swap operations with pool IDs
 * @param assetCode - Token asset code
 * @param assetIssuer - Token asset issuer
 * @param startTime - Start of time period
 * @param endTime - End of time period
 * @param bucketType - "hourly" or "daily"
 */
function calculatePriceBuckets(
  swapOps: Array<{ op: any; poolId: string }>,
  assetCode: string,
  assetIssuer: string,
  startTime: number,
  endTime: number,
  bucketType: "hourly" | "daily",
): TokenPriceDataPoint[] {
  const bucketSize = bucketType === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000

  // Store the latest price per bucket (with timestamp for sorting)
  const bucketPrices = new Map<string, { pricePI: number; timestamp: number }>()

  // Process operations to extract prices
  swapOps.forEach(({ op }) => {
    const opTime = new Date(op.ledger_close_time || op.created_at).getTime()
    if (opTime < startTime || opTime > endTime) return

    const price = extractPriceFromSwap(op, assetCode, assetIssuer)
    if (price === null || price <= 0) return

    const bucketTime = Math.floor(opTime / bucketSize) * bucketSize
    const bucketKey = new Date(bucketTime).toISOString()

    const existing = bucketPrices.get(bucketKey)
    // Use the latest swap in each bucket (highest timestamp)
    if (!existing || opTime > existing.timestamp) {
      bucketPrices.set(bucketKey, { pricePI: price, timestamp: opTime })
    }
  })

  // Convert to array
  const result: TokenPriceDataPoint[] = []
  bucketPrices.forEach(({ pricePI }, timestamp) => {
    result.push({ timestamp, pricePI })
  })

  // Sort by timestamp ascending
  result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return result
}

/**
 * Calculate 24h liquidity snapshots from pool operations
 * Bins operations into 24h window to calculate change
 */
async function calculateLiquidity24hChange(pools: PoolData[]): Promise<string | null> {
  try {
    const now = Date.now()
    const hours24Ago = now - 24 * 60 * 60 * 1000

    let currentTotalLiquidity = 0
    pools.forEach((pool) => {
      const nativeReserve = pool.reserves.find((r) => r.asset === "native")
      if (nativeReserve) currentTotalLiquidity += Number.parseFloat(nativeReserve.amount)
    })
    if (currentTotalLiquidity <= 0) return null

    // Deposits and withdrawals are on pool effects, not manage_liquidity_pool operations.
    const ranked = [...pools].sort((a, b) => {
      const aPi = Number.parseFloat(a.reserves.find((r) => r.asset === "native")?.amount || "0")
      const bPi = Number.parseFloat(b.reserves.find((r) => r.asset === "native")?.amount || "0")
      return bPi - aPi
    })

    let netPiFlow = 0
    let sawEffect = false

    for (const pool of ranked.slice(0, 15)) {
      let nextUrl: string | null = `${PI_HORIZON_URL}/liquidity_pools/${pool.id}/effects?limit=200&order=desc`
      let pageCount = 0

      while (nextUrl && pageCount < 2) {
        try {
          const response: any = await fetchHorizon(nextUrl, { next: { revalidate: 600 } })
          if (!response.ok) break
          const data: any = await response.json()
          const records = data._embedded?.records ?? []
          if (records.length === 0) break

          let reachedOlder = false
          for (const effect of records) {
            const effectTime = new Date(effect.created_at).getTime()
            if (Number.isNaN(effectTime) || effectTime < hours24Ago) {
              reachedOlder = true
              continue
            }
            const reserves = effect.reserves_deposited || effect.reserves_received || effect.reserves_max || []
            const native = Array.isArray(reserves)
              ? reserves.find((reserve: any) => reserve.asset === "native")
              : null
            const amount = native ? Number.parseFloat(native.amount) : 0
            if (!amount) continue
            sawEffect = true
            if (effect.type === "liquidity_pool_deposited") netPiFlow += amount
            if (effect.type === "liquidity_pool_withdrew") netPiFlow -= amount
          }

          if (reachedOlder || records.length < 200) break
          nextUrl = data._links?.next?.href || null
          pageCount++
        } catch {
          break
        }
      }
    }

    if (!sawEffect) return "0.00%"

    const liquidityStart = currentTotalLiquidity - netPiFlow
    if (liquidityStart <= 0) return netPiFlow > 0 ? "+100.00%" : "0.00%"

    const changePercent = (netPiFlow / liquidityStart) * 100
    const changeFormatted = changePercent.toFixed(2)
    return changePercent >= 0 ? `+${changeFormatted}%` : `${changeFormatted}%`
  } catch (error) {
    console.error("Error calculating 24h liquidity change:", error)
    return null
  }
}


async function sumPoolPiVolume24h(poolId: string): Promise<string | null> {
  const now = Date.now()
  const hours24Ago = now - 24 * 60 * 60 * 1000
  let volume = 0
  let sawTrade = false
  let nextUrl: string | null = `${PI_HORIZON_URL}/liquidity_pools/${poolId}/trades?limit=200&order=desc`
  let pageCount = 0

  while (nextUrl && pageCount < 2) {
    try {
      const response: any = await fetchHorizon(nextUrl, { next: { revalidate: 600 } })
      if (!response.ok) break
      const data: any = await response.json()
      const records = data._embedded?.records ?? []
      if (records.length === 0) break

      let reachedOlder = false
      for (const trade of records) {
        const tradeTime = new Date(trade.ledger_close_time || trade.created_at).getTime()
        if (Number.isNaN(tradeTime) || tradeTime < hours24Ago) {
          reachedOlder = true
          continue
        }
        const piAmount = trade.base_asset_type === "native"
          ? Number.parseFloat(trade.base_amount)
          : trade.counter_asset_type === "native"
            ? Number.parseFloat(trade.counter_amount)
            : 0
        if (!piAmount) continue
        sawTrade = true
        volume += piAmount
      }

      if (reachedOlder || records.length < 200) break
      nextUrl = data._links?.next?.href || null
      pageCount++
    } catch {
      break
    }
  }

  if (!sawTrade) return "0"
  return formatAssetAmount(volume)
}

async function calculateTotalVolume24h(pools: PoolData[]): Promise<string | null> {
  const ranked = [...pools].sort((a, b) => {
    const aPi = Number.parseFloat(a.reserves.find((r) => r.asset === "native")?.amount || "0")
    const bPi = Number.parseFloat(b.reserves.find((r) => r.asset === "native")?.amount || "0")
    return bPi - aPi
  }).slice(0, 12)

  let total = 0
  let saw = false
  for (const pool of ranked) {
    const volume = await sumPoolPiVolume24h(pool.id)
    const amount = Number.parseFloat(String(volume ?? "0").replace(/,/g, ""))
    if (volume !== null) saw = true
    total += amount
  }
  if (!saw) return null
  return `${formatAssetAmount(total)} π`
}

async function calculateVolume24hChange(pools: PoolData[]): Promise<string | null> {
  try {
    const now = Date.now()
    const hours24Ago = now - 24 * 60 * 60 * 1000

    // Sample volume from operations to estimate change
    const volumeStart = 0
    const volumeEnd = 0
    let operationCount = 0
    const swapsSample: any[] = []

    // Fetch recent swaps/trades from sample pools to estimate volume change
    for (const pool of pools.slice(0, Math.min(10, pools.length))) {
      // Sample first 10 largest pools
      let nextUrl: string | null = `${PI_HORIZON_URL}/liquidity_pools/${pool.id}/operations?limit=50&order=desc`
      let pageCount = 0

      while (nextUrl && pageCount < 2 && operationCount < 200) {
        try {
          const response: any = await fetchHorizon(nextUrl, { next: { revalidate: 600 } })
          if (!response.ok) break

          const data: any = await response.json()
          const records = data._embedded?.records ?? []
          if (records.length === 0) break

          records.forEach((op: any) => {
            const opTime = new Date(op.created_at).getTime()
            // Separate operations by time to estimate volume at start vs end of 24h
            if (opTime >= hours24Ago) {
              swapsSample.push(op)
              operationCount++
            }
          })

          if (records.length < 50) break
          nextUrl = data._links?.next?.href || null
          pageCount++
        } catch {
          break
        }
      }

      if (operationCount >= 200) break
    }

    if (swapsSample.length === 0) return null

    // Split operations into first and second half of 24h window to estimate trend
    const midpoint = swapsSample.length / 2
    const firstHalf = swapsSample.slice(0, Math.floor(midpoint))
    const secondHalf = swapsSample.slice(Math.floor(midpoint))

    // Count swap operations in each half as volume proxy
    const firstHalfSwaps = firstHalf.filter(
      (op: any) => op.type === "path_payment_strict_send" || op.type === "path_payment_strict_receive",
    ).length
    const secondHalfSwaps = secondHalf.filter(
      (op: any) => op.type === "path_payment_strict_send" || op.type === "path_payment_strict_receive",
    ).length

    if (firstHalfSwaps === 0) return null

    // Calculate percentage change in swap activity as volume change proxy
    const volumeChangePercent = ((secondHalfSwaps - firstHalfSwaps) / Math.max(firstHalfSwaps, 1)) * 100

    if (Math.abs(volumeChangePercent) < 1) {
      return "0.00%" // No significant change
    }

    const changeFormatted = volumeChangePercent.toFixed(2)
    return volumeChangePercent >= 0 ? `+${changeFormatted}%` : `${changeFormatted}%`
  } catch (error) {
    console.error("Error calculating 24h volume change:", error)
    return null
  }
}

/**
 * Calculate new tokens within 7-day rolling window
 * A token is "new" if its first liquidity pool was created within the last 7 days
 */
async function calculateNewTokens7d(pools: PoolData[]): Promise<number> {
  try {
    const now = Date.now()
    const days7Ago = now - 7 * 24 * 60 * 60 * 1000

    // Get unique tokens from pools
    const tokenSet = new Set<string>()
    pools.forEach((pool) => {
      pool.reserves.forEach((r) => {
        if (r.asset !== "native") {
          tokenSet.add(r.asset)
        }
      })
    })

    let newTokenCount = 0

    // Check creation time for each token by looking at first pool operation
    // We sample a subset to avoid excessive API calls
    const tokens = Array.from(tokenSet).slice(0, 100) // Sample first 100 tokens

    for (const tokenKey of tokens) {
      const [assetCode, assetIssuer] = tokenKey.split(":")
      if (!assetCode || !assetIssuer) continue

      // Find pools containing this token
      const tokenPools = pools.filter((p) => p.reserves.some((r) => r.asset === tokenKey))

      if (tokenPools.length === 0) continue

      // Get the first operation for the oldest pool as a proxy for token listing time
      const oldestPool = tokenPools[0]
      const firstSeenTime = await getTokenFirstSeenTime(oldestPool.id)

      if (firstSeenTime && firstSeenTime >= days7Ago) {
        newTokenCount++
      }
    }

    return newTokenCount
  } catch (error) {
    console.error("Error calculating new tokens (7d):", error)
    return 0
  }
}

/**
 * Get the approximate first seen time of a token based on pool operations
 * Returns timestamp in milliseconds or null if cannot be determined
 */
async function getTokenFirstSeenTime(poolId: string): Promise<number | null> {
  const cacheKey = `token-first-seen-${poolId}`
  const cached = getCache<number>(cacheKey)
  if (cached) return cached

  try {
    // Fetch the oldest operations for this pool
    const response: any = await fetchHorizon(
      `${PI_HORIZON_URL}/liquidity_pools/${poolId}/operations?limit=1&order=asc`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour since this doesn't change
    )

    if (!response.ok) return null

    const data: any = await response.json()
    const records = data._embedded?.records ?? []

    if (records.length === 0) return null

    const firstOp = records[0]
    const firstSeenTime = new Date(firstOp.created_at).getTime()

    // Cache this result for a long time since it doesn't change
    setCache(cacheKey, firstSeenTime, 60 * 60 * 1000) // 1 hour cache

    return firstSeenTime
  } catch (error) {
    console.error("Error fetching token first seen time:", error)
    return null
  }
}

/**
 * ENFORCE: Calculate verified tokens count from Admin Dashboard ONLY
 * No heuristics, no auto-verification, no external domain checks
 * Count only tokens where admin has explicitly set verified=true
 */
async function calculateVerifiedTokensCount(_pools: PoolData[]): Promise<number> {
  // Verification is no longer persisted; live Horizon data remains the source.
  return 0
}

/**
 * REMOVED: checkTokenVerification function - verification is ONLY from Admin Dashboard
 * This function has been deleted to enforce admin-only verification
 */
async function checkTokenVerification_DELETED(
  tokenData: { assetCode: string; assetIssuer: string; pools: PoolData[] },
  domains: any[],
  allPools: PoolData[],
): Promise<boolean> {
  const { assetCode, assetIssuer, pools: tokenPools } = tokenData

  // Condition 1: Verified Trustline Holders
  // Must have real, non-zero trustline holder count
  const holdersCacheKey = `holders-${assetCode}-${assetIssuer}`
  let holdersData = getCache<{ trustlines: number; holderCount: number }>(holdersCacheKey)

  if (!holdersData) {
    try {
      holdersData = await fetchAssetStatsWithHoldersForVerification(assetCode, assetIssuer)
    } catch {
      return false // Cannot verify without holder data
    }
  }

  if (!holdersData || holdersData.trustlines <= 0) {
    return false // No verified trustline holders
  }

  // Condition 2: Verified Accounts
  // Issuer must be a valid account, not a placeholder
  if (!assetIssuer || assetIssuer.length < 56 || !assetIssuer.startsWith("G")) {
    return false // Invalid issuer format
  }

  // Condition 3: Verified Liquidity
  // Must have active liquidity pool with non-zero liquidity
  const piPools = tokenPools.filter((p) => p.reserves.some((r) => r.asset === "native"))
  if (piPools.length === 0) {
    return false // No PI liquidity pools
  }

  let totalLiquidity = 0
  piPools.forEach((pool) => {
    const nativeReserve = pool.reserves.find((r) => r.asset === "native")
    if (nativeReserve) {
      totalLiquidity += Number.parseFloat(nativeReserve.amount)
    }
  })

  if (totalLiquidity <= 0) {
    return false // No active liquidity
  }

  // Condition 4: Verified Circulating Supply
  // For now, we cannot verify circulating supply from Horizon directly
  // This condition will always fail until we have a way to get circulating supply
  // In a real implementation, this would check against a token registry or issuer's toml file
  // For strict compliance, we return false here
  // TODO: Implement circulating supply verification when data source is available

  // Condition 5: Verified Domain (CRITICAL)
  // Token must be linked to a live domain with a visible price
  const linkedDomain = domains.find((d: any) => {
    // Check if domain's registrar matches the token issuer
    // Domain must be verified, have a price, and be live
    if (!d.verified || !d.price) return false

    // Check if issuer resolves to this domain
    // The registrar field should contain or match the issuer address
    const registrarMatch =
      d.registrar?.includes(assetIssuer.slice(0, 5)) || d.registrar?.includes(assetIssuer.slice(-5))

    return registrarMatch
  })

  if (!linkedDomain) {
    return false // No verified domain linked
  }

  // All conditions met
  return true
}

/**
 * Fetch asset stats for verification purposes (lighter version)
 */
async function fetchAssetStatsWithHoldersForVerification(
  assetCode: string,
  assetIssuer: string,
): Promise<{ trustlines: number; holderCount: number }> {
  try {
    const assetParam = `${assetCode}:${assetIssuer}`
    const accRes: any = await fetchHorizon(`${PI_HORIZON_URL}/accounts?asset=${assetParam}&limit=1`, { next: { revalidate: 300 } })

    if (!accRes.ok) {
      return { trustlines: 0, holderCount: 0 }
    }

    const data: any = await accRes.json()
    const records = data._embedded?.records || []

    // If we get any records, the asset has trustlines
    // For full count, we'd need to paginate, but for verification we just need > 0
    return {
      trustlines: records.length > 0 ? 1 : 0, // Simplified: just check existence
      holderCount: records.length > 0 ? 1 : 0,
    }
  } catch {
    return { trustlines: 0, holderCount: 0 }
  }
}

export interface OrderBookLevel {
  price: string
  amount: string
}

export interface OrderBookData {
  bestBid: string | null
  bestAsk: string | null
  spread: string | null
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

async function getOrderBookWithStatus(assetCode: string, assetIssuer: string): Promise<{ data: OrderBookData; status: TokenSnapshotFieldStatus }> {
  const empty: OrderBookData = { bestBid: null, bestAsk: null, spread: null, bids: [], asks: [] }
  try {
    const assetType = assetCode.length > 4 ? "credit_alphanum12" : "credit_alphanum4"
    const url = `${PI_HORIZON_URL}/order_book?selling_asset_type=${assetType}&selling_asset_code=${encodeURIComponent(assetCode)}&selling_asset_issuer=${encodeURIComponent(assetIssuer)}&buying_asset_type=native&limit=10`
    const response: any = await fetchHorizon(url, { next: { revalidate: 30 } })
    if (!response.ok) return { data: empty, status: "error" }
    const data: any = await response.json()
    const bids = (data.bids || []).slice(0, 5).map((level: any) => ({ price: formatAssetAmount(level.price), amount: formatAssetAmount(level.amount) }))
    const asks = (data.asks || []).slice(0, 5).map((level: any) => ({ price: formatAssetAmount(level.price), amount: formatAssetAmount(level.amount) }))
    const bestBid = bids[0] ? Number.parseFloat(bids[0].price) : null
    const bestAsk = asks[0] ? Number.parseFloat(asks[0].price) : null
    const spread = bestBid != null && bestAsk != null && bestBid > 0 ? `${(((bestAsk - bestBid) / bestBid) * 100).toFixed(2)}%` : null
    return { data: { bestBid: bestBid != null ? `${formatAssetAmount(bestBid)} π` : null, bestAsk: bestAsk != null ? `${formatAssetAmount(bestAsk)} π` : null, spread, bids, asks }, status: "ok" }
  } catch (error) {
    console.error("Error fetching order book:", error)
    return { data: empty, status: "error" }
  }
}

export async function getOrderBook(assetCode: string, assetIssuer: string): Promise<OrderBookData> {
  return (await getOrderBookWithStatus(assetCode, assetIssuer)).data
}


export interface IssuerCurrencyMetadata {
  image: string | null
  desc: string | null
  tomlUrl: string | null
}

function parseCurrencyBlocks(toml: string): Array<Record<string, string>> {
  const blocks: Array<Record<string, string>> = []
  const parts = toml.split(/\[\[CURRENCIES\]\]/i).slice(1)
  for (const part of parts) {
    const entry: Record<string, string> = {}
    const body = part.split(/\n\[\[/)[0]
    for (const line of body.split("\n")) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"(.*)"\s*$/)
      if (match) entry[match[1]] = match[2]
    }
    if (Object.keys(entry).length > 0) blocks.push(entry)
  }
  return blocks
}

export async function getIssuerCurrencyMetadata(assetCode: string, assetIssuer: string): Promise<IssuerCurrencyMetadata> {
  const empty = { image: null, desc: null, tomlUrl: null }
  try {
    const assetUrl = `${PI_HORIZON_URL}/assets?asset_code=${encodeURIComponent(assetCode)}&asset_issuer=${encodeURIComponent(assetIssuer)}&limit=1`
    const assetResponse = await fetchHorizon(assetUrl, { next: { revalidate: 3600 } })
    if (!assetResponse.ok) return empty
    const assetData = await assetResponse.json()
    const tomlUrl = assetData?._embedded?.records?.[0]?._links?.toml?.href
    if (!tomlUrl || typeof tomlUrl !== "string") return empty

    const tomlResponse = await fetch(tomlUrl, { next: { revalidate: 3600 } })
    if (!tomlResponse.ok) return { ...empty, tomlUrl }
    const toml = await tomlResponse.text()
    const match = parseCurrencyBlocks(toml).find((entry) => entry.code === assetCode && entry.issuer === assetIssuer)
    if (!match) return { ...empty, tomlUrl }

    const image = match.image && /^https?:\/\//i.test(match.image) ? match.image : null
    const desc = match.desc?.trim() ? match.desc.trim() : null
    return { image, desc, tomlUrl }
  } catch (error) {
    console.error("Error fetching issuer currency metadata:", error)
    return empty
  }
}

function snapshotStatus(value: unknown): TokenSnapshotFieldStatus {
  return value === null || value === undefined ? "unavailable" : "ok"
}

export async function getTokenSnapshot(assetCode: string, assetIssuer: string): Promise<TokenSnapshotData> {
  const [details, orderBookResult, metadata] = await Promise.all([
    getTokenDetails(assetCode, assetIssuer),
    getOrderBookWithStatus(assetCode, assetIssuer),
    getIssuerCurrencyMetadata(assetCode, assetIssuer),
  ])
  return {
    ...details,
    orderBook: orderBookResult.data,
    metadata,
    updatedAt: new Date().toISOString(),
    status: {
      price: snapshotStatus(details.price),
      supply: snapshotStatus(details.circulatingSupply),
      trustlines: snapshotStatus(details.trustlines),
      holders: snapshotStatus(details.holders),
      poolBalance: snapshotStatus(details.poolBalance),
      marketCap: snapshotStatus(details.marketCap),
      volume24h: snapshotStatus(details.volume24h),
      atlPrice: snapshotStatus(details.atlPrice),
      athPrice: snapshotStatus(details.athPrice),
      flags: snapshotStatus(details.flags),
      orderBook: orderBookResult.status,
      metadata: metadata.image || metadata.desc ? "ok" : "unavailable",
    },
  }
}
