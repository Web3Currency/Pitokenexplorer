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

// Cache TTLs in milliseconds (using upper bounds of specified ranges)
export const CACHE_TTL = {
  TOKEN_LIST: 10 * 60 * 1000, // 10 minutes
  LIQUIDITY_POOLS: 15 * 60 * 1000, // 15 minutes
  MARKET_STATS: 5 * 60 * 1000, // 5 minutes
  PRICES: 2 * 60 * 1000, // 2 minutes
  TRUSTLINES_HOLDERS: 60 * 60 * 1000, // 60 minutes
  DOMAINS: 60 * 60 * 1000, // 60 minutes (static data)
  POOL_VOLUME: 10 * 60 * 1000, // 10 minutes
  TOKEN_PRICE_HISTORY: 10 * 60 * 1000, // 10 minutes
} as const

// In-memory cache store
const cache = new Map<string, CacheEntry<any>>()

// Cache keys for different data types
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
 * Get cached data if valid, otherwise return null
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now >= entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

/**
 * Set cache with specified TTL
 */
export function setCache<T>(key: string, data: T, ttl: number): void {
  const now = Date.now()
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  })
}

/**
 * Check if cache entry exists and is still valid
 */
export function isCacheValid(key: string): boolean {
  const entry = cache.get(key)
  if (!entry) return false
  return Date.now() < entry.expiresAt
}

/**
 * Get cache timestamp (for debugging/headers)
 */
export function getCacheTimestamp(key: string): number | null {
  const entry = cache.get(key)
  return entry?.timestamp ?? null
}

/**
 * Clear specific cache key
 */
export function clearCache(key: string): void {
  cache.delete(key)
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  cache.clear()
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { keys: string[]; size: number } {
  return {
    keys: Array.from(cache.keys()),
    size: cache.size,
  }
}
