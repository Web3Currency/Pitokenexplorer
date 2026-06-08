"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestControlsProps {
  onSearchChange?: (value: string) => void
  onFilterClick?: () => void
  onSortClick?: () => void
  hasActiveFilter?: boolean
  hasActiveSort?: boolean
}

export function QuestControls({
  onSearchChange,
  onFilterClick,
  onSortClick,
  hasActiveFilter = false,
  hasActiveSort = false,
}: QuestControlsProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      <Button
        variant="outline"
        size="icon"
        onClick={onFilterClick}
        className={cn("shrink-0 bg-transparent relative", hasActiveFilter && "border-primary")}
        title="Filter quests"
      >
        <Filter className={cn("h-4 w-4", hasActiveFilter && "text-primary")} />
        {hasActiveFilter && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary border-2 border-background" />
        )}
      </Button>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search quests..."
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 bg-secondary/50 border-secondary"
        />
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onSortClick}
        className={cn("shrink-0 bg-transparent relative", hasActiveSort && "border-primary")}
        title="Sort quests"
      >
        <ArrowUpDown className={cn("h-4 w-4", hasActiveSort && "text-primary")} />
        {hasActiveSort && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary border-2 border-background" />
        )}
      </Button>
    </div>
  )
}
