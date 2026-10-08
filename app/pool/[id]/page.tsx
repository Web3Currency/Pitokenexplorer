"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Info } from "lucide-react"
import { Header } from "@/components/header"
import { MobileTooltip } from "@/components/ui/tooltip"
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
        {pool ? (
          <Link
            href={`/token/${encodeURIComponent(pool.tokenCode)}?issuer=${encodeURIComponent(pool.tokenIssuer)}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {pool.tokenCode}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </span>
        )}
        {isLoading && !pool ? (
          <div className="mt-4">
            <PoolDetailsSkeleton />
          </div>
        ) : !pool ? (
          <p className="mt-6 text-sm text-muted-foreground">Pool not found.</p>
        ) : (
          <div className="mt-4 space-y-4 pb-10">
            <h1 className="text-center text-xl font-semibold">{pool.title || `${pool.tokenCode} Pools`}</h1>
            <div className="rounded-xl bg-muted px-4 py-5 text-center">
              <div className="text-3xl font-bold">{pool.tvl || "—"} π</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">TVL</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>Pool fee</span>
                  <MobileTooltip content="The fee charged on swaps through this liquidity pool.">
                    <span aria-label="About pool fee" className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full">
                      <Info className="h-3 w-3" />
                    </span>
                  </MobileTooltip>
                </div>
                <div className="mt-1 text-sm font-semibold">{pool.fee || "—"}</div>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>Pool shares</span>
                  <MobileTooltip content="The total shares representing liquidity ownership in this pool.">
                    <span aria-label="About pool shares" className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full">
                      <Info className="h-3 w-3" />
                    </span>
                  </MobileTooltip>
                </div>
                <div className="mt-1 truncate text-sm font-semibold">{pool.totalShares || "—"}</div>
              </div>
              <div className="col-span-2 rounded-xl bg-muted p-3 text-center">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last activity</div>
                <div className="mt-1 text-sm font-semibold">{pool.lastActive || "—"}</div>
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">All pools</h2>
                <MobileTooltip content="All liquidity pools for this token, sorted by the amount of the token locked in each pool.">
                  <span aria-label="About all pools" className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground">
                    <Info className="h-3 w-3" />
                  </span>
                </MobileTooltip>
              </div>
              <div className="space-y-2">
                {pool.allPools?.map((subPool: any) => (
                  <div key={subPool.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div>
                      <div className="text-sm font-medium">{subPool.pair}</div>
                      <div className="text-xs text-muted-foreground">
                        {subPool.providers} providers
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
