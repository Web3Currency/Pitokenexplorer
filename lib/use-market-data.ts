import { useEffect, useState } from "react"
import useSWR from "swr"
import type { Token, LiquidityPool, MarketStats } from "@/lib/mock-data"

const REFRESH_INTERVALS = {
  TOKEN_LIST: 10 * 60 * 1000,
  POOLS: 15 * 60 * 1000,
  MARKET_STATS: 5 * 60 * 1000,
  MARKET_STATS_DEFERRED: 5 * 60 * 1000,
  PRICES: 2 * 60 * 1000,
  TOKEN_DETAILS: 30 * 1000,
  POOL_VOLUME: 0,
  TOKEN_PRICE_HISTORY: 0,
} as const

const REQUEST_TIMEOUT_MS = 12_000

const fetcher = async (url: string) => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })

    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
    return res.json()
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s: ${url}`)
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

const baseSwrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 60000,
  errorRetryCount: 2,
  errorRetryInterval: 5000,
}

function useDelayedEnable(delayMs: number, enabled = true) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setReady(false)
      return
    }

    const timer = window.setTimeout(() => setReady(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, enabled])

  return ready
}

export function useTokenRegistry() {
  return useSWR<Token[]>("/api/explorer/tokens/registry", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.TOKEN_LIST,
  })
}

/** Secondary dataset: wait briefly so the primary market view can render first. */
export function useLiquidityPools(enabled = true) {
  const ready = useDelayedEnable(1200, enabled)
  const swr = useSWR<LiquidityPool[]>(ready ? "/api/explorer/pools" : null, fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.POOLS,
  })

  return {
    ...swr,
    isLoading: enabled && (!ready || swr.isLoading),
  }
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
  totalVolume24h: string | null
  tokenCountChange: string | null
  newTokens7d?: number
}

interface CombinedMarketStats extends MarketStatsInstant {
  liquidityChange?: string | null
  volume24hChange?: string | null
  totalVolume24h?: string | null
  tokenCountChange?: string | null
  newTokens7d?: number
}

export function useMarketStatsInstant() {
  return useSWR<MarketStatsInstant>("/api/explorer/market-stats/instant", fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.MARKET_STATS,
  })
}

export function useMarketStatsDeferred(enabled = true) {
  return useSWR<MarketStatsDeferred>(enabled ? "/api/explorer/market-stats/deferred" : null, fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.MARKET_STATS_DEFERRED,
    revalidateOnMount: true,
  })
}

export function useMarketStats() {
  const { data: instant, isLoading: instantLoading, error: instantError } = useMarketStatsInstant()
  // Both stats datasets start together. The UI decides when they are allowed to render.
  const { data: deferred, isLoading: deferredLoading, error: deferredError } = useMarketStatsDeferred(true)

  const combinedData: CombinedMarketStats | undefined = instant
    ? {
        ...instant,
        liquidityChange: deferred?.liquidityChange ?? null,
        volume24hChange: deferred?.volume24hChange ?? null,
        totalVolume24h: deferred?.totalVolume24h ?? null,
        tokenCountChange: deferred?.tokenCountChange ?? null,
        newTokens7d: deferred?.newTokens7d ?? undefined,
      }
    : undefined

  return {
    data: combinedData as MarketStats | undefined,
    isLoading: instantLoading,
    isDeferredLoading: deferredLoading,
    error: instantError || deferredError,
  }
}

interface TokenPriceData {
  price: string | null
  liquidity: string | null
  totalLiquidity?: string | null
}

/** Initial market dataset: start immediately so the first screen can be gated on one coordinated load. */
export function useTokenPrices(enabled = true) {
  return useSWR<Record<string, TokenPriceData>>(enabled ? "/api/explorer/tokens/prices" : null, fetcher, {
    ...baseSwrConfig,
    refreshInterval: REFRESH_INTERVALS.PRICES,
    revalidateOnMount: true,
  })
}

export type TokenSnapshotFieldStatus = "ok" | "unavailable" | "error"

export interface TokenSnapshotResponse {
  id: string; price: string | null; liquidity: string | null; totalLiquidity?: string | null
  trustlines: number | null; holders: number | null; circulatingSupply: string | null
  poolBalance?: string | null; poolId: string | null; athPrice?: string | null; atlPrice?: string | null
  volume24h?: string | null; marketCap?: string | null
  flags?: { authRequired: boolean | null; authRevocable: boolean | null; authClawbackEnabled: boolean | null } | null
  orderBook: { bestBid: string | null; bestAsk: string | null; spread: string | null; bids: Array<{price:string;amount:string}>; asks: Array<{price:string;amount:string}> }
  metadata: { image: string | null; desc: string | null; tomlUrl: string | null }
  updatedAt: string
  status: Record<string, TokenSnapshotFieldStatus>
}

export function useTokenSnapshot(assetCode: string | null, issuer: string | null) {
  const shouldFetch = Boolean(assetCode && issuer)
  return useSWR<TokenSnapshotResponse>(
    shouldFetch ? `/api/explorer/tokens/${encodeURIComponent(assetCode!)}/snapshot?issuer=${encodeURIComponent(issuer!)}` : null,
    fetcher,
    { ...baseSwrConfig, refreshInterval: REFRESH_INTERVALS.TOKEN_DETAILS, revalidateOnMount: true, keepPreviousData: true },
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

/** Secondary dataset: wait longer because domains are not needed for initial market discovery. */
export function useDomains(enabled = true) {
  const ready = useDelayedEnable(2200, enabled)
  return useSWR(ready ? "/api/explorer/domains" : null, fetcher, {
    ...baseSwrConfig,
    refreshInterval: 60 * 60 * 1000,
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

export function useOrderBook(assetCode: string | null, issuer: string | null) {
  const shouldFetch = Boolean(assetCode && issuer)
  return useSWR(
    shouldFetch ? `/api/explorer/tokens/${assetCode}/orderbook?issuer=${issuer}` : null,
    fetcher,
    { ...baseSwrConfig, refreshInterval: 30000, revalidateOnMount: true },
  )
}


export function useTokenMetadata(assetCode: string | null, issuer: string | null) {
  const shouldFetch = Boolean(assetCode && issuer)
  return useSWR<{ image: string | null; desc: string | null }>(
    shouldFetch ? `/api/explorer/tokens/${assetCode}/metadata?issuer=${issuer}` : null,
    fetcher,
    { ...baseSwrConfig, refreshInterval: 0, revalidateOnMount: true },
  )
}
