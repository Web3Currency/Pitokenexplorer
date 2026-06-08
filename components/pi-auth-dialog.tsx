"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Shield, User } from "lucide-react"

interface PiAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PiAuthDialog({ open, onOpenChange, onConfirm }: PiAuthDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Connect Pi Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-2 text-sm leading-relaxed">
            <p className="font-medium text-foreground">
              Web3Currency (W3C) requests permission for authentication only.
            </p>

            <div className="space-y-3 rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Permission Requested:
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Username</p>
                    <p className="text-xs text-muted-foreground">Display your Pi username and authenticate your identity</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your account data will be securely saved to your device. You can disconnect at any time from your profile
              settings. No other permissions are requested.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-primary hover:bg-primary/90">
            Connect with Pi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
