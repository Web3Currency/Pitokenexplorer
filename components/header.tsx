"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { ProfileMenu } from "@/components/profile-menu"
import { ExplorerMenu } from "@/components/explorer-menu"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="relative flex h-16 items-center px-4">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-md p-2 transition-colors hover:bg-muted"
          aria-label="Open Explorer menu"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold tracking-wide">
          EXPLORER
        </h1>

        <div className="ml-auto flex items-center gap-3">
          <ProfileMenu />
        </div>
      </div>
      <ExplorerMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  )
}
