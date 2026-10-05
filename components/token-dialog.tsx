"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Sparkles, Loader2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Token } from "@/lib/mock-data"
import { useTokenDetails, useTokenPriceHistory, useDomains } from "@/lib/use-market-data"
import { MobileTooltip } from "@/components/ui/tooltip"
// REMOVED: checkTokenVerificationStrict import - verification is ONLY from admin metadata

interface TokenDialogProps {
  token: Token | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TokenDialog({ token, open, onOpenChange }: TokenDialogProps) {
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const fullIssuer = (token as any)?.fullIssuer || null
  const assetCode = token?.symbol || null

  const { data: tokenDetails, isLoading: detailsLoading } = useTokenDetails(
    open ? assetCode : null,
    open ? fullIssuer : null,
  )

  const { data: priceHistory } = useTokenPriceHistory(open ? assetCode : null, open ? fullIssuer : null)

  const { data: domains = [] } = useDomains()

  const { athPrice, atlPrice } = useMemo(() => {
    if (!priceHistory) return { athPrice: null, atlPrice: null }

    const allPrices: number[] = []

    const timeRanges: Array<"24h" | "7d" | "30d"> = ["24h", "7d", "30d"]
    timeRanges.forEach((range) => {
      const rangeData = priceHistory[range]
      if (rangeData && Array.isArray(rangeData)) {
        rangeData.forEach((point) => {
          if (point.pricePI && point.pricePI > 0) {
            allPrices.push(point.pricePI)
          }
        })
      }
    })

    if (allPrices.length === 0) {
      return { athPrice: null, atlPrice: null }
    }

    const max = Math.max(...allPrices)
    const min = Math.min(...allPrices)

    return {
      athPrice: max > 0 ? max.toFixed(4) : null,
      atlPrice: min > 0 ? min.toFixed(4) : null,
    }
  }, [priceHistory])

  const displayToken = token
    ? {
        ...token,
        ...(tokenDetails || {}),
      }
    : null

  // Debug: Log what data we have
  if (displayToken && open) {
    console.log("[v0] Token Dialog - displayToken data:", {
      symbol: displayToken.symbol,
      hasDescription: !!(displayToken as any)?.description,
      hasWebsite: !!(displayToken as any)?.website,
      hasTwitter: !!(displayToken as any)?.twitter,
      hasTelegram: !!(displayToken as any)?.telegram,
      hasCircSupply: !!(displayToken as any)?.circulatingSupply,
      hasTotalSupply: !!(displayToken as any)?.totalSupply,
      hasMarketCap: !!(displayToken as any)?.marketCap,
    })
  }

  const handleAIAnalyze = () => {
    setShowAIAnalysis(true)
  }

  if (!token) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-card z-10 p-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl shrink-0",
                  token.color,
                )}
              >
                {token.icon}
              </div>
              <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg flex items-center gap-2">
                <span className="break-words">{token.symbol}</span>
                {token.verified === true && (
                  <MobileTooltip content="This token has been verified by the admin">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0 cursor-help">
                      Verified
                    </span>
                  </MobileTooltip>
                )}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5 break-all">Issuer: {token.issuer}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4">
          {/* Price hero */}
          <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Current Price</div>
              <div className="text-2xl font-bold tabular-nums">
                {displayToken?.price ? `${displayToken.price} π` : "—"}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {detailsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {token.volume && (
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">24h Volume</div>
                  <div className="text-sm font-semibold">{token.volume}</div>
                </div>
              )}
            </div>
          </div>

          {showAIAnalysis && (
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">AI Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {token.symbol} shows stable performance with {displayToken?.holders} holders and{" "}
                {displayToken?.liquidity} in liquidity. The token has 24h volume of {token.volume}. Consider market
                conditions before trading.
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="rounded-xl bg-card overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-y divide-border">
              {[
                {
                  label: "Liquidity",
                  tooltip: "Total PI locked in all Token/PI pools",
                  value: (displayToken as any)?.totalLiquidity
                    ? `${(displayToken as any).totalLiquidity} π`
                    : displayToken?.liquidity
                      ? `${displayToken.liquidity} π`
                      : "—",
                },
                {
                  label: "Circ. Supply",
                  tooltip: "Number of tokens currently in circulation",
                  value: (displayToken as any)?.circulatingSupply || "—",
                },
                {
                  label: "Trustlines",
                  tooltip: "All addresses that added this token (including 0 balance)",
                  value: String(displayToken?.trustlines ?? 0),
                },
                {
                  label: "Holders",
                  tooltip: "Addresses with balance > 0",
                  value: String(displayToken?.holders ?? 0),
                },
                {
                  label: "ATH Price",
                  tooltip: "All-Time High price from available historical data",
                  value: athPrice ? `${athPrice} π` : "—",
                },
                {
                  label: "ATL Price",
                  tooltip: "All-Time Low price from available historical data",
                  value: atlPrice ? `${atlPrice} π` : "—",
                },
                ...((displayToken as any)?.totalSupply
                  ? [
                      {
                        label: "Total Supply",
                        tooltip: "Maximum number of tokens that will ever exist",
                        value: (displayToken as any).totalSupply,
                      },
                    ]
                  : []),
                ...((displayToken as any)?.marketCap
                  ? [
                      {
                        label: "Market Cap",
                        tooltip: "Total market value in Pi",
                        value: `${(displayToken as any).marketCap} π`,
                      },
                    ]
                  : []),
              ].map((stat, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    {stat.label}
                    <MobileTooltip content={stat.tooltip}>
                      <Info className="h-3 w-3 cursor-help shrink-0" />
                    </MobileTooltip>
                  </div>
                  <div className="text-sm font-semibold truncate">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
