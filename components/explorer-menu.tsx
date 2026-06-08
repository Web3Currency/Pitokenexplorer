"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, BanknoteIcon, TrendingUp, ChevronDown, Settings, Plus, Trash2, Info, LineChartIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MobileTooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useTrendingTokens, type TrendingToken } from "@/lib/use-trending-tokens"

interface ExplorerMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function TrendingTokenSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg animate-pulse">
          <div className="w-5 h-4 bg-muted rounded" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="w-12 h-4 bg-muted rounded" />
              <div className="w-16 h-4 bg-muted rounded" />
            </div>
            <div className="w-10 h-3 bg-muted/60 rounded mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TrendingTokenItem({ token, index }: { token: TrendingToken; index: number }) {
  const isPositive = token.priceChange24h >= 0
  const changeText = `${isPositive ? "+" : ""}${token.priceChange24h.toFixed(1)}%`

  return (
    <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 active:bg-muted transition-colors text-left">
      <span className="text-xs font-medium text-muted-foreground w-5 text-center">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{token.symbol}</span>
          <span className="text-xs font-medium tabular-nums">{token.price} π</span>
        </div>
        <span className={cn("text-[10px] font-medium", isPositive ? "text-green-500" : "text-red-500")}>
          {changeText}
        </span>
      </div>
    </button>
  )
}

export function ExplorerMenu({ open, onOpenChange }: ExplorerMenuProps) {
  const [trendingExpanded, setTrendingExpanded] = useState(true)
  const [watchlistExpanded, setWatchlistExpanded] = useState(true)
  const [currencyExpanded, setCurrencyExpanded] = useState(false)
  const [showFullWatchlist, setShowFullWatchlist] = useState(false)
  const [manageWatchlistOpen, setManageWatchlistOpen] = useState(false)

  const { data: trendingTokens, isLoading: trendingLoading } = useTrendingTokens()

  const watchlistTokens: { id: string; symbol: string; name: string; price: string; change: string }[] = []

  const displayedWatchlist = watchlistExpanded
    ? showFullWatchlist
      ? watchlistTokens
      : watchlistTokens.slice(0, 3)
    : []

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-80 overflow-y-auto bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-r border-border/50"
        >
          <SheetHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <LineChartIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">Explorer</SheetTitle>
                
              </div>
            </div>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            {/* Trending Section */}
            <Collapsible open={trendingExpanded} onOpenChange={setTrendingExpanded}>
              <div className="rounded-xl bg-card/50 border border-border/40 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Trending</span>
                      <MobileTooltip
                        content="Trending tokens are selected based on a minimum 10% increase in both price and liquidity within 24 hours. Only tokens older than 48 hours are eligible. Rankings are based on strongest momentum."
                        className="max-w-[280px]"
                      >
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </MobileTooltip>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        trendingExpanded && "rotate-180",
                      )}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    {trendingLoading ? (
                      <TrendingTokenSkeleton />
                    ) : !trendingTokens || trendingTokens.length === 0 ? (
                      <div className="rounded-lg bg-muted/30 py-6 text-center">
                        <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-muted-foreground">No trending tokens at this time</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          Requires +10% price & liquidity (24h)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {trendingTokens.map((token, index) => (
                          <TrendingTokenItem key={token.id} token={token} index={index} />
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Watchlist Section */}
            <Collapsible open={watchlistExpanded} onOpenChange={setWatchlistExpanded}>
              <div className="rounded-xl bg-card/50 border border-border/40 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Watchlist</span>
                      {watchlistTokens.length > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          {watchlistTokens.length}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        watchlistExpanded && "rotate-180",
                      )}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-2">
                    {displayedWatchlist.length === 0 ? (
                      <div className="rounded-lg bg-muted/30 py-6 text-center">
                        <Star className="h-5 w-5 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-muted-foreground">Add tokens to your watchlist</p>
                      </div>
                    ) : (
                      displayedWatchlist.map((token) => {
                        const isPositive = token.change.startsWith("+")
                        return (
                          <button
                            key={token.id}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 active:bg-muted transition-colors text-left"
                          >
                            <Star className="h-4 w-4 text-primary fill-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium truncate">{token.symbol}</span>
                                <span className="text-xs font-medium tabular-nums">{token.price}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-muted-foreground truncate">{token.name}</span>
                                <span
                                  className={cn(
                                    "text-[10px] font-medium",
                                    isPositive ? "text-green-500" : "text-red-500",
                                  )}
                                >
                                  {token.change}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}

                    {!showFullWatchlist && watchlistTokens.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-8"
                        onClick={() => setShowFullWatchlist(true)}
                      >
                        Show All ({watchlistTokens.length})
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-9 bg-transparent border-border/60"
                      onClick={() => setManageWatchlistOpen(true)}
                    >
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Manage Watchlist
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Default Currency Section */}
            <Collapsible open={currencyExpanded} onOpenChange={setCurrencyExpanded}>
              <div className="rounded-xl bg-card/50 border border-border/40 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <BanknoteIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Default Currency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">PI (π)</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform duration-200",
                          currencyExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">PI (π)</span>
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        All prices displayed in Pi Network native token
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        </SheetContent>
      </Sheet>

      {/* Manage Watchlist Dialog */}
      <Dialog open={manageWatchlistOpen} onOpenChange={setManageWatchlistOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Manage Watchlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {watchlistTokens.length === 0 ? (
              <div className="rounded-xl bg-muted/30 py-10 text-center">
                <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground mb-1">Your watchlist is empty</p>
                <p className="text-xs text-muted-foreground">Add tokens from the Explorer</p>
              </div>
            ) : (
              watchlistTokens.map((token) => {
                const isPositive = token.change.startsWith("+")
                return (
                  <div
                    key={token.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <Star className="h-4 w-4 text-primary fill-primary shrink-0" />
                    <button className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{token.symbol}</span>
                        <span className="text-xs font-medium tabular-nums">{token.price}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">{token.name}</span>
                        <span className={cn("text-xs font-medium", isPositive ? "text-green-500" : "text-red-500")}>
                          {token.change}
                        </span>
                      </div>
                    </button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
              })
            )}
            <Button variant="outline" className="w-full bg-transparent border-dashed border-border/60 h-11" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Token to Watchlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
