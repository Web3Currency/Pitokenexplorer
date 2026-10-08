"use client"

import { useState } from "react"
import { Copy, Check, Smartphone } from "lucide-react"
import { ExploreSection } from "@/components/explore-section"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

const APP_URL = "https://pitokenexplorer.vercel.app/"

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Pi Token Explorer",
  url: APP_URL,
  description:
    "A Pi Network token explorer for discovering tokens with liquidity pools and viewing token prices, liquidity, market data, and ecosystem information.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript and a mobile device",
  isAccessibleForFree: true,
  publisher: {
    "@type": "Organization",
    name: "W3C Digital Network",
  },
  about: {
    "@type": "Thing",
    name: "Pi Network",
    description: "A blockchain ecosystem with tokens and decentralized applications.",
  },
  featureList: [
    "Search Pi Network tokens",
    "View token prices",
    "View token liquidity",
    "Explore Pi ecosystem market data",
    "Discover tokens with Pi liquidity pools",
  ],
}

function DesktopAccessScreen() {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="hidden min-h-screen items-center justify-center bg-background px-6 py-12 md:flex">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
          <Smartphone className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">
          PI TOKEN EXPLORER
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built for mobile
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
          Pi Token Explorer is designed for a simple mobile experience. Open this link on your phone to continue.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Open on your phone
          </p>
          <p className="mt-2 break-all text-sm font-medium">pitokenexplorer.vercel.app</p>

          <button
            type="button"
            onClick={copyLink}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Link copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy link
              </>
            )}
          </button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Built by W3C Digital Network
        </p>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 min-h-0 overflow-hidden">
          <section className="sr-only" aria-label="About Pi Token Explorer">
            <h2>Pi Token Explorer</h2>
            <p>
              Pi Token Explorer is a web application built by W3C Digital Network for exploring the Pi Network token ecosystem.
              It helps users discover Pi ecosystem tokens that have liquidity pools and view available
              token prices, liquidity, market data, and token information.
            </p>
            <p>
              Use the explorer to search for tokens, review liquidity, compare market information,
              and discover assets connected to the Pi Network ecosystem.
            </p>
          </section>
          <ExploreSection />
        </main>
        <Footer />
      </div>

      <DesktopAccessScreen />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  )
}
