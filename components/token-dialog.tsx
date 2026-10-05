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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{token.symbol}</span>
            {token.verified === true && (
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">Verified</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center py-4 bg-muted rounded-xl">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Current price</div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {displayToken?.price ? `${displayToken.price} π` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-2 break-all">Issuer {token.issuer}</p>
            {detailsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto mt-2" />}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "24h volume", value: (displayToken as any)?.volume24h ? `${(displayToken as any).volume24h} π` : token.volume || "—" },
              { label: "Circ. supply", value: (displayToken as any)?.circulatingSupply || "—" },
              { label: "Trustlines", value: String(displayToken?.trustlines ?? 0) },
              { label: "In pools", value: (displayToken as any)?.poolBalance || "—" },
              { label: "All-time high", value: athPrice ? `${athPrice} π` : "—" },
              { label: "All-time low", value: atlPrice ? `${atlPrice} π` : "—" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-muted p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</div>
                <div className="mt-1 text-sm font-semibold truncate">{stat.value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Issuer flags</div>
            <div className="mt-1 text-sm font-semibold">{(displayToken as any)?.issuerFlags || "—"}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
