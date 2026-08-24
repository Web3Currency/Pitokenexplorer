"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
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
  const [isLoading, setIsLoading] = useState(false)
  const [piSDKReady, setPiSDKReady] = useState(false)

  // The Pi SDK is intentionally lazy. The read-only Explorer should not load
  // authentication code or initialize the SDK until the user chooses to connect.
  const login = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)

    try {
      await piSDK.init()
      setPiSDKReady(true)

      const savedUser = piSDK.getUserData()
      if (savedUser) {
        setUser(savedUser)
        return true
      }

      const userData = await piSDK.authenticate()
      setUser(userData)
      return true
    } catch (error) {
      console.error("Pi authentication failed:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    piSDK.clearUserData()
    setUser(null)
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
