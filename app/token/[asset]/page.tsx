"use client"

import { use } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { TokenDetailsView } from "@/components/token-dialog"

export default function TokenPage({ params }: { params: Promise<{ asset: string }> }) {
  const { asset } = use(params)
  const searchParams = useSearchParams()
  const issuer = searchParams.get("issuer") || ""

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-4">
        <TokenDetailsView assetCode={decodeURIComponent(asset)} issuer={issuer} />
      </main>
    </div>
  )
}
