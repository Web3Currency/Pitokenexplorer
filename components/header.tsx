"use client"

import { ProfileMenu } from "@/components/profile-menu"

export function Header() {
  const pageTitle = "EXPLORER"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4">
        <h1 className="text-lg font-semibold tracking-wide">{pageTitle}</h1>

        <div className="flex items-center gap-3">
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
