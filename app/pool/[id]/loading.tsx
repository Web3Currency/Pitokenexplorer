import { Header } from "@/components/header"
import { PoolDetailsSkeleton } from "@/components/pool-details-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto w-full max-w-lg px-4 py-4">
        <PoolDetailsSkeleton />
      </main>
    </div>
  )
}
