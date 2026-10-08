"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Globe, Shield, BanknoteIcon, LogIn, LogOut } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/lib/user-context"
import { TestnetBadge } from "@/components/testnet-badge"

export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const { user, isLoading, login, logout, isAuthenticated } = useUser()

  const handleLogin = async () => {
    const success = await login()
    if (!success) {
      toast.error("Pi sign-in failed. Please open the app in Pi Browser and try again.")
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success("Signed out of Pi")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 relative">
          <Menu className="w-6 h-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-80 flex-col bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-0"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-2 flex-1 space-y-2 overflow-y-auto">
          <div className="rounded-xl bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {isAuthenticated ? (
                  <span className="text-sm font-semibold">@</span>
                ) : (
                  <LogIn className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {isAuthenticated ? `@${user?.username}` : "Pi Account"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAuthenticated ? "Signed in" : "Sign in with Pi Network"}
                </p>
              </div>
              {isAuthenticated ? (
                <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleLogin} disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              )}
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3 text-left hover:bg-muted/60 active:bg-muted transition-colors"
            onClick={() => toast.info("English is currently the only supported language.")}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Language</p>
              <p className="text-xs text-muted-foreground">Display language</p>
            </div>
            <span className="text-xs text-muted-foreground">English</span>
          </button>

          <div className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BanknoteIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Default Currency</p>
              <p className="text-xs text-muted-foreground">Price display</p>
            </div>
            <span className="text-xs text-muted-foreground">PI (π)</span>
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3 text-left hover:bg-muted/60 active:bg-muted transition-colors"
            onClick={() => toast.info("Security protection is active.")}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Security</p>
              <p className="text-xs text-muted-foreground">Account protection</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground">Active</span>
            </div>
          </button>
        </div>

        <div className="mt-auto flex shrink-0 justify-start border-t border-border/60 pt-4">
          <TestnetBadge />
        </div>
      </SheetContent>
    </Sheet>
  )
}
