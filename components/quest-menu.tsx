"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Target, Plus, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateQuestClick?: () => void
}

export function QuestMenu({ open, onOpenChange, onCreateQuestClick }: QuestMenuProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-80 overflow-y-auto bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-r border-border/50"
      >
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold">Quest Menu </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Create Quest Section */}
          <Button
            onClick={() => {
              onCreateQuestClick?.()
              onOpenChange(false)
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={cn(
              "w-full h-12 rounded-xl transition-all duration-200",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "flex items-center justify-center gap-2 font-semibold",
              isHovering && "shadow-lg"
            )}
          >
            <Plus className="h-4 w-4" />
            Create Quest
          </Button>

          {/* Info Section */}
          

          {/* Future Features Placeholder */}
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">More features coming soon</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
