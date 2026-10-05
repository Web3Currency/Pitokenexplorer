"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"
import { useLiquidityPools } from "@/lib/use-market-data"
import { PoolDetailsSkeleton } from "@/components/pool-details-skeleton"

export default function PoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: pools = [], isLoading } = useLiquidityPools()
  const pool = (pools as any[]).find((item) => item.id === decodeURIComponent(id))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-lg px-4 py-4">
        <Link href="/?tab=liquidityPools" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Liquidity pools
        </Link>
        {isLoading && !pool ? (
          <div className="mt-4">
            <PoolDetailsSkeleton />
          </div>
        ) : !pool ? (
          <p className="mt-6 text-sm text-muted-foreground">Pool not found.</p>
        ) : (
          <div className="mt-4 space-y-4 pb-10">
            <div className="rounded-xl bg-muted px-4 py-5 text-center">
              <h1 className="text-xl font-semibold">{pool.title || `${pool.tokenCode} Pools`}</h1>
              <div className="mt-3 text-2xl font-bold">
                {pool.totalLockedAsset || "—"} {pool.tokenCode}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                Total {pool.tokenCode} locked
              </div>
              <div className="mt-3 text-sm font-semibold">{pool.tvl || "—"} π TVL</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Pool fee</div>
                <div className="mt-1 text-sm font-semibold">{pool.fee || "—"}</div>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Pool shares</div>
                <div className="mt-1 truncate text-sm font-semibold">{pool.totalShares || "—"}</div>
              </div>
              <div className="col-span-2 rounded-xl bg-muted p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last activity</div>
                <div className="mt-1 text-sm font-semibold">{pool.lastActive || "—"}</div>
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">All pools</h2>
              <div className="space-y-2">
                {pool.allPools?.map((subPool: any) => (
                  <div key={subPool.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div>
                      <div className="text-sm font-medium">{subPool.pair}</div>
                      <div className="text-xs text-muted-foreground">
                        {subPool.providers} providers{subPool.fee ? ` · ${subPool.fee} fee` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{subPool.lockedToken}</div>
                      <div className="text-xs text-muted-foreground">locked</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
