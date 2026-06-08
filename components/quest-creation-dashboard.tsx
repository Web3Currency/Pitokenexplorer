"use client"

import React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Plus, Trash2, ArrowLeft, AlertCircle, Send, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  xpReward: number
  type: "social" | "onchain" | "offchain" | "referral"
  missionLink?: string
}

interface TaskCategory {
  type: "social" | "onchain" | "offchain" | "referral"
  label: string
  tasks: Task[]
}

interface QuestCreationDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPublish?: (questData: any) => void
}

const STORAGE_KEY = "w3c_quest_draft"
const TASK_CATEGORIES = [
  { type: "social" as const, label: "Social Tasks" },
  { type: "onchain" as const, label: "On-Chain Tasks" },
  { type: "offchain" as const, label: "Off-Chain Tasks" },
  { type: "referral" as const, label: "Referral Tasks" },
]

interface QuestDraft {
  projectName: string
  projectLogo: string
  bannerUrl: string
  questTitle: string
  questDescription: string
  projectIntro: string
  instructions: string
  questDuration: 14 | 30 | 60
  rewardPool: string
  categories: TaskCategory[]
}

const defaultDraft: QuestDraft = {
  projectName: "",
  projectLogo: "",
  bannerUrl: "",
  questTitle: "",
  questDescription: "",
  projectIntro: "",
  instructions: "",
  questDuration: 14,
  rewardPool: "",
  categories: TASK_CATEGORIES.map((cat) => ({
    type: cat.type,
    label: cat.label,
    tasks: [],
  })),
}

