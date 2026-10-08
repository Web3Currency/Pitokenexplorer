import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to Explorer</Link>
        <h1 className="mt-8 text-3xl font-bold">Privacy</h1>
        <p className="mt-4 text-muted-foreground leading-7">
          Pi Token Explorer is designed to keep data collection limited to what is needed to operate the service.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Pi sign-in</h2>
        <p className="mt-3 text-muted-foreground leading-7">
          If you sign in with Pi Network, the app uses the Pi authentication flow to establish your app session.
          The app relies on the identity returned by the Pi App Studio authentication service rather than
          trusting identity details supplied directly by the browser.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Explorer data</h2>
        <p className="mt-3 text-muted-foreground leading-7">
          Public blockchain and token metadata used by the explorer is indexed to provide search, market,
          liquidity, and token information.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Contact</h2>
        <p className="mt-3 text-muted-foreground leading-7">
          For questions about this service, contact W3C Digital Network at w3cdigitalnetwork@gmail.com.
        </p>
      </div>
    </main>
  )
}
