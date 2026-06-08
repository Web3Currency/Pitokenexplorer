/**
 * Custom hooks for market data fetching with independent refresh intervals
 *
 * Refresh intervals (as specified):
 * - Token lists: 10 minutes (600,000ms)
 * - Liquidity pools: 15 minutes (900,000ms)
 * - Market stats: 5 minutes (300,000ms)
 * - Market stats deferred (24h changes): 5 minutes (300,000ms) - fetched AFTER instant
 * - Prices: 2 minutes (120,000ms)
 * - Token details (trustlines/holders): 60 minutes (on-demand only, no polling)
 * - Pool volume data: 10 minutes (server-side cache)
 * - Token price history: 10 minutes (server-side cache)
 *
 * Key optimizations:
 * - Each data type has its own independent interval
 * - No data refreshes on tab switches, scrolling, or re-renders
 * - Lazy loading for token details (only when dialog opens)
 * - Lazy loading for pool volume data (only when poolId is provided)
 * - Lazy loading for token price history (only when assetCode and issuer are provided)
 * - No aggressive background polling
 * - Market stats split into instant (renders immediately) and deferred (24h changes)
 */

import useSWR from "swr"
import type { Token, LiquidityPool, MarketStats } from "@/lib/mock-data"

// Refresh intervals in milliseconds
const REFRESH_INTERVALS = {
  TOKEN_LIST: 10 * 60 * 1000, // 10 minutes
  POOLS: 15 * 60 * 1000, // 15 minutes
  MARKET_STATS: 5 * 60 * 1000, // 5 minutes
  MARKET_STATS_DEFERRED: 5 * 60 * 1000, // 5 minutes
  PRICES: 2 * 60 * 1000, // 2 minutes
  TOKEN_DETAILS: 0, // No automatic refresh - on-demand only
  POOL_VOLUME: 0, // No automatic refresh - uses server cache
  TOKEN_PRICE_HISTORY: 0, // No automatic refresh - uses server cache
} as const

// Fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.json()
}

/**
 * SWR configuration to prevent unnecessary re-fetches
 */
const baseSwrConfig = {
  revalidateOnFocus: false, // Don't refresh on tab switch
  revalidateOnReconnect: false, // Don't refresh on network reconnect
  revalidateIfStale: false, // Don't auto-refresh stale data
  dedupingInterval: 60000, // Dedupe requests within 1 minute
  errorRetryCount: 2, // Limit retries
  errorRetryInterval: 5000, // 5 second retry delay
}

/**
 * Hook for token registry (light data only)
 * Refreshes every 10 minutes
 */
export function useTokenRegistry() {
  return useSWR<Token[]>("/api/explorer/tokens/registry", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.TOKEN_LIST,
  })
}

/**
 * Hook for liquidity pools
 * Refreshes every 15 minutes
 */
export function useLiquidityPools() {
  return useSWR<LiquidityPool[]>("/api/explorer/pools", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.POOLS,
  })
}

interface MarketStatsInstant {
  liquidity: string
  tokenCount: number
  poolCount: number
  largestPool: string
  largestPoolLiquidity: string
  activePools: number
  network: string
}

interface MarketStatsDeferred {
  liquidityChange: string | null
  volume24hChange: string | null
  tokenCountChange: string | null
  newTokens7d?: number
  verifiedTokensCount?: number
}

interface CombinedMarketStats extends MarketStatsInstant {
  liquidityChange?: string | null
  volume24hChange?: string | null
  tokenCountChange?: string | null
  newTokens7d?: number
  verifiedTokensCount?: number
}

/**
 * Hook for instant market stats (renders immediately)
 * New hook that fetches only instant stats for immediate render
 */
export function useMarketStatsInstant() {
  return useSWR<MarketStatsInstant>("/api/explorer/market-stats/instant", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.MARKET_STATS,
  })
}

/**
 * Hook for deferred market stats (24h changes - fetched after UI renders)
 * New hook for slow 24h change calculations
 */
