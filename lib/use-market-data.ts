import useSWR from "swr"
import type { Token, LiquidityPool, MarketStats } from "@/lib/mock-data"

const REFRESH_INTERVALS = {
  TOKEN_LIST: 10 * 60 * 1000,
  POOLS: 15 * 60 * 1000,
  MARKET_STATS: 5 * 60 * 1000,
  MARKET_STATS_DEFERRED: 5 * 60 * 1000,
  PRICES: 2 * 60 * 1000,
  TOKEN_DETAILS: 0,
  POOL_VOLUME: 0,
  TOKEN_PRICE_HISTORY: 0,
} as const

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.json()
}

const baseSwrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 60000,
  errorRetryCount: 2,
  errorRetryInterval: 5000,
}

export function useTokenRegistry() {
  return useSWR<Token[]>("/api/explorer/tokens/registry", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.TOKEN_LIST,
  })
}

/** Fetch only when the liquidity-pools view is active. */
export function useLiquidityPools(enabled = true) {
  return useSWR<LiquidityPool[]>(enabled ? "/api/explorer/pools" : null, fetcher, {
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

export function useMarketStatsInstant() {
  return useSWR<MarketStatsInstant>("/api/explorer/market-stats/instant", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.MARKET_STATS,
  })
}

/** Starts only after instant market stats exist, keeping slow calculations off the initial request burst. */
export function useMarketStatsDeferred(enabled = true) {
  return useSWR<MarketStatsDeferred>(enabled ? "/api/explorer/market-stats/deferred" : null, fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.MARKET_STATS_DEFERRED,
    revalidateOnMount: true,
  })
}

export function useMarketStats() {
  const { data: instant, isLoading: instantLoading, error: instantError } = useMarketStatsInstant()
  const { data: deferred, isLoading: deferredLoading } = useMarketStatsDeferred(Boolean(instant))

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
    isLoading: instantLoading,
    isDeferredLoading: deferredLoading,
    error: instantError,
  }
}

interface TokenPriceData {
  price: string | null
  liquidity: string | null
  totalLiquidity?: string | null
}

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

export function useTokenDetails(assetCode: string | null, issuer: string | null) {
  const shouldFetch = Boolean(assetCode && issuer)
  return useSWR<TokenDetailsResponse>(
    shouldFetch ? `/api/explorer/tokens/${assetCode}/details?issuer=${issuer}` : null,
    fetcher,
    {
      ...baseSwrConfig,
      refreshInterval: REFRESH_INTERVALS.TOKEN_DETAILS,
      revalidateOnMount: true,
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

export function usePoolVolume(poolId: string | null) {
  return useSWR<PoolVolumeResponse>(poolId ? `/api/explorer/pools/${poolId}/volume` : null, fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.POOL_VOLUME,
    revalidateOnMount: true,
  })
}

export function useDomains(enabled = false) {
  return useSWR("/api/explorer/domains", fetcher, {
    ...baseSwrConfig,
    refreshInterval: 60 * 60 * 1000,
    isPaused: () => !enabled,
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

export function useTokenPriceHistory(assetCode: string | null, issuer: string | null) {
  const shouldFetch = Boolean(assetCode && issuer)
  return useSWR<TokenPriceHistoryResponse>(
    shouldFetch ? `/api/tokens/${assetCode}/price-history?issuer=${issuer}` : null,
    fetcher,
    {
      ...baseSwrConfig,
      refreshInterval: REFRESH_INTERVALS.TOKEN_PRICE_HISTORY,
      revalidateOnMount: true,
    },
  )
}
