export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur">
        <div className="relative flex h-16 items-center px-4">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="space-y-4 pb-10" aria-busy="true" aria-live="polite">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="rounded-xl bg-muted px-4 py-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="space-y-3">
                <div className="h-6 w-24 animate-pulse rounded bg-background/70" />
                <div className="h-4 w-40 animate-pulse rounded bg-background/50" />
              </div>
              <div className="space-y-2 text-right">
                <div className="ml-auto h-3 w-20 animate-pulse rounded bg-background/50" />
                <div className="ml-auto h-7 w-28 animate-pulse rounded bg-background/70" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
