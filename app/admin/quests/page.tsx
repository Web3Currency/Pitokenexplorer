"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, Archive, Eye, Search, Calendar, Plus } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { QuestCreationDashboard } from "@/components/quest-creation-dashboard"
import type { Quest } from "@/lib/admin/questStore"

export default function AdminQuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    questId: string
    newStatus: string
    action: string
  }>({
    open: false,
    questId: "",
    newStatus: "",
    action: "",
  })

  const loadQuests = async () => {
    try {
      const response = await fetch("/api/admin/quests")
      const data = await response.json()
      setQuests(data)
    } catch (error) {
      console.error("[v0] Failed to load quests:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuests()
  }, [])

  const handleStatusChange = (id: string, status: string, action: string) => {
    // Show confirmation for destructive actions
    if (status === "archived" || action === "reject") {
      setConfirmDialog({
        open: true,
        questId: id,
        newStatus: status,
        action,
      })
    } else {
      updateStatus(id, status)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/admin/quests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        loadQuests()
        setConfirmDialog({ open: false, questId: "", newStatus: "", action: "" })
      }
    } catch (error) {
      console.error("[v0] Failed to update quest:", error)
    }
  }

  const filteredQuests = quests.filter((quest) => {
    const matchesSearch =
      quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quest.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || quest.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "approved":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Approved</Badge>
      case "live":
        return <Badge variant="default" className="bg-green-600">Live</Badge>
      case "archived":
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingCount = quests.filter((q) => q.status === "pending").length
  const liveCount = quests.filter((q) => q.status === "live").length

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight">Quest Management</h1>
            <p className="text-pretty text-muted-foreground">
              Review, approve, and publish partner-submitted quests
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Quest
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>Awaiting admin action</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Quests</CardTitle>
              <CardDescription>Visible to users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{liveCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Quests</CardTitle>
              <CardDescription>All submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{quests.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Quests</CardTitle>
            <CardDescription>Manage quest status and visibility</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading quests...</p>
            ) : quests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quests submitted yet</p>
            ) : (
              <div className="space-y-4">
                {quests.map((quest) => (
                  <div
                    key={quest.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{quest.title}</h3>
                        {getStatusBadge(quest.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{quest.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Project: {quest.projectName}
                        </span>
                        <span>Reward: {quest.rewardPool}</span>
                        <span>By: {quest.submittedBy}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(quest.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row gap-2 sm:flex-col">
                      {quest.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2 bg-transparent sm:flex-none"
                            onClick={() => handleStatusChange(quest.id, "approved", "approve")}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2 bg-transparent sm:flex-none"
                            onClick={() => handleStatusChange(quest.id, "archived", "reject")}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      {quest.status === "approved" && (
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => handleStatusChange(quest.id, "live", "publish")}
                        >
                          <Eye className="h-4 w-4" />
                          Publish
                        </Button>
                      )}
                      {quest.status === "live" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 bg-transparent"
                          onClick={() => handleStatusChange(quest.id, "archived", "archive")}
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </Button>
                      )}
                      {quest.status === "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 bg-transparent"
                          onClick={() => handleStatusChange(quest.id, "pending", "restore")}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          onConfirm={() => updateStatus(confirmDialog.questId, confirmDialog.newStatus)}
          title={`${confirmDialog.action === "reject" ? "Reject" : "Archive"} Quest?`}
          description={`Are you sure you want to ${confirmDialog.action === "reject" ? "reject" : "archive"} this quest? This action can be reversed later.`}
          confirmText={confirmDialog.action === "reject" ? "Reject" : "Archive"}
          variant="destructive"
        />

        <QuestCreationDashboard
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onPublish={() => {
            setCreateDialogOpen(false)
            loadQuests() // Reload quests after creation
          }}
        />
      </div>
    </AdminLayout>
  )
}
