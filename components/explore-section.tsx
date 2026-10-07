"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Filter,
  BarChart3,
  Info,
  Package,
  AlertCircle,
  X,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MobileTooltip } from "@/components/ui/tooltip"
import type { Token, MarketStats } from "@/lib/mock-data"
import { useTokenRegistry, useMarketStats, useTokenPrices } from "@/lib/use-market-data"
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
    if (value === undefined || value === null) return ""
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

  if (!stats || isDeferredLoading) {
    return (
      <div className="bg-muted/30 rounded-xl shadow-sm overflow-hidden">
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
              <div className="text-3xl font-bold text-center">{stats.liquidity || null}</div>
              <div className="text-sm text-muted-foreground text-center mt-1">Total Network Liquidity</div>
            </div>
            <div className="space-y-3 text-sm"><div className="flex justify-between">
                <span className="text-muted-foreground">24h Volume</span>
                <span className="font-semibold">
                  {isDeferredLoading ? <span className="inline-block h-3.5 w-16 animate-pulse rounded bg-muted" /> : stats.totalVolume24h || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Volume Change</span>
                <span className={`font-semibold ${getChangeColor(stats.volume24hChange)}`}>
                  {isDeferredLoading ? (
                    <span className="inline-block h-3.5 w-16 animate-pulse rounded bg-muted" />
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
                  <span className="font-semibold">{stats.poolCount || null}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-muted-foreground">Largest Pool</span>
                  <span className="font-semibold text-amber-500">{stats.largestPool || null}</span>
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
              <div className="text-3xl font-bold text-center">{stats.tokenCount?.toLocaleString() ?? null}</div>
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
                    <span className="inline-block h-3.5 w-16 animate-pulse rounded bg-muted" />
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

function SortMenu({
  options,
  sortBy,
  sortAsc,
  onSelect,
}: {
  options: Array<{ key: "price" | "liquidity" | "change24h" | "tvl" | "name"; label: string }>
  sortBy: "price" | "liquidity" | "change24h" | "tvl" | "name"
  sortAsc: boolean
  onSelect: (key: "price" | "liquidity" | "change24h" | "tvl" | "name", asc: boolean) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Sort"
        aria-expanded={open}
        title="Sort"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "h-11 w-11 rounded-xl bg-muted/30 shadow-sm flex items-center justify-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
          open && "text-primary border-primary/40",
        )}
      >
        <ArrowUpDown className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close sort menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
            {options.map((option) => {
              const active = sortBy === option.key
              return (
                <div key={option.key} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
                  <span className={cn("text-sm font-medium", active && "text-primary")}>{option.label}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Sort ${option.label} ascending`}
                      title="Ascending"
                      onClick={() => {
                        onSelect(option.key, true)
                        setOpen(false)
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground",
                        active && sortAsc && "bg-primary/10 text-primary",
                      )}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Sort ${option.label} descending`}
                      title="Descending"
                      onClick={() => {
                        onSelect(option.key, false)
                        setOpen(false)
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground",
                        active && !sortAsc && "bg-primary/10 text-primary",
                      )}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function BackToTopControl({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to top"
      title="Back to top"
      className="absolute left-1/2 top-1/2 z-10 flex h-9 w-10 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="flex flex-col items-center animate-pulse -space-y-1">
        <ChevronUp className="h-4 w-4" />
        <ChevronUp className="h-4 w-4" />
      </span>
    </button>
  )
}

function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return <TokenListSkeleton rows={rows} />
}

export function ExploreSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [liquiditySortAsc, setLiquiditySortAsc] = useState(false)

  const PAGE_SIZE = 20
  const [tokenPage, setTokenPage] = useState(1)
  const listContainerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const { data: tokens = [], isLoading: tokensLoading, error: tokensError } = useTokenRegistry()
  const { data: stats, isLoading: statsLoading, isDeferredLoading } = useMarketStats()
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
  }, [stats])

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
  }, [tokensWithPrices, searchQuery, activeFilters, liquiditySortAsc, sortBy, tokenPrices])

  const tokenTotalPages = Math.ceil(filteredTokens.length / PAGE_SIZE)

  // Keep pagination state valid whenever filtering/sorting changes the result set.
  useEffect(() => {
    if (tokenTotalPages === 0) {
      if (tokenPage !== 1) setTokenPage(1)
      return
    }

    if (tokenPage > tokenTotalPages) {
      setTokenPage(tokenTotalPages)
    }
  }, [tokenPage, tokenTotalPages])

  useEffect(() => {
    setTokenPage(1)
  }, [searchQuery, activeFilters])

  const paginatedTokens = useMemo(() => {
    const safePage = tokenTotalPages > 0 ? Math.min(Math.max(tokenPage, 1), tokenTotalPages) : 1
    const startIndex = (safePage - 1) * PAGE_SIZE
    return filteredTokens.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredTokens, tokenPage, tokenTotalPages])

  const handleTokenPageChange = (newPage: number) => {
    if (tokenTotalPages === 0) return
    const safePage = Math.min(Math.max(newPage, 1), tokenTotalPages)
    if (safePage === tokenPage) return
    setTokenPage(safePage)
    scrollListToTop()
  }

  const scrollListToTop = () => {
    listContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex flex-col h-full">
  <div ref={scrollRef} className="flex-1 overflow-y-auto explore-scroll-container">
        <div className="min-h-full flex flex-col gap-4 p-4">
          <div ref={heroRef}><UnifiedStatsCard stats={stats || null} isDeferredLoading={isDeferredLoading} /></div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="h-11 pl-9 bg-muted/30 border-0 shadow-sm rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <SortMenu
              options={[
                { key: "price", label: "Price" },
                { key: "liquidity", label: "Liquidity" },
                { key: "change24h", label: "24h Change" },
              ]}
              sortBy={sortBy}
              sortAsc={liquiditySortAsc}
              onSelect={(key, asc) => {
                setSortBy(key)
                setLiquiditySortAsc(asc)
              }}
            />          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : (
            <>
              {isLoading ? (
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
                        {(token as any).logoUrl ? (
                          <img
                            src={(token as any).logoUrl!}
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                              e.currentTarget.nextElementSibling?.classList.remove("hidden")
                            }}
                          />
                        ) : null}
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xl shrink-0 ${(token as any).logoUrl ? "hidden" : ""}`}
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
                          <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">{token.price ? `${token.price} π` : null}</div>
                          <div className="flex items-center justify-end">
                            {rankMovement === "up" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                            ) : rankMovement === "down" ? (
                              <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {tokenTotalPages > 1 && (
                    <div className="relative flex items-center justify-between pt-4 pb-2">
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
                      {showBackToTop && <BackToTopControl onClick={scrollToTop} />}
                    </div>
                  )}
                </div>
              )}
            </>

          )}

        </div>
      </div>





    </div>
  )
}
