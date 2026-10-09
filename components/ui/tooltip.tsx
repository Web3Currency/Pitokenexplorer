"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

const glassTooltipSurface =
  "relative overflow-hidden border border-white/20 bg-background/35 text-foreground shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/25 dark:border-white/15 dark:bg-black/30 dark:supports-[backdrop-filter]:bg-black/20"

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          glassTooltipSurface,
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-xl px-3 py-2 text-xs text-balance",
          className,
        )}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/15 via-white/[0.03] to-transparent" />
        <span className="relative z-[1]">{children}</span>
        <TooltipPrimitive.Arrow className="border-b border-r border-white/20 bg-background/50 dark:bg-black/40 z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] backdrop-blur-xl" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

interface MobileTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  className?: string
}

function MobileTooltip({ children, content, className }: MobileTooltipProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Close tooltip when clicking outside
  React.useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    // Use a slight delay to prevent immediate close on the same tap
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [open])

  return (
    <TooltipProvider>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger
          ref={triggerRef}
          asChild
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(!open)
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(!open)
          }}
        >
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={4}
            className={cn(
              glassTooltipSurface,
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit max-w-[200px] origin-(--radix-tooltip-content-transform-origin) rounded-xl px-3 py-2 text-xs text-balance",
              className,
            )}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/15 via-white/[0.03] to-transparent" />
            <span className="relative z-[1]">{content}</span>
            <TooltipPrimitive.Arrow className="border-b border-r border-white/20 bg-background/50 dark:bg-black/40 z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] backdrop-blur-xl" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, MobileTooltip }
