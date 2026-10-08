import { ExploreSection } from "@/components/explore-section"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden">
        <ExploreSection />
      </main>
      <Footer />
    </div>
  )
}
