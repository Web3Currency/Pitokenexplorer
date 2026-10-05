"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { User, Globe, ChevronDown, Shield, BanknoteIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(true)
  const [currencyExpanded, setCurrencyExpanded] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 relative">
          <User className="w-6 h-6" />
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
          <Collapsible open={settingsExpanded} onOpenChange={setSettingsExpanded}>
            <div className="rounded-xl bg-card/50 border border-border/40 overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      settingsExpanded && "rotate-180",
                    )}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-2 pb-2 space-y-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/60 active:bg-muted transition-colors"
                    onClick={() => toast.info("Security protection is active.")}
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

                  <Collapsible open={currencyExpanded} onOpenChange={setCurrencyExpanded}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/60 active:bg-muted transition-colors">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <BanknoteIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">Default Currency</p>
                          <p className="text-xs text-muted-foreground">Price display</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">PI (π)</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              currencyExpanded && "rotate-180",
                            )}
                          />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3">
                        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">PI (π)</span>
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            All prices displayed in Pi Network native token
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/60 active:bg-muted transition-colors"
                    onClick={() => toast.info("English is currently the only supported language.")}
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
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </SheetContent>
    </Sheet>
  )
}
