"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SecondaryHeader } from "./secondary-header"
import { ExplorerMenu } from "./explorer-menu"
import { TokenDialog } from "./token-dialog"
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
      <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
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
      <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
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
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="text-3xl font-bold text-center">{stats.liquidity || "—"}</div>
              <div className="text-sm text-muted-foreground text-center mt-1">Total Network Liquidity</div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Liquidity Change</span>
                <span className={`font-semibold ${getChangeColor(stats.liquidityChange)}`}>
                  {isDeferredLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : (
                    stats.liquidityChange || "—"
                  )}
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
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
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
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  Verified Tokens
                  <MobileTooltip content="Tokens meeting all verification criteria: trustline holders, valid accounts, active liquidity, circulating supply, and linked domain">
                    <Info className="h-3 w-3 cursor-help" />
                  </MobileTooltip>
                </span>
                <span className="font-semibold">
                  {isDeferredLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : (
                    ((stats as any).verifiedTokensCount ?? 0)
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

export function ExploreSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("market")
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [expandedPoolToken, setExpandedPoolToken] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [liquiditySortAsc, setLiquiditySortAsc] = useState(false)

  const PAGE_SIZE = 20
  const [tokenPage, setTokenPage] = useState(1)
  const [poolPage, setPoolPage] = useState(1)
  const listContainerRef = useRef<HTMLDivElement>(null)

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

  const isLoading = tokensLoading && tokens.length === 0
  const error = tokensError?.message || null

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    category: [] as string[],
    verified: [] as string[],
    liquidity: [] as string[],
    change24h: [] as string[],
  })
  const [pendingFilters, setPendingFilters] = useState(activeFilters)

  const categories = [
    "Commerce",
    "Game",
    "NFT",
    "Social",
    "Education",
    "Health",
    "Travel",
    "Utilities",
    "Career",
    "Entertainment",
    "Finance",
    "Lifestyle",
  ]
  const verifiedOptions = ["Verified", "Not Verified"]
  const liquidityBuckets = ["<1,000 PI", "1,000–10,000 PI", "10,000–100,000 PI", ">100,000 PI"]
  const changeBuckets = ["≤-50%", "-10% to -50%", "0% to -10%", "0% to +10%", "+10% to +50%", "≥+50%"]

  useEffect(() => {
    const container = document.querySelector(".explore-scroll-container")
    const handleScroll = () => {
      if (container) {
        setShowBackToTop(container.scrollTop > 300)
      }
    }
    container?.addEventListener("scroll", handleScroll)
    return () => container?.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    const container = document.querySelector(".explore-scroll-container")
    container?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleApplyFilters = () => {
    setActiveFilters(pendingFilters)
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    const reset = {
      category: [],
      verified: [],
      liquidity: [],
      change24h: [],
    }
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

      if (activeFilters.category.length > 0) {
        if (!activeFilters.category.includes((token as any).category)) return false
      }

      // ENFORCE: Verification filter reads ONLY from admin verified flag
      if (activeFilters.verified?.length > 0) {
        const tokenIsVerified = token.verified === true
        const matchesVerified = activeFilters.verified.some(
          (v) => (v === "Verified" && tokenIsVerified) || (v === "Not Verified" && !tokenIsVerified),
        )
        if (!matchesVerified) return false
      }

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
      const aLiq = Number.parseFloat(a.liquidity?.replace(/[^\d.-]/g, "") || "0")
      const bLiq = Number.parseFloat(b.liquidity?.replace(/[^\d.-]/g, "") || "0")

      const aHasLiquidity = a.liquidity && aLiq > 0
      const bHasLiquidity = b.liquidity && bLiq > 0

      if (aHasLiquidity && !bHasLiquidity) return -1
      if (!aHasLiquidity && bHasLiquidity) return 1
      if (!aHasLiquidity && !bHasLiquidity) return 0

      return liquiditySortAsc ? aLiq - bLiq : bLiq - aLiq
    })
  }, [tokensWithPrices, searchQuery, activeFilters, liquiditySortAsc, tokenPrices, domains])

  const filteredDomains = domains.filter((domain: Domain) =>
    (domain.name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()),
  )

  const filteredPools = pools.filter(
    (pool: any) =>
      (pool.name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
      (pool.tokenCode?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
      (pool.mainPair?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()),
  )

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
      <SecondaryHeader onMenuClick={() => setIsMenuOpen(true)} />
      <ExplorerMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} />

      <div className="flex-1 overflow-y-auto explore-scroll-container pt-10">
        <div className="p-4 space-y-4">
          <UnifiedStatsCard stats={stats || null} isDeferredLoading={isDeferredLoading} />

          <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border scrollbar-hide">
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

          <div className="flex items-center gap-2">
            {activeTab === "market" && (
              <>
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors shrink-0 relative",
                        (activeFilters.category.length > 0 ||
                          activeFilters.verified?.length > 0 ||
                          activeFilters.liquidity.length > 0 ||
                          activeFilters.change24h.length > 0) &&
                          "border-primary text-primary",
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      {(activeFilters.category.length > 0 ||
                        activeFilters.verified?.length > 0 ||
                        activeFilters.liquidity.length > 0 ||
                        activeFilters.change24h.length > 0) && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 shadow-xl border-border bg-card" align="start">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Filters</h3>
                      <button onClick={() => setIsFilterOpen(false)}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <ScrollArea className="h-[350px]">
                      <Accordion type="multiple" className="px-4">
                        <AccordionItem value="category" className="border-none">
                          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 hover:no-underline">
                            Category
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {categories.map((cat) => (
                              <div key={cat} className="flex items-center gap-2">
                                <Checkbox
                                  id={`cat-${cat}`}
                                  checked={pendingFilters.category.includes(cat)}
                                  onCheckedChange={(checked) => {
                                    setPendingFilters((prev) => ({
                                      ...prev,
                                      category: checked
                                        ? [...prev.category, cat]
                                        : prev.category.filter((c) => c !== cat),
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`cat-${cat}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {cat}
                                </label>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="verified" className="border-none">
                          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 hover:no-underline">
                            Verified Status
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {verifiedOptions.map((v) => (
                              <div key={v} className="flex items-center gap-2">
                                <Checkbox
                                  id={`ver-${v}`}
                                  checked={pendingFilters.verified?.includes(v)}
                                  onCheckedChange={(checked) => {
                                    setPendingFilters((prev) => ({
                                      ...prev,
                                      verified: checked
                                        ? [...(prev.verified || []), v]
                                        : (prev.verified || []).filter((i) => i !== v),
                                    }))
                                  }}
                                />
                                <label htmlFor={`ver-${v}`} className="text-sm font-medium leading-none cursor-pointer">
                                  {v}
                                </label>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="liquidity" className="border-none">
                          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 hover:no-underline">
                            Liquidity
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {liquidityBuckets.map((bucket) => (
                              <div key={bucket} className="flex items-center gap-2">
                                <Checkbox
                                  id={`liq-${bucket}`}
                                  checked={pendingFilters.liquidity.includes(bucket)}
                                  onCheckedChange={(checked) => {
                                    setPendingFilters((prev) => ({
                                      ...prev,
                                      liquidity: checked
                                        ? [...prev.liquidity, bucket]
                                        : prev.liquidity.filter((b) => b !== bucket),
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`liq-${bucket}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {bucket}
                                </label>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="change" className="border-none">
                          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 hover:no-underline">
                            24h Change
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pb-4">
                            {changeBuckets.map((bucket) => (
                              <div key={bucket} className="flex items-center gap-2">
                                <Checkbox
                                  id={`change-${bucket}`}
                                  checked={pendingFilters.change24h.includes(bucket)}
                                  onCheckedChange={(checked) => {
                                    setPendingFilters((prev) => ({
                                      ...prev,
                                      change24h: checked
                                        ? [...prev.change24h, bucket]
                                        : prev.change24h.filter((b) => b !== bucket),
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`change-${bucket}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {bucket}
                                </label>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </ScrollArea>
                    <div className="p-4 border-t border-border grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-9 bg-transparent"
                        onClick={handleResetFilters}
                      >
                        Reset
                      </Button>
                      <Button size="sm" className="rounded-lg h-9" onClick={handleApplyFilters}>
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  onClick={() => setLiquiditySortAsc(!liquiditySortAsc)}
                  className={cn(
                    "p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors shrink-0 flex items-center gap-1.5",
                    "border-primary/50",
                  )}
                  title={liquiditySortAsc ? "Sorted: Lowest liquidity first" : "Sorted: Highest liquidity first"}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">
                    {liquiditySortAsc ? "Low→High" : "High→Low"}
                  </span>
                </button>
              </>
            )}
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
                className="pl-9 bg-card border-border"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Fetching live Pi Testnet data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : (
            <>
              {activeTab === "market" && (
                <div className="space-y-2" ref={listContainerRef}>
                  {paginatedTokens.map((token, index) => {
                    const rankMovement = rankMovements[token.id] || "neutral"

                    return (
                      <button
                        key={`${token.id}-${index}`}
                        onClick={() => setSelectedToken(token)}
                        className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted transition-colors text-left"
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
                      <span className="text-sm text-muted-foreground">
                        Page {tokenPage} of {tokenTotalPages}
                      </span>
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
              )}

              {activeTab === "domain" && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card border border-border rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 opacity-20" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Coming soon...</h3>
                  <p className="text-sm max-w-[200px] text-center mt-1">
                    {"Domain data will be available on Mainnet."}
                  </p>
                </div>
              )}

              {activeTab === "liquidityPools" && (
                <div className="space-y-2">
                  {paginatedPools.map((pool: any) => (
                    <div key={pool.id} className="space-y-2">
                      <button
                        onClick={() => setExpandedPoolToken(expandedPoolToken === pool.id ? null : pool.id)}
                        className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted transition-colors text-left"
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

                      {expandedPoolToken === pool.id && (
                        <div className="bg-card border border-border rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="text-center py-4 bg-muted/30 rounded-xl">
                            <div className="text-2xl font-bold">
                              {pool.totalLockedAsset || "—"} {pool.tokenCode}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                              Total {pool.tokenCode} Locked
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                              All Pools
                            </h4>
                            <div
                              className={cn(
                                "space-y-2",
                                pool.allPools?.length > 5 && "max-h-[320px] overflow-y-auto pr-2",
                              )}
                            >
                              {pool.allPools?.map((subPool: any) => (
                                <div
                                  key={subPool.id}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                  <div>
                                    <div className="text-sm font-medium">{subPool.pair}</div>
                                    <div className="text-xs text-muted-foreground">{subPool.providers} providers</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-semibold">{subPool.lockedToken}</div>
                                    <div className="text-xs text-muted-foreground">locked</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedPoolToken(null)}
                            className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ArrowUp className="h-5 w-5" />
                          </button>
                        </div>
                      )}
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
                      <span className="text-sm text-muted-foreground">
                        Page {poolPage} of {poolTotalPages}
                      </span>
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
              )}
            </>
          )}
        </div>
      </div>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <TokenDialog
        token={selectedToken}
        open={!!selectedToken}
        onOpenChange={(open) => !open && setSelectedToken(null)}
      />
    </div>
  )
}
