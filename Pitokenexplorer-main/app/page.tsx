import { ExploreSection } from "@/components/explore-section"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <ExploreSection />
      </main>
    </div>
  )
}
