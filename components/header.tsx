"use client"

import { ProfileMenu } from "@/components/profile-menu"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="relative flex h-16 items-center px-4">
        <h1 className="text-lg font-semibold tracking-wide">EXPLORER</h1>

        <div className="ml-auto flex items-center gap-3">
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
