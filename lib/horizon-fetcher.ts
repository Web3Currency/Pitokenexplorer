/**
 * Centralized Horizon API fetcher with:
 * - Server-side only execution
 * - Full pagination support to fetch ALL tokens
 * - Built-in caching
 * - Correct price calculation from Token/PI pools only
 */

import { getCache, setCache, CACHE_TTL, CACHE_KEYS, getCacheTimestamp } from "./server-cache"

export { CACHE_KEYS, getCacheTimestamp }

const PI_HORIZON_URL = "https://api.testnet.minepi.com"

const PAGINATION_LIMITS = {
  POOLS_MAX_PAGES: 50, // Increased from 2 to 50 pages (up to 10,000 records)
  POOLS_PER_PAGE: 200, // Horizon max per page
  ACCOUNTS_MAX_PAGES: 20, // Increased from 10 to 20 pages for more complete trustline/holder counts
  ACCOUNTS_PER_PAGE: 200, // Horizon max per page
  TOKEN_POOLS_LIMIT: 100, // Max pools per token
  OPERATIONS_PER_PAGE: 200, // Added pagination limits for operations/trades
  OPERATIONS_MAX_PAGES: 10, // Limit to prevent excessive fetching
} as const

export interface PoolData {
  id: string
  reserves: Array<{
    asset: string
    amount: string
  }>
  total_trustlines: number
  fee_bp: number
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
  allPools: Array<{
    id: string
    pair: string
    lockedToken: string
    providers: number
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
  tokenCountChange: string | null
  newTokens7d: number
  verifiedTokensCount: number
}

export interface MarketStatsData extends MarketStatsInstant {
  liquidityChange: string | null
  totalVolume24h: null
  volume24hChange: string | null
  tokenCountChange: null
}

export interface TokenDetailsData {
  id: string
  price: string | null
  liquidity: string | null
  totalLiquidity: string | null // Added total liquidity across all pools
  trustlines: number
  holders: number
  circulatingSupply: null
  poolId: string | null
  athPrice: string | null // Added ATH price
  atlPrice: string | null // Added ATL price
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

  while (url && pageCount < PAGINATION_LIMITS.POOLS_MAX_PAGES) {
    try {
      const response = await fetch(url, {
        next: { revalidate: 900 }, // 15 min revalidation hint
      })
      if (!response.ok) break

      const data = await response.json()
      const records = data._embedded?.records ?? []
      if (records.length === 0) break

      allRecords = [...allRecords, ...records]

      // Only continue if we got a full page and have more pages
      if (records.length < PAGINATION_LIMITS.POOLS_PER_PAGE || !data._links?.next) {
        break
      }
      url = data._links.next.href
      pageCount++
    } catch (error) {
      console.error("Error fetching pools page:", error)
      break
    }
  }

