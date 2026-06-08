"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { piSDK, type PiUserData } from "./pi-sdk"

interface UserContextType {
  user: PiUserData | null
  isLoading: boolean
  piSDKReady: boolean
  login: () => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PiUserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [piSDKReady, setPiSDKReady] = useState(false)

  // Initialize Pi SDK once at app startup and attempt auto-authentication
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Pi SDK v2 - AWAIT this promise fully before proceeding
        await piSDK.init()
        setPiSDKReady(true)
        console.log("[v0] Pi SDK initialized successfully")

        // Load saved user data from localStorage first
        const savedUser = piSDK.getUserData()
        if (savedUser) {
          setUser(savedUser)
          console.log("[v0] Restored user from localStorage:", savedUser.username)
          setIsLoading(false)
          return
        }

        // If no saved user, attempt automatic authentication
        console.log("[v0] No saved user found, attempting automatic authentication...")
        try {
          const userData = await piSDK.authenticate()
          setUser(userData)
          console.log("[v0] Auto-authentication successful:", userData.username)
        } catch (authError) {
          console.log("[v0] Auto-authentication skipped (user action required)")
          // Auto-auth can be cancelled by user - this is normal
        }
      } catch (error) {
        console.error("[v0] Pi SDK initialization failed:", error)
        setPiSDKReady(false)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Manual login function - call on user click
  const login = useCallback(async (): Promise<boolean> => {
    if (!piSDKReady) {
      console.error("[v0] Pi SDK not ready")
      return false
    }

    setIsLoading(true)
    try {
      // Authenticate with Pi Network - AWAIT fully before proceeding
      const userData = await piSDK.authenticate()
      setUser(userData)
      console.log("[v0] Manual login successful:", userData.username)
      return true
    } catch (error) {
      console.error("[v0] Manual login failed:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [piSDKReady])

  // Logout function
  const logout = useCallback(() => {
    piSDK.clearUserData()
    setUser(null)
    console.log("[v0] User logged out")
  }, [])

  const value: UserContextType = {
    user,
    isLoading,
    piSDKReady,
    login,
    logout,
    isAuthenticated: user !== null,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