export function QuestCreationDashboard({ open, onOpenChange, onPublish }: QuestCreationDashboardProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "details" | "tasks">("preview")
  const [draft, setDraft] = useState<QuestDraft>(defaultDraft)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    social: true,
    onchain: true,
    offchain: false,
    referral: false,
  })

  // Load draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          setDraft(JSON.parse(saved))
        }
      } catch {
        // Silently fail
      }
    }
  }, [])

  // Auto-save draft
  useEffect(() => {
    if (!open || !unsavedChanges) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
        setUnsavedChanges(false)
      } catch {
        // Silently fail
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [draft, unsavedChanges, open])

  const handleDraftChange = (updates: Partial<QuestDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
    setUnsavedChanges(true)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        handleDraftChange({ projectLogo: base64 })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        handleDraftChange({ bannerUrl: base64 })
      }
      reader.readAsDataURL(file)
    }
  }

  const addTask = (categoryType: "social" | "onchain" | "offchain" | "referral") => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "",
      description: "",
      xpReward: 0,
      type: categoryType,
      missionLink: "",
    }
    const updatedCategories = draft.categories.map((cat) => {
      if (cat.type === categoryType) {
        return { ...cat, tasks: [...cat.tasks, newTask] }
      }
      return cat
    })
    handleDraftChange({ categories: updatedCategories })
  }

  const updateTask = (categoryType: string, taskId: string, updates: Partial<Task>) => {
    const updatedCategories = draft.categories.map((cat) => {
      if (cat.type === categoryType) {
        return {
          ...cat,
          tasks: cat.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
        }
      }
      return cat
    })
    handleDraftChange({ categories: updatedCategories })
  }

  const removeTask = (categoryType: string, taskId: string) => {
    const updatedCategories = draft.categories.map((cat) => {
      if (cat.type === categoryType) {
        return { ...cat, tasks: cat.tasks.filter((task) => task.id !== taskId) }
      }
      return cat
    })
    handleDraftChange({ categories: updatedCategories })
  }

  const totalTasks = draft.categories.reduce((sum, cat) => sum + cat.tasks.length, 0)
  const totalXP = draft.categories.reduce(
    (sum, cat) => sum + cat.tasks.reduce((catSum, task) => catSum + task.xpReward, 0),
    0
  )

  const isComplete =
    draft.projectName &&
    draft.questTitle &&
    draft.questDescription &&
    draft.bannerUrl &&
    draft.projectLogo &&
    draft.projectIntro &&
    draft.instructions &&
    draft.rewardPool &&
    totalTasks > 0

  const handlePublish = async () => {
    const confirmed = window.confirm(
      `Submit this quest for review?\n\nTotal Reward Pool: ${draft.rewardPool}\nTotal Tasks: ${totalTasks}\n\nAdmin will review before publishing.`
    )

    if (confirmed) {
      try {
        // Submit to admin review system
        const response = await fetch('/api/quests/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: draft }),
        });

        if (response.ok) {
          alert('Quest submitted for review! You will be notified when it is approved.');
          
          // Clear draft after successful submission
          try {
            localStorage.removeItem(STORAGE_KEY)
          } catch {
            // Silently fail
          }

          onPublish?.(draft)
          onOpenChange(false)
        } else {
          alert('Failed to submit quest. Please try again.');
        }
      } catch (error) {
        console.error('[v0] Quest submission error:', error);
        alert('Failed to submit quest. Please check your connection.');
      }
    }
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const bannerInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl p-0">
        <div className="flex-shrink-0 flex items-center justify-between p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-muted rounded-md transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold">Create New Quest</h2>
              <p className="text-xs text-muted-foreground mt-1">For App Builders</p>
            </div>
          </div>
          {unsavedChanges && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Saving...
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 w-full">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            {/* Preview Tab - Matches QuestPreviewCard */}
            <TabsContent value="preview" className="space-y-4 mt-6">
              <div className="bg-card rounded-lg overflow-hidden border border-border/40">
                {/* Banner */}
                {draft.bannerUrl ? (
                  <div className="relative h-40 w-full overflow-hidden bg-secondary">
                    <Image
                      src={draft.bannerUrl || "/placeholder.svg"}
                      alt="Banner preview"
                      width={800}
                      height={160}
                      className="w-full h-full object-cover"
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-muted/30 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Banner preview</p>
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Project Header */}
                  <div className="flex items-center gap-3">
                  {draft.projectLogo ? (
                    <Image
                      src={draft.projectLogo || "/placeholder.svg"}
                      alt="Logo"
                      width={32}
                      height={32}
                      className="rounded-full"
                      unoptimized={true}
                    />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted" />
                    )}
                    <h3 className="font-semibold text-sm">{draft.projectName || "Project Name"}</h3>
                  </div>

                  {/* Title and Description */}
                  <div>
                    <p className="text-sm font-medium text-foreground">{draft.questTitle || "Quest Title"}</p>
                    <p className="text-xs text-foreground/70 line-clamp-3 mt-1">
                      {draft.questDescription || "Quest description will appear here"}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <Badge variant="outline">{totalTasks} Tasks</Badge>
                    <Badge variant="secondary">{draft.rewardPool || "Reward Pool"}</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Details Tab - Quest basics */}
            <TabsContent value="details" className="space-y-4 mt-6">
              <div className="space-y-4">
                {/* Project Logo */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Logo</label>
                  <div className="relative">
                    {draft.projectLogo ? (
                      <div className="relative w-full h-20 rounded-lg border-2 border-border/60 flex items-center justify-center bg-muted/20 group">
                        <Image
                          src={draft.projectLogo || "/placeholder.svg"}
                          alt="Logo"
                          width={60}
                          height={60}
                          className="rounded-lg object-contain"
                          unoptimized={true}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            size="sm"
                            variant="secondary"
                            className="bg-background/90 hover:bg-background"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Change
                          </Button>
                          <Button
                            onClick={() => handleDraftChange({ projectLogo: "" })}
                            size="sm"
                            variant="secondary"
                            className="bg-background/90 hover:bg-background"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-20 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors flex items-center justify-center bg-muted/20"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Click to upload logo</span>
                        </div>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Banner Image</label>
                  <div className="relative">
                    {draft.bannerUrl ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-border/60 group">
                        <Image
                          src={draft.bannerUrl || "/placeholder.svg"}
                          alt="Banner"
                          width={600}
                          height={128}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            onClick={() => bannerInputRef.current?.click()}
                            size="sm"
                            variant="secondary"
                            className="bg-background/90 hover:bg-background"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Change
                          </Button>
                          <Button
                            onClick={() => handleDraftChange({ bannerUrl: "" })}
                            size="sm"
                            variant="secondary"
                            className="bg-background/90 hover:bg-background"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full h-32 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors flex items-center justify-center bg-muted/20"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Click to upload banner</span>
                        </div>
                      </button>
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Project Name */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Name</label>
                  <Input
                    placeholder="e.g., Stellar Network"
                    value={draft.projectName}
                    onChange={(e) => handleDraftChange({ projectName: e.target.value })}
                    className="bg-background/50"
                  />
                </div>

                {/* Quest Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Quest Title</label>
                  <Input
                    placeholder="e.g., Deploy Your First Smart Contract"
                    value={draft.questTitle}
                    onChange={(e) => handleDraftChange({ questTitle: e.target.value })}
                    className="bg-background/50"
                  />
                </div>

                {/* Quest Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Quest Description</label>
                  <textarea
                    placeholder="Brief description of what users will learn"
                    value={draft.questDescription}
                    onChange={(e) => handleDraftChange({ questDescription: e.target.value })}
                    className="w-full h-20 rounded-md border border-border bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Project Intro */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Introduction</label>
                  <textarea
                    placeholder="Tell users about your project and mission"
                    value={draft.projectIntro}
                    onChange={(e) => handleDraftChange({ projectIntro: e.target.value })}
                    className="w-full h-24 rounded-md border border-border bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Quest Instructions</label>
                  <textarea
                    placeholder="Explain how to complete the quest and what tasks they should do first"
                    value={draft.instructions}
                    onChange={(e) => handleDraftChange({ instructions: e.target.value })}
                    className="w-full h-24 rounded-md border border-border bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Quest Duration */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Quest Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[14, 30, 60].map((days) => (
                      <button
                        key={days}
                        onClick={() => handleDraftChange({ questDuration: days as 14 | 30 | 60 })}
                        className={cn(
                          "px-3 py-2.5 rounded-lg border-2 transition-all font-medium text-sm",
                          draft.questDuration === days
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-background/50 text-foreground hover:border-primary/50"
                        )}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Select how long the quest will be active
                  </p>
                </div>

                {/* Reward Pool */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Total Reward Pool</label>
                  <Input
                    placeholder="e.g., 10,000 W3C"
                    value={draft.rewardPool}
                    onChange={(e) => handleDraftChange({ rewardPool: e.target.value })}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total rewards to be distributed to participants
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tasks Tab - Matches user-facing task categories */}
            <TabsContent value="tasks" className="space-y-4 mt-6">
              <div className="space-y-3">
                {draft.categories.map((category) => (
                  <Collapsible
                    key={category.type}
                    open={expandedCategories[category.type]}
                    onOpenChange={(open) =>
                      setExpandedCategories((prev) => ({ ...prev, [category.type]: open }))
                    }
                    className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 hover:bg-card/80 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <h3 className="font-semibold text-sm">{category.label}</h3>
                          <span className="text-xs text-muted-foreground">({category.tasks.length} tasks)</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-muted-foreground transition-transform",
                            expandedCategories[category.type] ? "rotate-180" : ""
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="border-t border-border p-3 space-y-3 bg-background/50">
                      {category.tasks.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-muted-foreground mb-2">No tasks added yet</p>
                          <Button
                            onClick={() => addTask(category.type)}
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Task
                          </Button>
                        </div>
                      ) : (
                        <>
                          {category.tasks.map((task) => (
                            <Card key={task.id} className="bg-background border-border/40">
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <Input
                                    placeholder="Task title"
                                    value={task.title}
                                    onChange={(e) =>
                                      updateTask(category.type, task.id, { title: e.target.value })
                                    }
                                    className="flex-1 bg-background/50 text-sm"
                                  />
                                  <button
                                    onClick={() => removeTask(category.type, task.id)}
                                    className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <textarea
                                  placeholder="Task description"
                                  value={task.description}
                                  onChange={(e) =>
                                    updateTask(category.type, task.id, { description: e.target.value })
                                  }
                                  className="w-full h-16 rounded-md border border-border bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">XP Reward</label>
                                    <Input
                                      type="number"
                                      placeholder="50"
                                      value={task.xpReward}
                                      onChange={(e) =>
                                        updateTask(category.type, task.id, {
                                          xpReward: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="bg-background/50 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                      Mission Link (optional)
                                    </label>
                                    <Input
                                      type="url"
                                      placeholder="https://..."
                                      value={task.missionLink || ""}
                                      onChange={(e) =>
                                        updateTask(category.type, task.id, { missionLink: e.target.value })
                                      }
                                      className="bg-background/50 text-sm"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          <Button
                            onClick={() => addTask(category.type)}
                            variant="outline"
                            className="w-full bg-transparent"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Task
                          </Button>
                        </>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 mt-4">
                <p className="text-xs text-blue-600">
                  Total Tasks: {totalTasks} | Total XP: {totalXP}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex gap-3 p-6 pt-4 border-t bg-background/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={!isComplete} className={cn("flex-1", !isComplete && "opacity-50 cursor-not-allowed")}>
            <Send className="h-4 w-4 mr-2" />
            Publish Quest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
