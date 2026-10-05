"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Loader2 } from "lucide-react"
import type { Token } from "@/lib/mock-data"
import { useTokenDetails, useTokenPriceHistory, useOrderBook } from "@/lib/use-market-data"

export function TokenDetailsView({ assetCode, issuer }: { assetCode: string; issuer: string }) {
  const [copied, setCopied] = useState(false)
  const token = {
    symbol: assetCode,
    issuer,
    fullIssuer: issuer,
    price: null,
    volume: null,
    verified: false,
  } as unknown as Token

  const { data: tokenDetails, isLoading: detailsLoading } = useTokenDetails(assetCode, issuer)
  const { data: priceHistory } = useTokenPriceHistory(assetCode, issuer)
  const { data: orderBook, isLoading: bookLoading } = useOrderBook(assetCode, issuer) as {
    data?: any
    isLoading: boolean
  }

  const { athPrice, atlPrice } = useMemo(() => {
    if (!priceHistory) return { athPrice: null, atlPrice: null }
    const allPrices: number[] = []
    ;(["24h", "7d", "30d"] as const).forEach((range) => {
      const rangeData = (priceHistory as any)[range]
      if (!Array.isArray(rangeData)) return
      rangeData.forEach((point: any) => {
        const price = Number.parseFloat(point.pricePI)
        if (price > 0) allPrices.push(price)
      })
    })
    if (allPrices.length === 0) return { athPrice: null, atlPrice: null }
    return {
      athPrice: Math.max(...allPrices).toFixed(6),
      atlPrice: Math.min(...allPrices).toFixed(6),
    }
  }, [priceHistory])

  const displayToken = { ...token, ...(tokenDetails || {}) }

  return (
    <div className="space-y-4 pb-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Market
      </Link>

      <div className="rounded-xl bg-muted px-4 py-5 text-center">
        <h1 className="text-xl font-semibold">{assetCode}</h1>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(issuer)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="mx-auto mt-2 inline-flex max-w-full items-center gap-2 text-xs text-muted-foreground"
        >
          <span className="truncate">{issuer ? `${issuer.slice(0, 4)}...${issuer.slice(-4)}` : "—"}</span>
          <Copy className="h-3.5 w-3.5 shrink-0" />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Current price</div>
        <div className="mt-1 text-2xl font-bold tabular-nums">
          {displayToken?.price ? `${displayToken.price} π` : "—"}
        </div>
        {detailsLoading && <Loader2 className="mx-auto mt-2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "24h volume", value: (displayToken as any)?.volume24h ? `${(displayToken as any).volume24h} π` : "—" },
          { label: "Circ. supply", value: (displayToken as any)?.circulatingSupply || "—" },
          { label: "Trustlines", value: String(displayToken?.trustlines ?? 0) },
          { label: "In pools", value: (displayToken as any)?.poolBalance || "—" },
          { label: "All-time high", value: athPrice ? `${athPrice} π` : "—" },
          { label: "All-time low", value: atlPrice ? `${atlPrice} π` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-muted p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</div>
            <div className="mt-1 truncate text-sm font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-muted p-3">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Issuer flags</div>
        <div className="mt-1 text-sm font-semibold">{(displayToken as any)?.issuerFlags || "—"}</div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order book</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Best bid", orderBook?.bestBid],
            ["Best ask", orderBook?.bestAsk],
            ["Spread", orderBook?.spread],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-muted p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-1 truncate text-sm font-semibold">{bookLoading ? "..." : value || "—"}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Bids</p>
            {(orderBook?.bids || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No bids</p>
            ) : (
              orderBook.bids.map((level: any) => (
                <div key={`bid-${level.price}`} className="flex justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span>{level.price}</span>
                  <span className="text-muted-foreground">{level.amount}</span>
                </div>
              ))
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Asks</p>
            {(orderBook?.asks || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No asks</p>
            ) : (
              orderBook.asks.map((level: any) => (
                <div key={`ask-${level.price}`} className="flex justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span>{level.price}</span>
                  <span className="text-muted-foreground">{level.amount}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
