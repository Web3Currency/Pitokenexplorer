"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ExploreSection } from "@/components/explore-section"
import { QuestSection } from "@/components/quest-section"
import { BottomNav } from "@/components/bottom-nav"
import { Header } from "@/components/header"
import { AboutPage } from "@/components/about-page"
import { ProfileMenu } from "@/components/profile-menu"

const STORAGE_KEY = "w3c_default_page_preference"

function HomePageContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<"explore" | "quest">("explore")
  const [defaultPage, setDefaultPage] = useState<"explore" | "quest">("explore")
  const [showAbout, setShowAbout] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved preference on mount and handle URL tab parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPreference = localStorage.getItem(STORAGE_KEY) as "explore" | "quest" | null
        
        // Check if URL has a tab parameter (for back navigation)
        const urlTab = searchParams.get('tab')
        if (urlTab === 'quest' || urlTab === 'explore') {
          setActiveTab(urlTab)
          setDefaultPage(urlTab)
        } else if (savedPreference && (savedPreference === "explore" || savedPreference === "quest")) {
          setDefaultPage(savedPreference)
          setActiveTab(savedPreference)
        }
      } catch {
        // Fallback to default if localStorage is not available
      }
      setIsLoaded(true)
    }
  }, [searchParams])

  const handleDefaultPageChange = (page: "explore" | "quest") => {
    setDefaultPage(page)
    try {
      localStorage.setItem(STORAGE_KEY, page)
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  if (showAbout) {
    return <AboutPage onClose={() => setShowAbout(false)} />
  }

  if (!isLoaded) {
    return null // Prevent flash of wrong default
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        activeTab={activeTab} 
        defaultPage={defaultPage}
        onOpenAbout={() => setShowAbout(true)}
        onDefaultPageChange={handleDefaultPageChange}
      />

      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === "explore" && <ExploreSection />}
        {activeTab === "quest" && <QuestSection />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
