"use client"

import { PI_NETWORK_CONFIG } from "./system-config"

interface AuthResult {
  accessToken: string
  user: {
    uid: string
    username: string
  }
}

declare global {
  interface Window {
    Pi?: {
      init: (config: { version: string }) => Promise<void>
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: unknown) => void
      ) => Promise<AuthResult>
      nativeFeaturesList?: () => Promise<unknown>
    }
  }
}

export interface PiUserData {
  uid: string
  username: string
  authenticatedAt: number
}

class PiSDK {
  private initialized = false
  private initPromise: Promise<void> | null = null

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${PI_NETWORK_CONFIG.SDK_URL}"]`
      )

      if (existingScript) {
        if (window.Pi) {
          resolve()
          return
        }

        existingScript.addEventListener("load", () => resolve(), { once: true })
        existingScript.addEventListener("error", () => reject(new Error("Failed to load Pi SDK")), {
          once: true,
        })
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

  async init(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      await this.loadScript()

      let attempts = 0
      while (!window.Pi && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts += 1
      }

      if (!window.Pi) {
        throw new Error("Pi SDK failed to initialize")
      }

      await window.Pi.init({ version: "2.0" })
      this.initialized = true
    })().catch((error) => {
      this.initPromise = null
      throw error
    })

    return this.initPromise
  }

  async isPiBrowserAvailable(): Promise<boolean> {
    try {
      await this.init()

      if (typeof window.Pi?.nativeFeaturesList !== "function") {
        return false
      }

      await window.Pi.nativeFeaturesList()
      return true
    } catch {
      return false
    }
  }

  private async exchangeAccessToken(accessToken: string): Promise<PiUserData> {
    const response = await fetch("/api/pi/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ accessToken }),
    })

    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.success || !result?.user) {
      throw new Error(result?.error || `Pi authentication failed: ${response.status}`)
    }

    return {
      uid: result.user.uid,
      username: result.user.username,
      authenticatedAt: Date.now(),
    }
  }

  async authenticate(): Promise<PiUserData> {
    if (!this.initialized) {
      throw new Error("Pi SDK not initialized. Call init() first.")
    }

    if (!window.Pi) {
      throw new Error("Pi SDK not available. App must run in Pi Browser.")
    }

    const auth = await window.Pi.authenticate(
      ["username"],
      (payment) => {
        console.warn("Incomplete Pi payment found:", payment)
      }
    )

    if (!auth?.accessToken) {
      throw new Error("Pi authentication did not return an access token")
    }

    return this.exchangeAccessToken(auth.accessToken)
  }

  async logout(): Promise<void> {
    try {
      await fetch("/api/pi/logout", {
        method: "POST",
        credentials: "include",
      })
    } finally {
      this.clearUserData()
    }
  }

  clearUserData(): void {
    // Authentication state is held in React memory and the HttpOnly server cookie.
  }

  isAvailable(): boolean {
    return typeof window !== "undefined" && !!window.Pi && this.initialized
  }
}

export const piSDK = new PiSDK()
