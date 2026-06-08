"use client"

import { ProfileMenu } from "@/components/profile-menu"

interface HeaderProps {
  activeTab?: "explore" | "quest"
  defaultPage?: "explore" | "quest"
  onOpenAbout?: () => void
  onDefaultPageChange?: (page: "explore" | "quest") => void
}

export function Header({ activeTab = "explore", defaultPage = "explore", onOpenAbout, onDefaultPageChange }: HeaderProps) {
  const pageTitle = activeTab === "explore" ? "EXPLORER" : "QUEST"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4">
        <h1 className="text-lg font-semibold tracking-wide">{pageTitle}</h1>

        <div className="flex items-center gap-3">
          <ProfileMenu 
            onOpenAbout={onOpenAbout || (() => {})} 
            defaultPage={defaultPage}
            onDefaultPageChange={onDefaultPageChange}
          />
        </div>
      </div>
    </header>
  )
}
