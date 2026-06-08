"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Sparkles, Loader2, Info, ExternalLink, Star, Globe } from "lucide-react"
import { Card } from "@/components/ui/card"
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
  const [showAboutCard, setShowAboutCard] = useState(false)

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
        <div className="sticky top-0 bg-card z-10 border-b border-border p-4">
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

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="gap-2"
              onClick={() => {
                if ((displayToken as any)?.tradeUrl) {
                  window.open((displayToken as any).tradeUrl, "_blank")
                }
              }}
              disabled={!(displayToken as any)?.tradeUrl}
            >
              <ExternalLink className="h-4 w-4" />
              Trade on Pi DEX
            </Button>

            <Button variant="outline" className="gap-2">
              <Star className="h-4 w-4" />
              Watchlist
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if ((displayToken as any)?.appUrl) {
                  window.open((displayToken as any).appUrl, "_blank")
                }
              }}
              disabled={!(displayToken as any)?.appUrl}
            >
              <Globe className="h-4 w-4" />
              App
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => setShowAboutCard(!showAboutCard)}>
              <Info className="h-4 w-4" />
              About
            </Button>
          </div>

          {/* About card */}
          {showAboutCard && (displayToken as any)?.description && (
            <Card className="p-4 border-border">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="font-semibold text-sm">About {token.symbol}</h4>
                <button
                  onClick={() => setShowAboutCard(false)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {((displayToken as any)?.website || (displayToken as any)?.twitter || (displayToken as any)?.telegram) && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                  {(displayToken as any)?.website && (
                    <button
                      onClick={() => window.open((displayToken as any).website, "_blank")}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors"
                      aria-label="Website"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </button>
                  )}
                  {(displayToken as any)?.twitter && (
                    <button
                      onClick={() =>
                        window.open(
                          (displayToken as any).twitter.startsWith("@")
                            ? `https://twitter.com/${(displayToken as any).twitter.slice(1)}`
                            : (displayToken as any).twitter.startsWith("http")
                              ? (displayToken as any).twitter
                              : `https://twitter.com/${(displayToken as any).twitter}`,
                          "_blank",
                        )
                      }
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors"
                      aria-label="Twitter"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter
                    </button>
                  )}
                  {(displayToken as any)?.telegram && (
                    <button
                      onClick={() =>
                        window.open(
                          (displayToken as any).telegram.startsWith("http")
                            ? (displayToken as any).telegram
                            : `https://t.me/${(displayToken as any).telegram.replace("t.me/", "")}`,
                          "_blank",
                        )
                      }
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors"
                      aria-label="Telegram"
                    >
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                      </svg>
                      Telegram
                    </button>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">{(displayToken as any).description}</p>
            </Card>
          )}

          {showAIAnalysis && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
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
          <div className="rounded-xl border border-border overflow-hidden">
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
