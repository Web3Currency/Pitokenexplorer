"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Trophy, Compass, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Quests", href: "/admin/quests", icon: Trophy },
  { name: "Explorer", href: "/admin/explorer", icon: Compass },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("admin") === "true"
      if (!isAdmin) {
        router.push("/admin/login")
      }
    }
  }, [router])

  const handleLogout = async () => {
    try {
      // Call logout API to clear server session
      await fetch('/api/admin/login', {
        method: 'DELETE',
        credentials: 'include'
      })
      
      // Clear client-side flag
      localStorage.removeItem("admin")
      router.push("/admin/login")
    } catch (error) {
      console.error('[v0] Logout error:', error)
      // Still redirect even if API call fails
      localStorage.removeItem("admin")
      router.push("/admin/login")
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold">W3C Admin</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-transparent"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <h2 className="text-sm text-muted-foreground">W3C Admin Portal</h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent md:hidden"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}
