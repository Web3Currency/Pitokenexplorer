import { type NextRequest, NextResponse } from "next/server"

const PI_API_BASE = "https://api.minepi.com"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.substring(7)

    // Verify the access token and get user info from Pi Network API
    const meResponse = await fetch(`${PI_API_BASE}/v2/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!meResponse.ok) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 401 })
    }

    // For testnet, we would query the Horizon API for the user's balance
    // This requires the user's wallet address which can be obtained after authentication
    // For now, return null to indicate balance should be fetched from chain
    return NextResponse.json({
      piBalance: null, // Will be fetched from Horizon API when wallet address is available
    })
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
