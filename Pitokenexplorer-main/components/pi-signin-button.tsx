"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogIn, Loader2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { PiAuthDialog } from "./pi-auth-dialog"
import { toast } from "sonner"

export function PiSignInButton() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { user, isAuthenticated, piSDKReady, login } = useUser()

  if (isAuthenticated) {
    return null
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

  return (
    <>
      <Button
        size="sm"
        onClick={handleLoginClick}
        disabled={isAuthenticating || !piSDKReady}
        className="gap-2"
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

      <PiAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onConfirm={handleAuthConfirm}
      />
    </>
  )
}
