"use client"

import { PI_NETWORK_CONFIG, BACKEND_URLS } from "./system-config"

// Types for Pi SDK v2
interface PiUser {
  uid: string
  username: string
}

interface AuthResult {
  accessToken: string
  user: PiUser
}

// Global Pi SDK declaration
declare global {
  interface Window {
    Pi?: {
      init: (config: { version: string; sandbox?: boolean }) => Promise<void>
      authenticate: (
        scopes: string[],
        onSuccess: (auth: AuthResult) => void,
        onFailure: (error: Error) => void
      ) => void
    }
  }
}

// User data stored locally
export interface PiUserData {
  uid: string
  username: string
  accessToken: string
  walletAddress?: string
  authenticatedAt: number
}

class PiSDK {
  private initialized = false
  private initPromise: Promise<void> | null = null

  // Load the Pi SDK script
  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector(`script[src="${PI_NETWORK_CONFIG.SDK_URL}"]`)) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = PI_NETWORK_CONFIG.SDK_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Pi SDK"))
      document.head.appendChild(script)
    })
  }

  // Initialize the Pi SDK
  async init(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        await this.loadScript()

        // Wait for Pi object to be available
        let attempts = 0
        while (!window.Pi && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          attempts++
        }

        if (!window.Pi) {
          throw new Error("Pi SDK failed to initialize")
        }

        window.Pi.init({
          version: "2.0",
          sandbox: PI_NETWORK_CONFIG.SANDBOX,
        })

        this.initialized = true
        console.log("[v0] Pi SDK initialized successfully")
      } catch (error) {
        console.error("[v0] Pi SDK initialization error:", error)
        throw error
      }
    })()

    return this.initPromise
  }

  // Authenticate user with Pi Network - can be called automatically or manually
  authenticate(): Promise<PiUserData> {
    return new Promise((resolve, reject) => {
      // Ensure SDK is initialized
      if (!this.initialized) {
        reject(new Error("Pi SDK not initialized. Call init() first."))
        return
      }

      if (!window.Pi) {
        reject(new Error("Pi SDK not available. App must run in Pi Browser."))
        return
      }

      console.log("[Pi SDK] Starting authentication (auto or manual)...")

      // Pi.authenticate with ONLY username permission
      window.Pi.authenticate(
        ["username"],
        (auth: AuthResult) => {
          console.log("[Pi SDK] Authentication successful:", auth.user.username)

          // Create user data object
          const userData: PiUserData = {
            uid: auth.user.uid,
            username: auth.user.username,
            accessToken: auth.accessToken,
            authenticatedAt: Date.now(),
          }

          // Save to localStorage
          this.saveUserData(userData)

          resolve(userData)
        },
        (error: Error) => {
          console.error("[Pi SDK] Authentication failed:", error)
          reject(error)
        }
      )
    })
  }

  // Save user data to localStorage
  private saveUserData(userData: PiUserData): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("w3c_pi_user", JSON.stringify(userData))
      console.log("[Pi SDK] User data saved")
    } catch (error) {
      console.error("[Pi SDK] Failed to save user data:", error)
    }
  }

  // Get saved user data from localStorage
  getUserData(): PiUserData | null {
    if (typeof window === "undefined") return null

    try {
      const data = localStorage.getItem("w3c_pi_user")
      if (!data) return null

      const userData: PiUserData = JSON.parse(data)

      // Check if session expired (30 days)
      const daysSinceAuth = (Date.now() - userData.authenticatedAt) / (1000 * 60 * 60 * 24)
      if (daysSinceAuth > 30) {
        console.log("[Pi SDK] Session expired")
        this.clearUserData()
        return null
      }

      return userData
    } catch (error) {
      console.error("[Pi SDK] Failed to retrieve user data:", error)
      return null
    }
  }

  // Clear user data (logout)
  clearUserData(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem("w3c_pi_user")
      console.log("[Pi SDK] User data cleared")
    } catch (error) {
      console.error("[Pi SDK] Failed to clear user data:", error)
    }
  }

  // Check if Pi SDK is available
  isAvailable(): boolean {
    return typeof window !== "undefined" && !!window.Pi && this.initialized
  }
}

// Export singleton instance
export const piSDK = new PiSDK()
