"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Loader2 } from "lucide-react"
import type { Token } from "@/lib/mock-data"
import { useTokenDetails, useTokenPriceHistory, useOrderBook } from "@/lib/use-market-data"

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
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Market cap", value: (displayToken as any)?.marketCap ? `${(displayToken as any).marketCap} π` : "—" },
          { label: "Circ. supply", value: (displayToken as any)?.circulatingSupply || "—" },
          { label: "Trustlines", value: displayToken?.trustlines != null ? String(displayToken.trustlines) : "—" },
          { label: "Holders", value: displayToken?.holders != null ? String(displayToken.holders) : "—" },
          { label: "In pools", value: (displayToken as any)?.poolBalance || "—" },
          { label: "24h volume", value: (displayToken as any)?.volume24h ? `${(displayToken as any).volume24h} π` : "—" },
          { label: "All-time low", value: atlPrice ? `${atlPrice} π` : "—" },
          { label: "All-time high", value: athPrice ? `${athPrice} π` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-muted p-3">
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
