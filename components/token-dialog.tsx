"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Loader2 } from "lucide-react"
import type { Token } from "@/lib/mock-data"
import { useTokenDetails, useOrderBook, useTokenMetadata } from "@/lib/use-market-data"

function TokenDetailsSkeleton() {
  return (
    <div className="space-y-4 pb-10" aria-busy="true" aria-live="polite">
      <div className="h-5 w-20 animate-pulse rounded bg-muted" />
      <div className="rounded-xl bg-muted px-4 py-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="space-y-3"><div className="h-6 w-24 animate-pulse rounded bg-background/70" /><div className="h-4 w-40 max-w-full animate-pulse rounded bg-background/50" /></div>
          <div className="space-y-2 text-right"><div className="ml-auto h-3 w-20 animate-pulse rounded bg-background/50" /><div className="ml-auto h-7 w-28 animate-pulse rounded bg-background/70" /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex h-16 flex-col items-center justify-center gap-2 rounded-xl bg-muted"><div className="h-3 w-16 animate-pulse rounded bg-background/50" /><div className="h-4 w-20 animate-pulse rounded bg-background/70" /></div>)}</div>
      <div className="space-y-3"><div className="h-4 w-24 animate-pulse rounded bg-muted" /><div className="grid grid-cols-3 gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="flex h-16 flex-col items-center justify-center gap-2 rounded-xl bg-muted"><div className="h-3 w-14 animate-pulse rounded bg-background/50" /><div className="h-4 w-16 animate-pulse rounded bg-background/70" /></div>)}</div><div className="grid grid-cols-2 gap-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="space-y-2"><div className="flex justify-center"><div className="h-3 w-10 animate-pulse rounded bg-muted" /></div>{Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-9 animate-pulse rounded-lg bg-muted" />)}</div>)}</div></div>
    </div>
  )
}

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
  const { data: metadata } = useTokenMetadata(assetCode, issuer)
  const [logoFailed, setLogoFailed] = useState(false)

  const { data: orderBook, isLoading: bookLoading } = useOrderBook(assetCode, issuer) as {
    data?: any
    isLoading: boolean
  }

  const displayToken = { ...token, ...(tokenDetails || {}) }

  if (detailsLoading && !tokenDetails) return <TokenDetailsSkeleton />

  return (
    <div className="space-y-4 pb-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Market
      </Link>

      <div className="rounded-xl bg-muted px-4 py-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3 text-left">
            {metadata?.image && !logoFailed ? (
              <img src={metadata.image} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" onError={() => setLogoFailed(true)} />
            ) : null}
            <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{assetCode}</h1>
            <button type="button" onClick={() => { if (!issuer) return; navigator.clipboard.writeText(issuer); setCopied(true); setTimeout(() => setCopied(false), 1500) }} disabled={!issuer} className="mt-2 inline-flex max-w-full items-center gap-2 text-xs text-muted-foreground disabled:cursor-default">
              <span className="truncate">{issuer ? `${issuer.slice(0, 4)}...${issuer.slice(-4)}` : "—"}</span>
              {issuer && <Copy className="h-3.5 w-3.5 shrink-0" />}
              {issuer && <span>{copied ? "Copied" : "Copy"}</span>}
            </button>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current price</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{displayToken?.price ? `${displayToken.price} π` : "—"}</div>
            {detailsLoading && <Loader2 className="ml-auto mt-2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Market cap", value: (displayToken as any)?.marketCap ? String((displayToken as any).marketCap) + " π" : "—" },
          { label: "Circ. supply", value: (displayToken as any)?.circulatingSupply || "—" },
          { label: "Trustlines", value: displayToken?.trustlines != null ? String(displayToken.trustlines) : "—" },
          { label: "Holders", value: (displayToken as any)?.holders != null ? String((displayToken as any).holders) : "—" },
          { label: "In pools", value: (displayToken as any)?.poolBalance || "—" },
          { label: "24h volume", value: (displayToken as any)?.volume24h ? String((displayToken as any).volume24h) + " π" : "—" },
          { label: "All-time low", value: (displayToken as any)?.atlPrice ? String((displayToken as any).atlPrice) + " π" : "—" },
          { label: "All-time high", value: (displayToken as any)?.athPrice ? String((displayToken as any).athPrice) + " π" : "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-muted p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</div>
            <div className="mt-1 truncate text-sm font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order book</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Best bid", orderBook?.bestBid],
            ["Best ask", orderBook?.bestAsk],
            ["Spread", orderBook?.spread],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-muted p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="mt-1 truncate text-sm font-semibold">{bookLoading ? "..." : value || "—"}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <p className="text-center text-xs font-semibold text-muted-foreground">Bids</p>
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
            <p className="text-center text-xs font-semibold text-muted-foreground">Asks</p>
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
