import { NextRequest, NextResponse } from "next/server"
import { supabaseServer, getCurrentUser, isUserAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all tokens from Supabase (admin can see all, including hidden)
    const { data: tokens, error } = await supabaseServer
      .from("admin_tokens")
      .select("*")
      .order("symbol", { ascending: true })

    if (error) {
      console.error("[v0] Supabase fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
    }

    return NextResponse.json(tokens)
  } catch (error) {
    console.error("[v0] Failed to get tokens:", error)
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const { tokenId, action, metadata } = await request.json()

    if (!tokenId || !action) {
      return NextResponse.json({ error: "Missing tokenId or action" }, { status: 400 })
    }

    let updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    if (action === "hide") {
      updateData.is_hidden = true
    } else if (action === "show") {
      updateData.is_hidden = false
    } else if (action === "verify") {
      updateData.verified = true
    } else if (action === "unverify") {
      updateData.verified = false
    } else if (action === "updateMetadata") {
      if (!metadata) {
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
      }
      updateData = { ...updateData, ...metadata }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update token in Supabase
    const { error: updateError } = await supabaseServer
      .from("admin_tokens")
      .update(updateData)
      .eq("id", tokenId)

    if (updateError) {
      console.error("[v0] Supabase update error:", updateError)
      return NextResponse.json({ error: "Failed to update token" }, { status: 500 })
    }

    // Log the action in audit log
    await supabaseServer.from("admin_audit_log").insert({
      admin_id: user.id,
      action,
      table_name: "admin_tokens",
      record_id: tokenId,
      changes: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to update token:", error)
    return NextResponse.json({ error: "Failed to update token" }, { status: 500 })
  }
}
