"use client"

import { useEffect, useState } from "react"
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
  return (
    <section className="flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0710] px-6 py-10">
      <style>{`
        @keyframes piExplorerOrangeGlow {
          0%, 100% { transform: translate3d(-50%, 0, 0) scale(1); opacity: 0.75; }
          25% { transform: translate3d(-42%, 18px, 0) scale(1.08); opacity: 0.9; }
          50% { transform: translate3d(-58%, 8px, 0) scale(0.96); opacity: 0.68; }
          75% { transform: translate3d(-48%, -14px, 0) scale(1.05); opacity: 0.82; }
        }

        @keyframes piExplorerPurpleGlow {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.6; }
          25% { transform: translate3d(-22px, 18px, 0) scale(1.08); opacity: 0.72; }
          50% { transform: translate3d(16px, -10px, 0) scale(0.94); opacity: 0.52; }
          75% { transform: translate3d(-10px, -22px, 0) scale(1.04); opacity: 0.68; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pi-explorer-glow {
            animation: none !important;
          }
        }
      `}</style>

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div
          aria-hidden="true"
          className="pi-explorer-glow pointer-events-none absolute -top-28 left-1/2 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl will-change-transform"
          style={{ animation: "piExplorerOrangeGlow 18s ease-in-out infinite" }}
        />
        <div
          aria-hidden="true"
          className="pi-explorer-glow pointer-events-none absolute right-0 top-32 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl will-change-transform"
          style={{ animation: "piExplorerPurpleGlow 24s ease-in-out infinite" }}
        />

        <img
          src="/pi-token-explorer-logo.svg"
          alt="Pi Token Explorer"
          className="relative h-24 w-24 rounded-3xl shadow-[0_0_45px_rgba(249,115,22,0.18)]"
        />

        <h1 className="relative mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Pi Token Explorer
        </h1>

        <p className="relative mt-1 text-xs font-medium uppercase tracking-[0.18em] text-white/50">
          Built for Mobile
        </p>

        <div className="relative mt-6 rounded-[2rem] bg-white p-4 shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=1&data=${encodeURIComponent(APP_URL)}`}
            alt="QR code for Pi Token Explorer"
            className="h-64 w-64 sm:h-72 sm:w-72"
          />
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

type DeviceMode = "checking" | "desktop" | "mobile"

function useDeviceMode(): DeviceMode {
  const [mode, setMode] = useState<DeviceMode>("checking")

  useEffect(() => {
    // Decide once from device identity and input capabilities. Do not use the
    // resizable browser viewport, and do not reclassify on resize/orientation.
    // This keeps a desktop on the QR landing page even when its window shrinks.
    const navigatorWithUAData = navigator as Navigator & {
      userAgentData?: { mobile?: boolean }
    }
    const uaMobile = navigatorWithUAData.userAgentData?.mobile
    const userAgent = navigator.userAgent
    const mobileUserAgent =
      /Android|iPhone|iPad|iPod|Mobile|Tablet|IEMobile|Opera Mini/i.test(userAgent)
    const touchTablet = navigator.maxTouchPoints > 1 && window.screen.width < 1200
    const isMobileDevice = uaMobile ?? (mobileUserAgent || touchTablet)

    setMode(isMobileDevice ? "mobile" : "desktop")
  }, [])

  return mode
}

export default function HomePage() {
  const deviceMode = useDeviceMode()

  // Never render the QR landing screen while device detection is unresolved.
  // This prevents a mobile visitor seeing it briefly before the explorer mounts.
  if (deviceMode === "checking") {
    return <main className="min-h-screen bg-[#0b0710]" aria-busy="true" aria-label="Checking device compatibility" />
  }

  return (
    <div className="min-h-screen bg-background">
      {deviceMode === "mobile" ? <div className="flex min-h-screen flex-col">
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

      : <DesktopAccessScreen />}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  )
}
