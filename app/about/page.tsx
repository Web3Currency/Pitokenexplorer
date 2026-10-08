import Link from "next/link"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Explorer</Link>
        <h1 className="mt-8 text-3xl font-bold">About Pi Token Explorer</h1>
        <p className="mt-4 text-muted-foreground leading-7">
          Pi Token Explorer is a simple tool built by W3C Digital Network for exploring tokens in the Pi Network ecosystem.
          It brings token information, prices, liquidity, and market data together in one place.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Data</h2>
        <p className="mt-3 text-muted-foreground leading-7">
          The explorer indexes Pi Network Testnet data through Pi Network's Horizon API, including liquidity pools,
          token balances, order books, trades, and token TOML metadata. The displayed market data is calculated and
          indexed by W3C Digital Network and may be delayed, incomplete, or temporarily unavailable.
        </p>
        <h2 className="mt-8 text-xl font-semibold">What it is not</h2>
        <p className="mt-3 text-muted-foreground leading-7">
          Pi Token Explorer is an information and discovery tool. It is not a Pi Network official product,
          exchange, wallet, investment service, or financial adviser.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">Built and maintained by W3C Digital Network.</p>
      </div>
    </main>
  )
}
