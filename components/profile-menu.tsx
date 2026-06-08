"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { User, Bell, Info, Globe, ChevronDown, Shield, Smartphone, LogOut, Sparkles, LogIn, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"
import { PiAuthDialog } from "./pi-auth-dialog"
import { toast } from "sonner"

interface ProfileMenuProps {
  onOpenAbout: () => void
  defaultPage?: "explore" | "quest"
  onDefaultPageChange?: (page: "explore" | "quest") => void
}

export function ProfileMenu({ onOpenAbout, defaultPage = "explore", onDefaultPageChange }: ProfileMenuProps) {
  const [open, setOpen] = useState(false)
  const [accountExpanded, setAccountExpanded] = useState(true)
  const [appExpanded, setAppExpanded] = useState(true)
  const [selectedDefault, setSelectedDefault] = useState<"explore" | "quest">(defaultPage)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const { user, isAuthenticated, piSDKReady, login, logout } = useUser()

  const handleAboutClick = () => {
    setOpen(false)
    onOpenAbout()
  }

  const handleLoginClick = () => {
    if (!piSDKReady) {
      toast.error("Pi SDK is still loading", {
        description: "Please wait a moment and try again.",
      })
      return
    }
    setAuthDialogOpen(true)
  }

  const handleAuthConfirm = async () => {
    setAuthDialogOpen(false)
    setIsAuthenticating(true)

    try {
      const success = await login()
      if (success) {
        toast.success("Successfully connected to Pi Network!", {
          description: `Welcome, ${user?.username}!`,
        })
      } else {
        toast.error("Authentication failed", {
          description: "Please try again or check your Pi Network app.",
        })
      }
    } catch (error) {
      toast.error("Authentication error", {
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.info("Disconnected from Pi Network", {
      description: "You can reconnect anytime from the sign-in option.",
    })
    setOpen(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 relative">
            <User className="w-6 h-6" />
            {isAuthenticated && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            )}
            <span className="sr-only">Open profile menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-80 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-l border-border/50"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg font-semibold">Profile</SheetTitle>
          </SheetHeader>

          <div className="mt-2 space-y-3">
            {/* Sign In Section - Show when not authenticated */}
            {!isAuthenticated && (
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <LogIn className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Connect Pi Account</p>
                    <p className="text-xs text-muted-foreground">Authenticate to unlock features</p>
                  </div>
                </div>
                <Button
                  onClick={handleLoginClick}
                  disabled={isAuthenticating || !piSDKReady}
                  className="w-full gap-2 justify-center"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : !piSDKReady ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign In with Pi
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Pi Account Connection Status */}
            {isAuthenticated && (
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">Pi Network Account</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="mt-3 w-full justify-center gap-2 text-xs hover:bg-primary/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </div>
            )}

            {/* Account Section */}
            <Collapsible open={accountExpanded} onOpenChange={setAccountExpanded}>
              <div className="rounded-xl bg-card/50 border border-border/40 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        accountExpanded && "rotate-180",
                      )}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-2 pb-2 space-y-1">
                    {/* Notifications */}
                    <button
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/60 active:bg-muted transition-colors"
                      onClick={() => {}}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">Notifications</p>
                        <p className="text-xs text-muted-foreground">System messages</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                        0
                      </Badge>
                    </button>

                    {/* Security */}
                    <button
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/60 active:bg-muted transition-colors"
                      onClick={() => {}}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">Security</p>
                        <p className="text-xs text-muted-foreground">Account protection</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-muted-foreground">Active</span>
                      </div>
                    </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* App Section */}
            <Collapsible open={appExpanded} onOpenChange={setAppExpanded}>
              <div className="rounded-xl bg-card/50 border border-border/40 overflow-hidden">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">App</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        appExpanded && "rotate-180",
                      )}
                    />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-2 pb-2 space-y-1">
                    {/* Language */}
                    <button
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/60 active:bg-muted transition-colors"
                      onClick={() => {}}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">Language</p>
                        <p className="text-xs text-muted-foreground">Display language</p>
                      </div>
                      <span className="text-xs text-muted-foreground">English</span>
                    </button>

                    {/* Default Page */}
                    <div className="flex w-full items-center gap-3 rounded-lg px-3 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">Default Page</p>
                        <p className="text-xs text-muted-foreground">On app launch</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedDefault("explore")
                            onDefaultPageChange?.("explore")
                          }}
                          className={cn(
                            "px-3 py-1 rounded text-xs font-medium transition-colors",
                            selectedDefault === "explore"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80",
                          )}
                        >
                          Explore
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDefault("quest")
                            onDefaultPageChange?.("quest")
                          }}
                          className={cn(
                            "px-3 py-1 rounded text-xs font-medium transition-colors",
                            selectedDefault === "quest"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80",
                          )}
                        >
                          Quest
                        </button>
                      </div>
                    </div>

                    {/* About */}
                    <button
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/60 active:bg-muted transition-colors"
                      onClick={handleAboutClick}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Info className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">Litepaper</p>
                        <p className="text-xs text-muted-foreground">App information</p>
                      </div>
                    </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

          {/* System Appearance Note */}
          <div className="mt-2">
            
          </div>
        </div>
      </SheetContent>

      <PiAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onConfirm={handleAuthConfirm}
      />
    </Sheet>
  </>
  )
}