export function useMarketStatsDeferred() {
  return useSWR<MarketStatsDeferred>("/api/explorer/market-stats/deferred", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.MARKET_STATS_DEFERRED,
    // Lower priority - let instant stats render first
    revalidateOnMount: true,
  })
}

/**
 * Hook for market stats (combined instant + deferred)
 * Now uses progressive loading - instant first, then deferred
 * Refreshes every 5 minutes
 */
export function useMarketStats() {
  const { data: instant, isLoading: instantLoading, error: instantError } = useMarketStatsInstant()
  const { data: deferred, isLoading: deferredLoading } = useMarketStatsDeferred()

  // Combine instant and deferred data
  const combinedData: CombinedMarketStats | undefined = instant
    ? {
        ...instant,
        liquidityChange: deferred?.liquidityChange ?? null,
        volume24hChange: deferred?.volume24hChange ?? null,
        tokenCountChange: deferred?.tokenCountChange ?? null,
        newTokens7d: deferred?.newTokens7d ?? null,
        verifiedTokensCount: deferred?.verifiedTokensCount ?? null,
      }
    : undefined

  return {
    data: combinedData as MarketStats | undefined,
    isLoading: instantLoading, // Only block on instant stats
    isDeferredLoading: deferredLoading,
    error: instantError,
  }
}

interface TokenPriceData {
  price: string | null
  liquidity: string | null
  totalLiquidity?: string | null
}

/**
 * Hook for all token prices (bulk endpoint)
 * Refreshes every 2 minutes
 */
export function useTokenPrices() {
  return useSWR<Record<string, TokenPriceData>>("/api/explorer/tokens/prices", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.PRICES,
  })
}

interface TokenDetailsResponse {
  id: string
  price: string | null
  liquidity: string | null
  totalLiquidity?: string | null
  trustlines: number
  holders: number
  circulatingSupply: null
  poolId: string | null
  athPrice?: string | null
  atlPrice?: string | null
}

/**
 * Hook for individual token details (trustlines, holders, etc.)
 * NO automatic refresh - only fetches when token is provided
 * This is the expensive operation, so we lazy load it
 */
export function useTokenDetails(assetCode: string | null, issuer: string | null) {
  const shouldFetch = assetCode && issuer

  return useSWR<TokenDetailsResponse>(
    shouldFetch ? `/api/explorer/tokens/${assetCode}/details?issuer=${issuer}` : null,
    fetcher,
    {
      ...baseSwrConfig,
      refreshInterval: REFRESH_INTERVALS.TOKEN_DETAILS, // No auto-refresh
      revalidateOnMount: true, // Fetch on first mount when key is provided
    },
  )
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

/**
 * Hook for pool volume data (lazy-loaded)
 * NO automatic refresh - only fetches when poolId is provided
 * Data is cached server-side for 10 minutes
 */
export function usePoolVolume(poolId: string | null) {
  return useSWR<PoolVolumeResponse>(poolId ? `/api/explorer/pools/${poolId}/volume` : null, fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.POOL_VOLUME, // No auto-refresh - uses server cache
    revalidateOnMount: true, // Fetch on first mount when key is provided
  })
}

/**
 * Hook for domains (static data, very long cache)
 */
export function useDomains() {
  return useSWR("/api/explorer/domains", fetcher, {
    ...baseSwrConfig,
    refreshInterval: 60 * 60 * 1000, // 1 hour
  })
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
 * Hook for token price history data (lazy-loaded)
 * NO automatic refresh - only fetches when assetCode and issuer are provided
 * Data is cached server-side for 10 minutes
 */
export function useTokenPriceHistory(assetCode: string | null, issuer: string | null) {
  const shouldFetch = assetCode && issuer

  return useSWR<TokenPriceHistoryResponse>(
    shouldFetch ? `/api/tokens/${assetCode}/price-history?issuer=${issuer}` : null,
    fetcher,
    {
      ...baseSwrConfig,
      refreshInterval: REFRESH_INTERVALS.TOKEN_PRICE_HISTORY, // No auto-refresh - uses server cache
      revalidateOnMount: true, // Fetch on first mount when key is provided
    },
  )
}
