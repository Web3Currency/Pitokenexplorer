/**
 * Server-side in-memory cache with TTL support
 * Implements per-data-type caching with strict refresh intervals:
 * - Token lists: 5-10 minutes
 * - Liquidity pools: 10-15 minutes
 * - Market stats: 5 minutes
 * - Prices (from token/PI pools): 1-2 minutes
 * - Trustlines/holders: 30-60 minutes
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

export const CACHE_TTL = {
  TOKEN_LIST: 10 * 60 * 1000,
  LIQUIDITY_POOLS: 15 * 60 * 1000,
  MARKET_STATS: 5 * 60 * 1000,
  PRICES: 2 * 60 * 1000,
  TRUSTLINES_HOLDERS: 60 * 60 * 1000,
  DOMAINS: 60 * 60 * 1000,
  POOL_VOLUME: 10 * 60 * 1000,
  TOKEN_PRICE_HISTORY: 10 * 60 * 1000,
} as const

// Keep the process-local cache bounded. Detail/history endpoints can create
// many unique keys over time, so an unbounded Map would slowly consume memory.
const MAX_CACHE_ENTRIES = 250

const cache = new Map<string, CacheEntry<any>>()

export const CACHE_KEYS = {
  TOKEN_REGISTRY: "token-registry",
  LIQUIDITY_POOLS: "liquidity-pools",
  MARKET_STATS: "market-stats",
  DOMAINS: "domains",
  TOKEN_DETAILS: (assetCode: string, issuer: string) => `token-details-${assetCode}-${issuer}`,
  POOL_PRICES: "pool-prices",
  POOL_VOLUME: (poolId: string) => `pool-volume-${poolId}`,
  TOKEN_PRICE_HISTORY: (assetCode: string, issuer: string) => `token-price-history-${assetCode}-${issuer}`,
} as const

/**
 * Remove expired entries and evict the least-recently-used entries when the
 * process-local cache reaches its maximum size.
 */
function pruneCache(): void {
  const now = Date.now()

  for (const [key, entry] of cache) {
    if (now >= entry.expiresAt) {
      cache.delete(key)
    }
  }

  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (!oldestKey) break
    cache.delete(oldestKey)
  }
}

/**
 * Get cached data if valid. A cache hit refreshes recency so frequently used
 * entries survive bounded-cache eviction longer than cold entries.
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now >= entry.expiresAt) {
    cache.delete(key)
    return null
  }

  // Refresh insertion order to implement LRU behavior.
  cache.delete(key)
  cache.set(key, entry)

  return entry.data as T
}

/**
 * Set cache with specified TTL.
 */
export function setCache<T>(key: string, data: T, ttl: number): void {
  // Updating an existing key should also make it the most recently used entry.
  cache.delete(key)
  pruneCache()

  const now = Date.now()
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  })
}

export function isCacheValid(key: string): boolean {
  const entry = cache.get(key)
  if (!entry) return false

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key)
    return false
  }

  return true
}

export function getCacheTimestamp(key: string): number | null {
  const entry = cache.get(key)
  return entry?.timestamp ?? null
}

export function clearCache(key: string): void {
  cache.delete(key)
}

export function clearAllCache(): void {
  cache.clear()
}

export function getCacheStats(): { keys: string[]; size: number } {
  return {
    keys: Array.from(cache.keys()),
    size: cache.size,
  }
}
