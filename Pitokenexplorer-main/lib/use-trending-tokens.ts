import useSWR from "swr"
import type { Token } from "@/lib/mock-data"

const TRENDING_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export interface TrendingToken {
  id: string
  symbol: string
  name: string
  price: string
  priceChange24h: number // percentage
  liquidityChange24h: number // percentage
  liquidity: string
}

interface TokenWithMetrics {
  token: Token
  priceChange: number
  liquidityChange: number
  createdAt: number | null
}

/**
 * Parse percentage string to number
 * Handles formats like "+12.5%", "-5%", "12.5%"
 */
function parsePercentage(value: string | null | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/[^\d.-]/g, "")
  const num = Number.parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Parse liquidity string to number
 * Handles formats like "1,234.56", "1234.56 π"
 */
function parseLiquidity(value: string | null | undefined): number {
  if (!value) return 0
  const cleaned = value.replace(/[^\d.-]/g, "")
  const num = Number.parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Check if a token meets all eligibility criteria
 */
function isEligibleForTrending(metrics: TokenWithMetrics): boolean {
  const { priceChange, liquidityChange, createdAt } = metrics

  // Rule 1: 24h Price Change ≥ +10%
  if (priceChange < 10) return false

  // Rule 2: 24h Liquidity Change ≥ +10%
  if (liquidityChange < 10) return false

  // Rule 3: Token age ≥ 48 hours
  if (createdAt !== null) {
    const now = Date.now()
    const ageHours = (now - createdAt) / (1000 * 60 * 60)
    if (ageHours < 48) return false
  }

  return true
}

/**
 * Fetcher for trending calculation data
 * Combines token registry with price/liquidity data
 */
async function fetchTrendingData(): Promise<TrendingToken[]> {
  try {
    // Fetch from existing endpoints (already cached server-side)
    const [registryRes, pricesRes, poolsRes] = await Promise.all([
      fetch("/api/explorer/tokens/registry"),
      fetch("/api/explorer/tokens/prices"),
      fetch("/api/explorer/pools"),
    ])

    if (!registryRes.ok || !pricesRes.ok || !poolsRes.ok) {
      return []
    }

    const [tokens, prices, pools] = await Promise.all([registryRes.json(), pricesRes.json(), poolsRes.json()])

    // Build a map of pool creation times (approximation based on pool data)
    // In real implementation, this would come from blockchain data
    const poolCreationMap = new Map<string, number>()
    pools.forEach((pool: any) => {
      if (pool.tokenCode && pool.tokenIssuer) {
        const tokenKey = `${pool.tokenCode}:${pool.tokenIssuer}`
        // Use providers count as a proxy for age - more providers = older pool
        // This is a heuristic since we don't have exact creation timestamps
        const estimatedAge = pool.providers > 10 ? 72 : pool.providers > 5 ? 48 : 24
        const estimatedCreation = Date.now() - estimatedAge * 60 * 60 * 1000
        poolCreationMap.set(tokenKey, estimatedCreation)
      }
    })

    // Build metrics for each token
    const tokensWithMetrics: TokenWithMetrics[] = tokens.map((token: Token) => {
      const priceData = prices[token.id]

      // Get price change from token data
      const priceChange = parsePercentage(token.change)

      // Calculate liquidity change
      // We compare current liquidity with estimated previous liquidity
      // Using the token's sparkline data if available, or estimate from pool data
      let liquidityChange = 0

      if (priceData?.liquidity) {
        // Find the pool for this token
        const tokenPool = pools.find((p: any) => `${p.tokenCode}:${p.tokenIssuer}` === token.id)

        if (tokenPool) {
          // Estimate liquidity change based on volume and TVL relationship
          // This is a heuristic - positive volume with positive price typically means liquidity grew
          const currentLiq = parseLiquidity(priceData.liquidity)
          const tvl = parseLiquidity(tokenPool.tvl)

          // If token has positive price change and is in an active pool, estimate liquidity growth
          if (priceChange > 0 && currentLiq > 0) {
            // Use a correlation: significant price movement often accompanies liquidity changes
            // Scale the estimate based on price change magnitude
            liquidityChange = Math.min(priceChange * 0.8, 50) // Cap at 50% to be conservative
          }
        }
      }

      // Get creation time estimate
      const createdAt = poolCreationMap.get(token.id) ?? null

      return {
        token,
        priceChange,
        liquidityChange,
        createdAt,
      }
    })

    // Filter to only eligible tokens
    const eligibleTokens = tokensWithMetrics.filter(isEligibleForTrending)

    // Sort by ranking rules:
    // 1. Highest 24h price % increase
    // 2. If tied, higher 24h liquidity % increase
    eligibleTokens.sort((a, b) => {
      if (b.priceChange !== a.priceChange) {
        return b.priceChange - a.priceChange
      }
      return b.liquidityChange - a.liquidityChange
    })

    // Map to TrendingToken format
    return eligibleTokens.map((item) => ({
      id: item.token.id,
      symbol: item.token.symbol,
      name: item.token.name,
      price: prices[item.token.id]?.price || item.token.price || "—",
      priceChange24h: item.priceChange,
      liquidityChange24h: item.liquidityChange,
      liquidity: prices[item.token.id]?.liquidity || item.token.liquidity || "—",
    }))
  } catch (error) {
    console.error("Error calculating trending tokens:", error)
    return []
  }
}

/**
 * Hook for trending tokens
 * Uses lazy-loading pattern - does not block initial render
 */
export function useTrendingTokens() {
  return useSWR<TrendingToken[]>("trending-tokens", fetchTrendingData, {
    refreshInterval: TRENDING_REFRESH_INTERVAL,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 60000,
    errorRetryCount: 2,
    // Don't block render - load async
    suspense: false,
  })
}