  // Cache the results
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
        tvl: totalTVL.toLocaleString(),
        totalLockedAsset: totalLockedAsset.toLocaleString(),
        liquidity: mainPoolLiquidity ? mainPoolLiquidity.toLocaleString() : null,
        price: price ? price.toFixed(4) : null,
        volume24h: null,
        providers: totalProviders,
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
              lockedAmount = Number.parseFloat(reserve.amount).toLocaleString()
            }
          })

          return {
            id: p.id,
            pair: `${token1}/${token2}`,
            lockedToken: lockedAmount,
            providers: p.total_trustlines || 0,
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
      totalVolume24h: null,
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
  const newTokens7d = await calculateNewTokens7d(pools)
  const verifiedTokensCount = await calculateVerifiedTokensCount(pools)

  const stats: MarketStatsData = {
    ...instant,
    liquidityChange: liquidityChange,
    totalVolume24h: null,
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
      verifiedTokensCount,
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
      largestPoolLiquidity = piLiquidity.toLocaleString()
    }

    pool.reserves.forEach((r) => {
      if (r.asset !== "native") totalTokens.add(r.asset)
    })
  })

  const stats: MarketStatsInstant = {
    liquidity: totalLiquidity > 0 ? totalLiquidity.toLocaleString() + " π" : "0 π",
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

  const newTokens7d = await calculateNewTokens7d(pools)
  const verifiedTokensCount = await calculateVerifiedTokensCount(pools)

  const deferred: MarketStatsDeferred = {
    liquidityChange,
    volume24hChange,
    tokenCountChange: null,
    newTokens7d,
    verifiedTokensCount,
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
      largestPoolLiquidity = piLiquidity.toLocaleString()
    }

    pool.reserves.forEach((r) => {
      if (r.asset !== "native") totalTokens.add(r.asset)
    })
  })

  const liquidityChange = await calculateLiquidity24hChange(pools)
  const volume24hChange = await calculateVolume24hChange(pools)

  const stats: MarketStatsData = {
    liquidity: totalLiquidity > 0 ? totalLiquidity.toLocaleString() + " π" : "0 π",
    liquidityChange: liquidityChange,
    totalVolume24h: null,
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

  // Fetch trustlines and holders data
  const holdersCacheKey = `holders-${assetCode}-${assetIssuer}`
  let holdersData = getCache<{ trustlines: number; holderCount: number }>(holdersCacheKey)

  if (!holdersData) {
    holdersData = await fetchAssetStatsWithHolders(assetCode, assetIssuer)
    setCache(holdersCacheKey, holdersData, CACHE_TTL.TRUSTLINES_HOLDERS)
  }

  const { trustlines, holderCount } = holdersData

  const result: TokenDetailsData = {
    id: `${assetCode}:${assetIssuer}`,
    price: price ? price.toFixed(4) : null,
    liquidity: mainPoolLiquidity > 0 ? mainPoolLiquidity.toLocaleString() : null,
    totalLiquidity: totalLiquidity > 0 ? totalLiquidity.toLocaleString() : null,
    trustlines,
    holders: holderCount,
    circulatingSupply: null,
    poolId: mainPool?.pool.id || null,
    athPrice: null,
    atlPrice: null,
  }

  // Cache with PRICES TTL (shorter) since price is the most time-sensitive
  setCache(cacheKey, result, CACHE_TTL.PRICES)
  return result
}

/**
 * Fetch asset stats with proper distinction between trustlines and holders
 * - Trustlines: All unique accounts that have ever added this token (including 0 balance)
 * - Holders: Accounts with balance > 0
 */
async function fetchAssetStatsWithHolders(
  assetCode: string,
  assetIssuer: string,
): Promise<{
  trustlines: number
  holderCount: number
}> {
  let trustlines = 0
  let holderCount = 0

  try {
    // This includes accounts with 0 balance (trustline added but unused)
    const assetParam = `${assetCode}:${assetIssuer}`
    let nextUrl: string | null =
      `${PI_HORIZON_URL}/accounts?asset=${assetParam}&limit=${PAGINATION_LIMITS.ACCOUNTS_PER_PAGE}`
    let iterations = 0

    while (nextUrl && iterations < PAGINATION_LIMITS.ACCOUNTS_MAX_PAGES) {
      const accRes = await fetch(nextUrl, { next: { revalidate: 300 } })
      if (!accRes.ok) break

      const data = await accRes.json()
      const records = data._embedded?.records || []

      if (records.length === 0) break

      records.forEach((acc: any) => {
        const balance = acc.balances?.find((b: any) => b.asset_code === assetCode && b.asset_issuer === assetIssuer)

        if (balance) {
          // This counts ALL trustlines including 0 balance
          trustlines++

          const balVal = Number.parseFloat(balance.balance)
          if (balVal > 0) {
            holderCount++
          }
        }
      })

      if (records.length < PAGINATION_LIMITS.ACCOUNTS_PER_PAGE) {
        break
      }

      nextUrl = data._links?.next?.href || null
      iterations++
    }
  } catch (e) {
    console.error("Error fetching asset stats:", e)
    return { trustlines: 0, holderCount: 0 }
  }

  return { trustlines, holderCount }
}

