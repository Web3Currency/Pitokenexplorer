"use client"

import { useEffect, useState } from "react"
import * as QRCode from "qrcode"
import { ExploreSection } from "@/components/explore-section"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

const APP_URL = "https://apppitokenexplor8194.pinet.com"

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
  const [qrCode, setQrCode] = useState("")

  useEffect(() => {
    QRCode.toDataURL(APP_URL, {
      width: 360,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#171221",
        light: "#ffffff",
      },
    }).then(setQrCode)
  }, [])

  return (
    <section className="hidden min-h-screen items-center justify-center overflow-hidden bg-[#0b0710] px-6 py-10 md:flex">
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-32 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl" />

        <img
          src="/pi-token-explorer-logo.svg"
          alt="Pi Token Explorer"
          className="relative h-24 w-24 rounded-3xl shadow-[0_0_45px_rgba(249,115,22,0.18)]"
        />

        <h1 className="relative mt-7 text-xl font-bold tracking-tight text-white">
          Built for mobile
        </h1>

        <div className="relative mt-7 rounded-[2rem] bg-white p-4 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
          {qrCode ? (
            <img
              src={qrCode}
              alt="QR code for Pi Token Explorer"
              className="h-64 w-64 sm:h-72 sm:w-72"
            />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-xl bg-gray-100 sm:h-72 sm:w-72" />
          )}
        </div>

        <a
          href={APP_URL}
          className="relative mt-5 max-w-full break-all text-sm font-semibold text-orange-400 underline decoration-orange-400/40 underline-offset-4 transition-colors hover:text-orange-300"
        >
          {APP_URL.replace("https://", "")}
        </a>

        <p className="relative mt-10 text-xs font-medium tracking-wide text-white/45">
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
