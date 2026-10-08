import { ExploreSection } from "@/components/explore-section"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Pi Token Explorer",
  url: "https://pitokenexplorer.vercel.app/",
  description:
    "A Pi Network token explorer for discovering tokens with liquidity pools and viewing token prices, liquidity, market data, and ecosystem information.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </div>
  )
}