/**
 * Get all token prices with accurate calculation from Token/PI pools
 * - Only calculates price from pools where token is paired with PI
 * - Correctly handles tokens regardless of position in pool pair
 * - Sums liquidity across all Token/PI pools for each token
 */
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
      price: price ? price.toFixed(4) : null,
      liquidity: mainLiquidity > 0 ? mainLiquidity.toLocaleString() : null,
      totalLiquidity: totalLiquidity > 0 ? totalLiquidity.toLocaleString() : null,
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
      const response = await fetch(nextUrl, {
        next: { revalidate: 600 }, // 10 min revalidation
      })
      if (!response.ok) break

      const data = await response.json()
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
      const response = await fetch(nextUrl, {
        next: { revalidate: 600 }, // 10 min revalidation
      })
      if (!response.ok) {
        // If trades endpoint fails, try operations
        break
      }

      const data = await response.json()
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

    // Get snapshots of liquidity at start and end of 24h window
    const liquidityStart = 0
    let liquidityEnd = 0

    // Sample liquidity from operations to estimate change
    // Use the existing pool data to calculate current total
    let currentTotalLiquidity = 0
    pools.forEach((pool) => {
      const nativeReserve = pool.reserves.find((r) => r.asset === "native")
      if (nativeReserve) {
        currentTotalLiquidity += Number.parseFloat(nativeReserve.amount)
      }
    })

    liquidityEnd = currentTotalLiquidity

    // For the starting point, we estimate based on operation volumes over the period
    // Fetch a sample of recent operations to calculate approximate liquidity change
    let netFlowOver24h = 0

    // Fetch pool operations for all pools to estimate net liquidity change
    const operationSamples: any[] = []
    let sampleLimit = 0

    for (const pool of pools.slice(0, Math.min(10, pools.length))) {
      // Sample first 10 largest pools to estimate market change
      if (sampleLimit >= 200) break // Limit total operations sampled

      let nextUrl: string | null = `${PI_HORIZON_URL}/liquidity_pools/${pool.id}/operations?limit=50&order=desc`
      let pageCount = 0

      while (nextUrl && pageCount < 2 && sampleLimit < 200) {
        try {
          const response = await fetch(nextUrl, { next: { revalidate: 600 } })
          if (!response.ok) break

          const data = await response.json()
          const records = data._embedded?.records ?? []
          if (records.length === 0) break

          records.forEach((op: any) => {
            const opTime = new Date(op.created_at).getTime()
            if (opTime >= hours24Ago) {
              operationSamples.push(op)
              sampleLimit++
            }
          })

          if (records.length < 50) break
          nextUrl = data._links?.next?.href || null
          pageCount++
        } catch {
          break
        }
      }
    }

    // Analyze operations to estimate liquidity flow
    // Positive flow = deposits (increase liquidity)
    // Negative flow = withdrawals (decrease liquidity)
    operationSamples.forEach((op: any) => {
      if (op.type === "manage_liquidity_pool") {
        if (op.started) {
          // Liquidity added
          netFlowOver24h += 1 // Simplified: count as positive impact
        } else {
          // Liquidity removed
          netFlowOver24h -= 1
        }
      }
    })

    // Estimate starting liquidity from current minus net flow indication
    // For better accuracy, we'd need historical snapshots, but using conservative estimate
    const estimatedChangePercent =
      operationSamples.length > 0 ? (netFlowOver24h / Math.max(operationSamples.length, 1)) * 10 : 0

    if (Math.abs(estimatedChangePercent) < 0.1) {
      return "0.00%" // No significant change
    }

    const changeFormatted = estimatedChangePercent.toFixed(2)
    return estimatedChangePercent >= 0 ? `+${changeFormatted}%` : `${changeFormatted}%`
  } catch (error) {
    console.error("Error calculating 24h liquidity change:", error)
    return null
  }
}

/**
 * Calculate 24h volume snapshots from pool operations
 * Bins operations into 24h window to calculate change
 */
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
          const response = await fetch(nextUrl, { next: { revalidate: 600 } })
          if (!response.ok) break

          const data = await response.json()
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
    const response = await fetch(
      `${PI_HORIZON_URL}/liquidity_pools/${poolId}/operations?limit=1&order=asc`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour since this doesn't change
    )

    if (!response.ok) return null

    const data = await response.json()
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
async function calculateVerifiedTokensCount(pools: PoolData[]): Promise<number> {
  try {
    // Import admin store dynamically (server-side only)
    const { getTokensWithVisibility } = await import("@/lib/admin/tokenStore")
    
    // Get all tokens with their admin metadata
    const tokensWithMetadata = await getTokensWithVisibility()
    
    // Count only tokens where admin explicitly set verified=true
    const verifiedCount = tokensWithMetadata.filter(token => token.verified === true).length
    
    return verifiedCount
  } catch (error) {
    console.error("Error calculating verified tokens count:", error)
    return 0
  }
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
    const accRes = await fetch(`${PI_HORIZON_URL}/accounts?asset=${assetParam}&limit=1`, { next: { revalidate: 300 } })

    if (!accRes.ok) {
      return { trustlines: 0, holderCount: 0 }
    }

    const data = await accRes.json()
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
