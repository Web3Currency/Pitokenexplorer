"use client"

import { LineChartIcon, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "explore" | "quest"
  onTabChange: (tab: "explore" | "quest") => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const handleExploreClick = () => {
    onTabChange("explore")
  }

  const handleQuestClick = () => {
    onTabChange("quest")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 w-full">
        {/* Explorer Zone - 50% width */}
        <button
          onClick={handleExploreClick}
          className={cn(
            "flex w-1/2 items-center justify-center transition-colors duration-200 outline-none",
            activeTab === "explore"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-primary/5 active:bg-primary/10"
          )}
          aria-label="Explore Navigator"
          title="Go to Explorer"
        >
          <LineChartIcon className="h-6 w-6" />
        </button>

        {/* Quest Zone - 50% width */}
        <button
          onClick={handleQuestClick}
          className={cn(
            "flex w-1/2 items-center justify-center transition-colors duration-200 outline-none",
            activeTab === "quest"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-primary/5 active:bg-primary/10"
          )}
          aria-label="Quest Navigator"
          title="Go to Quests"
        >
          <Target className="h-6 w-6" />
        </button>
      </div>
    </nav>
  )
}
