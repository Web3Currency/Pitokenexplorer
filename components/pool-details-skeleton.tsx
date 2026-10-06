export function PoolDetailsSkeleton() {
  return (
    <div className="space-y-4 pb-10" aria-busy="true" aria-live="polite">
      <div className="h-5 w-28 animate-pulse rounded bg-muted" />

      <div className="mx-auto h-6 w-36 animate-pulse rounded bg-muted" />

      <div className="rounded-xl bg-muted px-4 py-5 text-center">
        <div className="mx-auto h-9 w-32 animate-pulse rounded bg-background/70" />
        <div className="mx-auto mt-2 h-3 w-10 animate-pulse rounded bg-background/50" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted p-3 text-center">
          <div className="h-3 w-16 animate-pulse rounded bg-background/60" />
          <div className="mt-2 h-4 w-20 animate-pulse rounded bg-background/70" />
        </div>
        <div className="rounded-xl bg-muted p-3">
          <div className="h-3 w-20 animate-pulse rounded bg-background/60" />
          <div className="mt-2 h-4 w-24 animate-pulse rounded bg-background/70" />
        </div>
        <div className="col-span-2 rounded-xl bg-muted p-3 text-center">
          <div className="h-3 w-24 animate-pulse rounded bg-background/60" />
          <div className="mt-2 h-4 w-28 animate-pulse rounded bg-background/70" />
        </div>
      </div>

      <div>
        <div className="mb-3 h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg bg-muted p-3">
              <div className="min-w-0 space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-background/70" />
                <div className="h-3 w-32 animate-pulse rounded bg-background/50" />
              </div>
              <div className="space-y-2 text-right">
                <div className="ml-auto h-4 w-20 animate-pulse rounded bg-background/70" />
                <div className="ml-auto h-3 w-10 animate-pulse rounded bg-background/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
