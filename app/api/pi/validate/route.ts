import { NextRequest, NextResponse } from "next/server"

const APP_STUDIO_LOGIN_URL =
  "https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login"

interface LoginRequest {
  accessToken: string
}

interface AppStudioLoginResponse {
  sessionToken: string
  user: {
    uid: string
    username: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const accessToken = body?.accessToken

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Missing accessToken" }, { status: 400 })
    }

    const response = await fetch(APP_STUDIO_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken }),
      cache: "no-store",
    })

    const result = (await response.json().catch(() => null)) as AppStudioLoginResponse | null

    if (!response.ok || !result?.sessionToken || !result?.user?.uid || !result?.user?.username) {
      console.error("[pi-auth] App Studio login failed:", response.status)
      return NextResponse.json(
        { error: "Pi authentication failed" },
        { status: response.status === 401 ? 401 : 502 }
      )
    }

    const nextResponse = NextResponse.json(
      {
        success: true,
        user: {
          uid: result.user.uid,
          username: result.user.username,
        },
      },
      { status: 200 }
    )

    nextResponse.cookies.set("pi_session", result.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return nextResponse
  } catch (error) {
    console.error("[pi-auth] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
