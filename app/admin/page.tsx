"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trophy, Compass, Settings as SettingsIcon } from "lucide-react"

interface DashboardStats {
  pendingQuests: number
  liveQuests: number
  totalTokens: number
  hiddenTokens: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingQuests: 0,
    liveQuests: 0,
    totalTokens: 0,
    hiddenTokens: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [questsRes, tokensRes] = await Promise.all([
          fetch("/api/admin/quests"),
          fetch("/api/admin/tokens"),
        ])

        const quests = await questsRes.json()
        const tokens = await tokensRes.json()

        setStats({
          pendingQuests: quests.filter((q: any) => q.status === "pending").length,
          liveQuests: quests.filter((q: any) => q.status === "live").length,
          totalTokens: tokens.length,
          hiddenTokens: tokens.filter((t: any) => t.isHidden).length,
        })
      } catch (error) {
        console.error("[v0] Failed to load dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            W3C Admin Dashboard
          </h1>
          <p className="text-pretty text-muted-foreground">
            Manage quests, explorer content, and system settings
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Quests</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.pendingQuests}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Quests</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.liveQuests}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Compass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.totalTokens}
              </div>
              <p className="text-xs text-muted-foreground">In registry</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hidden Tokens</CardTitle>
              <Compass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stats.hiddenTokens}
              </div>
              <p className="text-xs text-muted-foreground">Not visible to users</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Quests</CardTitle>
              <CardDescription>Review and publish partner quests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Review</span>
                  <span className="text-lg font-bold">{loading ? "..." : stats.pendingQuests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Live</span>
                  <span className="text-lg font-bold">{loading ? "..." : stats.liveQuests}</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full gap-2 bg-transparent">
                <Link href="/admin/quests">
                  Manage Quests
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Explorer</CardTitle>
              <CardDescription>Control token and pool visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Tokens</span>
                  <span className="text-lg font-bold">{loading ? "..." : stats.totalTokens}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hidden</span>
                  <span className="text-lg font-bold">{loading ? "..." : stats.hiddenTokens}</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full gap-2 bg-transparent">
                <Link href="/admin/explorer">
                  Manage Tokens
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure system preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-semibold text-green-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="text-sm font-mono">1.0.0</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full gap-2 bg-transparent">
                <Link href="/admin/settings">
                  View Settings
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
