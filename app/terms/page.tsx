import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Explorer</Link>
        <h1 className="mt-8 text-3xl font-bold">Terms of Use</h1>
        <p className="mt-4 text-muted-foreground leading-7">
          By using Pi Token Explorer, you understand that the service provides information for general reference and
          does not provide investment, trading, financial, legal, or tax advice.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Data accuracy</h2>
        <p className="mt-3 text-muted-foreground leading-7">
          Token prices, liquidity, volume, holders, and other figures are derived from indexed network data.
          They may be delayed, incomplete, or incorrect. You should verify important information from the underlying
          network before making decisions.
        </p>
        <h2 className="mt-8 text-xl font-semibold">No guarantee</h2>
        <p className="mt-3 text-muted-foreground leading-7">
          W3C Digital Network does not guarantee the availability, accuracy, completeness, or uninterrupted operation
          of the explorer or its data.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Pi Network relationship</h2>
        <p className="mt-3 text-muted-foreground leading-7">
          Pi Token Explorer is an independent third-party project and is not operated by or officially affiliated with
          the Pi Core Team.
        </p>
      </div>
    </main>
  )
}
