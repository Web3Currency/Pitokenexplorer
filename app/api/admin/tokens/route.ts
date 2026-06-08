import { NextRequest, NextResponse } from "next/server"
import { 
  getTokensWithVisibility, 
  hideToken, 
  showToken,
  verifyToken,
  unverifyToken,
  updateTokenMetadata
} from "@/lib/admin/tokenStore"

export async function GET() {
  try {
    const tokens = await getTokensWithVisibility()
    return NextResponse.json(tokens)
  } catch (error) {
    console.error("[v0] Failed to get tokens:", error)
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { tokenId, action, metadata } = await request.json()

    if (!tokenId || !action) {
      return NextResponse.json({ error: "Missing tokenId or action" }, { status: 400 })
    }

    if (action === "hide") {
      await hideToken(tokenId)
    } else if (action === "show") {
      await showToken(tokenId)
    } else if (action === "verify") {
      await verifyToken(tokenId)
    } else if (action === "unverify") {
      await unverifyToken(tokenId)
    } else if (action === "updateMetadata") {
      if (!metadata) {
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
      }
      await updateTokenMetadata(tokenId, metadata)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update token:", error)
    return NextResponse.json({ error: "Failed to update token" }, { status: 500 })
  }
}
