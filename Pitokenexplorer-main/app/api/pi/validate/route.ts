import { NextRequest, NextResponse } from "next/server"

interface ValidateRequest {
  accessToken: string
  uid: string
  username: string
}

/**
 * POST /api/pi/validate
 * 
 * Validates a Pi Network access token by calling the Pi API
 * GET https://api.minepi.com/v2/me with Authorization: Bearer <accessToken>
 * 
 * This ensures the token is valid before establishing a session.
 * No Pi Network API key is required - the access token is sufficient.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequest = await request.json()
    const { accessToken, uid, username } = body

    if (!accessToken || !uid || !username) {
      return NextResponse.json(
        { error: "Missing required fields: accessToken, uid, username" },
        { status: 400 }
      )
    }

    console.log("[v0] Validating Pi token for user:", username)

    // Call Pi API to validate the token
    // GET https://api.minepi.com/v2/me with Authorization: Bearer <accessToken>
    const response = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Pi API validation failed:", response.status, response.statusText)
      return NextResponse.json(
        { error: "Token validation failed" },
        { status: 401 }
      )
    }

    const piUserData = await response.json()
    console.log("[v0] Pi token validated successfully for:", piUserData.username)

    // Verify the uid matches
    if (piUserData.uid !== uid) {
      console.error("[v0] UID mismatch:", piUserData.uid, "!==", uid)
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 401 }
      )
    }

    // Token is valid - return success
    return NextResponse.json(
      {
        success: true,
        message: "Token validated successfully",
        user: {
          uid: piUserData.uid,
          username: piUserData.username,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Token validation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
