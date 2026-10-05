"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Filter,
  BarChart3,
  Info,
  Package,
  Loader2,
  AlertCircle,
  X,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Minus,
  Droplets,
  Clock,
  Globe2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MobileTooltip } from "@/components/ui/tooltip"
import type { Token, Domain, MarketStats } from "@/lib/mock-data"
import { useTokenRegistry, useLiquidityPools, useMarketStats, useTokenPrices, useDomains } from "@/lib/use-market-data"
import { useRankMovement } from "@/lib/use-rank-snapshot"
// REMOVED: isTokenVerified import - verification is ONLY from admin metadata

function UnifiedStatsCard({
  stats,
  isDeferredLoading,
}: {
  stats: MarketStats | null
  isDeferredLoading?: boolean
}) {
  const [showLiquidityDetails, setShowLiquidityDetails] = useState(false)
  const [showTokenCountDetails, setShowTokenCountDetails] = useState(false)

  const formatValue = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return "—"
    const strVal = String(value).replace(/[^\d.-]/g, "")
    const num = Number.parseFloat(strVal)
    if (isNaN(num)) return value

    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B"
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M"
    if (num >= 1000) return (num / 1000).toFixed(2) + "K"
    return value
  }

  const getChangeColor = (changeStr: string | null | undefined) => {
    if (!changeStr) return "text-muted-foreground"
    const changeNum = Number.parseFloat(changeStr.replace(/[^\d.-]/g, ""))
    if (isNaN(changeNum)) return "text-muted-foreground"
    if (changeNum > 0) return "text-green-600 dark:text-green-400"
    if (changeNum < 0) return "text-red-600 dark:text-red-400"
    return "text-muted-foreground"
  }

  if (!stats) {
    return (
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
              Liquidity
              <Info className="h-3 w-3" />
            </div>
            <div className="h-7 w-20 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted/30 rounded animate-pulse mt-1" />
          </div>
          <div className="p-3 text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1 justify-end">
              Token Count
              <Info className="h-3 w-3 cursor-help" />
            </div>
            <div className="h-7 w-16 bg-muted/50 rounded animate-pulse ml-auto" />
            <div className="h-4 w-20 bg-muted/30 rounded animate-pulse mt-1 ml-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-border">
          <button
            onClick={() => setShowLiquidityDetails(true)}
            className="p-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
              Liquidity
              <MobileTooltip content="Total PI locked across all liquidity pools">
                <Info className="h-3 w-3 cursor-help" />
              </MobileTooltip>
            </div>
            <div className="text-lg font-bold">{formatValue(stats.liquidity)}</div>
            <div
              className={`text-xs font-semibold flex items-center gap-1 mt-1 ${getChangeColor(stats.volume24hChange)}`}
            >
              {isDeferredLoading ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px]">Loading...</span>
                </span>
              ) : stats.volume24hChange ? (
                <>
                  {Number.parseFloat(stats.volume24hChange) >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stats.volume24hChange}
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </button>

          <button
            onClick={() => setShowTokenCountDetails(true)}
            className="p-3 hover:bg-muted/50 transition-colors text-right"
          >
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1 justify-end">
              Token Count
              <MobileTooltip content="Total unique tokens with liquidity pools">
                <Info className="h-3 w-3 cursor-help" />
              </MobileTooltip>
            </div>
            <div className="text-lg font-bold">{formatValue(stats.tokenCount)}</div>
            <div className="text-xs text-muted-foreground mt-1">Live Tokens</div>
          </button>
        </div>
      </div>

      <Dialog open={showLiquidityDetails} onOpenChange={setShowLiquidityDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Liquidity Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <div className="text-3xl font-bold text-center">{stats.liquidity || "—"}</div>
              <div className="text-sm text-muted-foreground text-center mt-1">Total Network Liquidity</div>
            </div>
            <div className="space-y-3 text-sm"><div className="flex justify-between">
                <span className="text-muted-foreground">24h Volume</span>
                <span className="font-semibold">
                  {isDeferredLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : stats.totalVolume24h || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Volume Change</span>
                <span className={`font-semibold ${getChangeColor(stats.volume24hChange)}`}>
                  {isDeferredLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : stats.volume24hChange ? (
                    <>
                      {Number.parseFloat(stats.volume24hChange) >= 0 ? (
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="inline h-3 w-3 mr-1" />
                      )}
                      {stats.volume24hChange}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Liquidity Pools</span>
                  <span className="font-semibold">{stats.poolCount || "—"}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-muted-foreground">Largest Pool</span>
                  <span className="font-semibold text-amber-500">{stats.largestPool || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTokenCountDetails} onOpenChange={setShowTokenCountDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Token Count Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <div className="text-3xl font-bold text-center">{stats.tokenCount?.toLocaleString() ?? "—"}</div>
              <div className="text-sm text-muted-foreground text-center mt-1">Live Tokens Listed</div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  New Tokens
                  <MobileTooltip content="Tokens listed within the last 7 days (rolling window)">
                    <Info className="h-3 w-3 cursor-help" />
                  </MobileTooltip>
                </span>
                <span className="font-semibold">
                  {isDeferredLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : (
                    ((stats as any).newTokens7d ?? 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


function TokenListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="w-full flex items-center gap-3 p-3 bg-card rounded-xl">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-28 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return <TokenListSkeleton rows={rows} />
}

export function ExploreSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "market")
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [expandedPoolToken, setExpandedPoolToken] = useState<string | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [liquiditySortAsc, setLiquiditySortAsc] = useState(false)

  const PAGE_SIZE = 20
  const [tokenPage, setTokenPage] = useState(1)
  const [poolPage, setPoolPage] = useState(1)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const { data: tokens = [], isLoading: tokensLoading, error: tokensError } = useTokenRegistry()
  const { data: pools = [], isLoading: poolsLoading } = useLiquidityPools()
  const { data: stats, isLoading: statsLoading, isDeferredLoading } = useMarketStats()
  const { data: domains = [] } = useDomains()
  const { data: tokenPrices } = useTokenPrices()
  
  // Debug: Log sample token data when loaded
  useEffect(() => {
    if (tokens.length > 0) {
      const sampleToken = tokens[0]
      console.log("[v0] Sample token from registry:", {
        symbol: sampleToken.symbol,
        verified: sampleToken.verified,
        hasLogo: !!(sampleToken as any).logoUrl,
        hasDescription: !!(sampleToken as any).description,
        hasWebsite: !!(sampleToken as any).website,
        hasTwitter: !!(sampleToken as any).twitter,
        hasTelegram: !!(sampleToken as any).telegram,
        hasCircSupply: !!(sampleToken as any).circulatingSupply,
        hasTotalSupply: !!(sampleToken as any).totalSupply,
        hasMarketCap: !!(sampleToken as any).marketCap,
        fullToken: sampleToken
      })
    }
  }, [tokens])

  const tokensWithPrices = useMemo(() => {
    if (!tokens || !tokenPrices) return tokens
    return tokens.map((token) => {
      const priceData = tokenPrices[token.id]
      if (priceData) {
        return {
          ...token,
          price: priceData.price,
          liquidity: priceData.liquidity,
        }
      }
      return token
    })
  }, [tokens, tokenPrices])

  const rankMovements = useRankMovement(tokensWithPrices)

  const isLoading = tokens.length === 0 && !tokensError && (tokensLoading || !tokens)
  const error = tokensError?.message || null

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"price" | "liquidity" | "change24h" | "tvl" | "name">("liquidity")
  const [activeFilters, setActiveFilters] = useState({
    liquidity: [] as string[],
    change24h: [] as string[],
  })
  const [pendingFilters, setPendingFilters] = useState(activeFilters)

  const liquidityBuckets = ["<1,000 PI", "1,000–10,000 PI", "10,000–100,000 PI", ">100,000 PI"]
  const changeBuckets = ["≤-50%", "-10% to -50%", "0% to -10%", "0% to +10%", "+10% to +50%", "≥+50%"]

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const scrollRoot = scrollRef.current
    const root = scrollRoot && scrollRoot.scrollHeight > scrollRoot.clientHeight + 8 ? scrollRoot : null
    const observer = new IntersectionObserver(
      ([entry]) => setShowBackToTop(!entry.isIntersecting),
      { root, threshold: 0, rootMargin: "-8px 0px 0px 0px" },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [activeTab, stats])

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleApplyFilters = () => {
    setActiveFilters(pendingFilters)
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    const reset = {
      liquidity: [],
      change24h: [],
    }
    setSortBy("liquidity")
    setLiquiditySortAsc(false)
    setPendingFilters(reset)
    setActiveFilters(reset)
    setIsFilterOpen(false)
  }

  const filteredTokens = useMemo(() => {
    const filtered = tokensWithPrices.filter((token) => {
      const matchesSearch =
        (token.name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
        (token.symbol?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (activeFilters.liquidity.length > 0) {
        const liq = Number.parseFloat(token.liquidity?.replace(/[^\d.-]/g, "") || "0")
        const matchesLiquidity = activeFilters.liquidity.some((bucket) => {
          if (bucket === "<1,000 PI") return liq < 1000
          if (bucket === "1,000–10,000 PI") return liq >= 1000 && liq <= 10000
          if (bucket === "10,000–100,000 PI") return liq >= 10000 && liq <= 100000
          if (bucket === ">100,000 PI") return liq > 100000
          return false
        })
        if (!matchesLiquidity) return false
      }

      if (activeFilters.change24h.length > 0) {
        const change = Number.parseFloat(token.change?.replace(/[^\d.-]/g, "") || "0")
        const matchesChange = activeFilters.change24h.some((bucket) => {
          if (bucket === "≤-50%") return change <= -50
          if (bucket === "-10% to -50%") return change <= -10 && change > -50
          if (bucket === "0% to -10%") return change < 0 && change > -10
          if (bucket === "0% to +10%") return change >= 0 && change <= 10
          if (bucket === "+10% to +50%") return change > 10 && change < 50
          if (bucket === "≥+50%") return change >= 50
          return false
        })
        if (!matchesChange) return false
      }

      return true
    })

    return filtered.sort((a, b) => {
      const read = (token: any, key: "price" | "liquidity" | "change24h" | "tvl" | "name") => {
        const raw = key === "change24h" ? token.change : key === "price" ? token.price : key === "name" ? token.symbol : token.liquidity
        return Number.parseFloat(String(raw ?? "").replace(/[^\d.-]/g, "") || "0")
      }
      return liquiditySortAsc ? read(a, sortBy) - read(b, sortBy) : read(b, sortBy) - read(a, sortBy)
    })
  }, [tokensWithPrices, searchQuery, activeFilters, liquiditySortAsc, sortBy, tokenPrices, domains])

  const filteredDomains = domains
    .filter((domain: Domain) => (domain.name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()))
    .sort((a: Domain, b: Domain) => (liquiditySortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))

  const filteredPools = pools
    .filter(
      (pool: any) =>
        (pool.name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
        (pool.tokenCode?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
        (pool.mainPair?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()),
    )
    .sort((a: any, b: any) => {
      if (sortBy === "name") {
        const aName = String(a.tokenCode || a.title || "")
        const bName = String(b.tokenCode || b.title || "")
        return liquiditySortAsc ? aName.localeCompare(bName) : bName.localeCompare(aName)
      }
      const aTvl = Number.parseFloat(String(a.tvl ?? "0").replace(/[^\d.-]/g, "") || "0")
      const bTvl = Number.parseFloat(String(b.tvl ?? "0").replace(/[^\d.-]/g, "") || "0")
      return liquiditySortAsc ? aTvl - bTvl : bTvl - aTvl
    })

  const tokenTotalPages = Math.ceil(filteredTokens.length / PAGE_SIZE)
  const poolTotalPages = Math.ceil(filteredPools.length / PAGE_SIZE)

  const paginatedTokens = useMemo(() => {
    const startIndex = (tokenPage - 1) * PAGE_SIZE
    return filteredTokens.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredTokens, tokenPage])

  const paginatedPools = useMemo(() => {
    const startIndex = (poolPage - 1) * PAGE_SIZE
    return filteredPools.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredPools, poolPage])

  useEffect(() => {
    if (tokenPage > tokenTotalPages && tokenTotalPages > 0) {
      setTokenPage(1)
    }
  }, [filteredTokens.length, tokenPage, tokenTotalPages])

  useEffect(() => {
    if (poolPage > poolTotalPages && poolTotalPages > 0) {
      setPoolPage(1)
    }
  }, [filteredPools.length, poolPage, poolTotalPages])

  useEffect(() => {
    setTokenPage(1)
    setPoolPage(1)
  }, [searchQuery, activeFilters])

  const scrollListToTop = () => {
    listContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleTokenPageChange = (newPage: number) => {
    setTokenPage(newPage)
    scrollListToTop()
  }

  const handlePoolPageChange = (newPage: number) => {
    setPoolPage(newPage)
    scrollListToTop()
  }

  return (
    <div className="flex flex-col h-full">
  <div ref={scrollRef} className="flex-1 overflow-y-auto explore-scroll-container">
        <div className="min-h-full flex flex-col gap-4 p-4">
          <div ref={heroRef}><UnifiedStatsCard stats={stats || null} isDeferredLoading={isDeferredLoading} /></div>

          <div className="sticky top-0 z-30 -mx-4 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "market", label: "Market" },
              { id: "liquidityPools", label: "Liquidity Pools" },
              { id: "domain", label: "Domain" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors relative",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "domain"
                    ? "Search domains..."
                    : activeTab === "liquidityPools"
                      ? "Search pools..."
                      : "Search tokens..."
                }
                className="h-11 pl-9 bg-muted border-0 shadow-none rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {(activeTab === "market"
                ? [
                    ["price", "Price"],
                    ["liquidity", "Liquidity"],
                    ["change24h", "24h"],
                  ]
                : activeTab === "liquidityPools"
                  ? [
                      ["tvl", "TVL"],
                      ["name", "Name"],
                    ]
                  : [["name", "Name"]]
              ).map(([key, label]) => {
                const isActive = sortBy === key

                return (
                  <button
                    key={key}
                    type="button"
                    title={label}
                    aria-label={"Sort by " + label + (isActive ? (liquiditySortAsc ? ", ascending" : ", descending") : "")}
                    onClick={() => {
                      if (sortBy === key) setLiquiditySortAsc((current) => !current)
                      else {
                        setSortBy(key as "price" | "liquidity" | "change24h" | "tvl" | "name")
                        setLiquiditySortAsc(false)
                      }
                    }}
                    className={cn(
                      "shrink-0 inline-flex h-8 min-w-8 items-center justify-center gap-0.5 bg-transparent p-0 text-muted-foreground transition-colors hover:text-foreground",
                      isActive && "text-primary",
                    )}
                  >
                    {activeTab === "market" && key === "price" ? (
                      <span className="text-base font-semibold leading-none" aria-hidden="true">π</span>
                    ) : activeTab === "market" && key === "liquidity" ? (
                      <Droplets className="h-4 w-4" aria-hidden="true" />
                    ) : activeTab === "market" && key === "change24h" ? (
                      <Clock className="h-4 w-4" aria-hidden="true" />
                    ) : activeTab === "domain" ? (
                      <Globe2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isActive && (
                      liquiditySortAsc ? (
                        <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      )
                    )}
                    {isActive && (
                      <span className="sr-only">{liquiditySortAsc ? "Ascending" : "Descending"}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {activeTab === "market" && error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : (
            <>
              {activeTab === "market" && (isLoading ? (
                <ListSkeleton />
              ) : (
                <div className="space-y-2" ref={listContainerRef}>
                  {paginatedTokens.map((token, index) => {
                    const rankMovement = rankMovements[token.id] || "neutral"

                    return (
                      <button
                        key={`${token.id}-${index}`}
                        onClick={() => router.push(`/token/${encodeURIComponent(token.symbol)}?issuer=${encodeURIComponent((token as any).fullIssuer || "")}`)}
                        className="w-full flex items-center gap-3 p-3 bg-card rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        {/* ENFORCE: Logo from admin ONLY - no fallbacks, no generated icons */}
                        {(token as any).logoUrl ? (
                          <img
                            src={(token as any).logoUrl || "/placeholder.svg"}
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                            onError={(e) => {
                              // If admin logo fails to load, show placeholder
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div 
                          className={`flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground text-xl shrink-0 ${(token as any).logoUrl ? 'hidden' : ''}`}
                        >
                          {token.symbol[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{token.symbol}</span>
                            {/* ENFORCE: Verification badge from admin ONLY - no heuristics */}
                            {token.verified === true && (
                              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{token.issuer}</div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="text-sm font-semibold">{token.price ? `${token.price} π` : "—"}</div>
                          <div className="flex items-center justify-end">
                            {rankMovement === "up" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                            ) : rankMovement === "down" ? (
                              <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {filteredTokens.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between pt-4 pb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTokenPageChange(tokenPage - 1)}
                        disabled={tokenPage === 1}
                        className="h-9 px-3 gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTokenPageChange(tokenPage + 1)}
                        disabled={tokenPage === tokenTotalPages}
                        className="h-9 px-3 gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {activeTab === "domain" && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="w-16 h-16 flex items-center justify-center mb-4">
                    <Globe2 className="h-10 w-10 opacity-20" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Coming soon...</h3>
                </div>
              )}

              {activeTab === "liquidityPools" && (poolsLoading && pools.length === 0 ? (
                <ListSkeleton />
              ) : (
                <div className="space-y-2">
                  {paginatedPools.map((pool: any) => (
                    <div key={pool.id} className="space-y-2">
                      <button
                        onClick={() => router.push(`/pool/${encodeURIComponent(pool.id)}`)}
                        className="w-full flex items-center gap-3 p-3 bg-card rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center shrink-0">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white text-xl">
                            {pool.tokenCode?.[0] || "?"}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{pool.title || `${pool.tokenCode} Pools`}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-purple-600">{pool.tvl || "—"}</div>
                          <div className="text-[10px] text-muted-foreground">TVL (PI)</div>
                        </div>
                      </button>

                    </div>
                  ))}

                  {filteredPools.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between pt-4 pb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePoolPageChange(poolPage - 1)}
                        disabled={poolPage === 1}
                        className="h-9 px-3 gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePoolPageChange(poolPage + 1)}
                        disabled={poolPage === poolTotalPages}
                        className="h-9 px-3 gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

        </div>
      </div>

      {showBackToTop && (activeTab === "market" || activeTab === "liquidityPools" || activeTab === "domain") && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-5 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}



    </div>
  )
}
