"use client"

import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface SecondaryHeaderProps {
  onMenuClick: () => void
  className?: string
}

export function SecondaryHeader({ onMenuClick, className }: SecondaryHeaderProps) {
  return (
    <div
      className={cn(
        "fixed top-14 left-0 right-0 z-40 h-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border",
        className,
      )}
    >
      <div className="flex h-full items-center px-4">
        <button
          onClick={onMenuClick}
          className="p-1.5 hover:bg-muted rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
