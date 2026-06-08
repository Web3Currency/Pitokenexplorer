"use client"

import { SheetTitle } from "@/components/ui/sheet"
import { SheetHeader } from "@/components/ui/sheet"
import { SheetContent } from "@/components/ui/sheet"
import { Sheet } from "@/components/ui/sheet"
import { useState, useRef, useEffect } from "react"
import { SecondaryHeader } from "./secondary-header"
import { QuestMenu } from "./quest-menu"
import { QuestIntroCard } from "./quest-intro-card"
import { QuestPreviewCard } from "./quest-preview-card"
import { BackToTop } from "./back-to-top"
import { QuestCreationDashboard } from "./quest-creation-dashboard"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Filter, X, ArrowUpDown, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestControls } from "./quest-controls" // Import QuestControls

interface Quest {
  id: string
  title: string
  description: string
  bannerUrl: string
  projectName: string
  projectLogo: string
  status: string
  participants: number
  rewardPool: string
  liveAt?: string
}

type SortOption = "newest" | "oldest" | "reward-asc" | "reward-desc" | "participants-asc" | "participants-desc"
type FilterStatus = "all" | "ongoing" | "upcoming" | "finished"

export function QuestSection() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showCreationDashboard, setShowCreationDashboard] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>("newest")
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter state - pending filters only apply when user clicks Apply
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
  })
  const [pendingFilters, setPendingFilters] = useState(activeFilters)

  const statusOptions = ["Ongoing", "Upcoming", "Finished"]
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showSortSheet, setShowSortSheet] = useState(false)

  // Fetch live quests from API
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const response = await fetch("/api/quest")
        const data = await response.json()
        setQuests(data.quests || [])
      } catch (error) {
        console.error("[v0] Failed to fetch quests:", error)
        setQuests([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuests()
  }, [])

  const handleApplyFilters = () => {
    setActiveFilters(pendingFilters)
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    const reset = { status: [] }
    setPendingFilters(reset)
    setActiveFilters(reset)
  }

  // Apply all filters and sorting
  const filteredQuests = quests
    .filter((quest) => {
      // Search filter by project name
      const matchesSearch = quest.projectName.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchesSearch) return false

      // Status filter
      if (activeFilters.status.length > 0) {
        const questStatus = quest.status.charAt(0).toUpperCase() + quest.status.slice(1)
        if (!activeFilters.status.includes(questStatus)) return false
      }

      return true
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortOption) {
        case "newest":
          return new Date(b.liveAt || 0).getTime() - new Date(a.liveAt || 0).getTime()
        case "oldest":
          return new Date(a.liveAt || 0).getTime() - new Date(b.liveAt || 0).getTime()
        case "reward-desc":
          return parseFloat(b.rewardPool.replace(/[^0-9.]/g, "")) - parseFloat(a.rewardPool.replace(/[^0-9.]/g, ""))
        case "reward-asc":
          return parseFloat(a.rewardPool.replace(/[^0-9.]/g, "")) - parseFloat(b.rewardPool.replace(/[^0-9.]/g, ""))
        case "participants-desc":
          return b.participants - a.participants
        case "participants-asc":
          return a.participants - b.participants
        default:
          return 0
      }
    })

  const handlePublishQuest = async (questData: any) => {
    try {
      const response = await fetch("/api/quests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questData),
      })
      
      const result = await response.json()
      if (result.success) {
        alert(result.message)
      } else {
        alert("Failed to submit quest: " + (result.error || "Unknown error"))
      }
    } catch (error) {
      console.error("[v0] Failed to submit quest:", error)
      alert("Failed to submit quest. Please try again.")
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      <SecondaryHeader onMenuClick={() => setIsMenuOpen(true)} />
      <QuestMenu 
        open={isMenuOpen} 
        onOpenChange={setIsMenuOpen}
        onCreateQuestClick={() => setShowCreationDashboard(true)}
      />
      <QuestCreationDashboard 
        open={showCreationDashboard} 
        onOpenChange={setShowCreationDashboard}
        onPublish={handlePublishQuest}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="p-4 space-y-6">
          {/* Quest Introduction Card */}
          <QuestIntroCard />

          {/* Quest Controls Row - Explorer Style */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-3">
            <div className="flex items-center gap-2">
              {/* Filter Popover */}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors shrink-0 relative",
                      activeFilters.status.length > 0 && "border-primary text-primary"
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    {activeFilters.status.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 shadow-xl border-border bg-card" align="start">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Filters</h3>
                    <button onClick={() => setIsFilterOpen(false)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <ScrollArea className="h-[250px]">
                    <Accordion type="multiple" className="px-4">
                      <AccordionItem value="status" className="border-none">
                        <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-3 hover:no-underline">
                          Quest Status
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pb-4">
                          {statusOptions.map((status) => (
                            <div key={status} className="flex items-center gap-2">
                              <Checkbox
                                id={`status-${status}`}
                                checked={pendingFilters.status.includes(status)}
                                onCheckedChange={(checked) => {
                                  setPendingFilters((prev) => ({
                                    ...prev,
                                    status: checked
                                      ? [...prev.status, status]
                                      : prev.status.filter((s) => s !== status),
                                  }))
                                }}
                              />
                              <label htmlFor={`status-${status}`} className="text-sm font-medium leading-none cursor-pointer">
                                {status}
                              </label>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </ScrollArea>
                  <div className="p-4 border-t border-border grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg h-9 bg-transparent" onClick={handleResetFilters}>
                      Reset
                    </Button>
                    <Button size="sm" className="rounded-lg h-9" onClick={handleApplyFilters}>
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Sort Button */}
              <button
                onClick={() => {
                  setSortOption((prev) => {
                    if (prev === "newest") return "oldest"
                    if (prev === "oldest") return "reward-desc"
                    if (prev === "reward-desc") return "reward-asc"
                    if (prev === "reward-asc") return "participants-desc"
                    if (prev === "participants-desc") return "participants-asc"
                    return "newest"
                  })
                }}
                className={cn(
                  "p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors shrink-0 flex items-center gap-1.5",
                  sortOption !== "newest" && "border-primary/50"
                )}
                title={`Current sort: ${sortOption.replace("-", " ")}`}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="text-xs font-medium hidden sm:inline">
                  {sortOption === "newest" && "New→Old"}
                  {sortOption === "oldest" && "Old→New"}
                  {sortOption === "reward-desc" && "Reward↓"}
                  {sortOption === "reward-asc" && "Reward↑"}
                  {sortOption === "participants-desc" && "Part.↓"}
                  {sortOption === "participants-asc" && "Part.↑"}
                </span>
              </button>

              {/* Sort Reset Button */}
              {sortOption !== "newest" && (
                <button
                  onClick={() => setSortOption("newest")}
                  className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset Sort
                </button>
              )}

              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by project name..."
                  className="pl-9 bg-card border-border"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground mt-4">Loading quests...</p>
            </div>
          )}

          {/* Quest List Section */}
          {!loading && filteredQuests.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredQuests.map((quest) => (
                <QuestPreviewCard
                  key={quest.id}
                  id={quest.id}
                  title={quest.title}
                  description={quest.description}
                  bannerUrl={quest.bannerUrl}
                  projectName={quest.projectName}
                  projectLogo={quest.projectLogo}
                  status={quest.status}
                  participants={quest.participants}
                  rewardPool={quest.rewardPool}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && quests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-6">
                <svg
                  className="h-12 w-12 text-muted-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold mb-2">No Live Quests Yet</p>
              <p className="text-sm text-muted-foreground/70 max-w-sm">
                Check back soon for new quests, or create your own quest to engage the community!
              </p>
            </div>
          )}

          {/* No Results State */}
          {!loading && quests.length > 0 && filteredQuests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">No quests match your search</p>
              <p className="text-sm text-muted-foreground/70">
                Try adjusting your search terms.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  )
}
