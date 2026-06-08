"use client"

import { useState } from "react"
import { ChevronDown, CheckCircle2, Circle } from "lucide-react"
import { QuestTaskItem } from "./quest-task-item"

interface Task {
  id: string
  title: string
  description: string
  xpReward: number
  type: "social" | "onchain" | "offchain" | "referral"
  completed: boolean
  missionLink?: string
}

interface QuestTaskCategoryProps {
  label: string
  type: "social" | "onchain" | "offchain" | "referral"
  tasks: Task[]
  onOpenModal?: (taskId: string) => void
}

export function QuestTaskCategory({ label, type, tasks, onOpenModal }: QuestTaskCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>(
    tasks.reduce(
      (acc, task) => {
        acc[task.id] = task.completed
        return acc
      },
      {} as Record<string, boolean>
    )
  )

  const completedCount = Object.values(taskStates).filter(Boolean).length
  const totalCount = tasks.length
  const isCompleted = completedCount === totalCount

  const handleTaskToggle = (taskId: string) => {
    setTaskStates((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Status Icon */}
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}

          {/* Category Info */}
          <div className="text-left flex-1">
            <h3 className="font-semibold text-sm">{label}</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} completed
            </p>
          </div>
        </div>

        {/* Expand Arrow */}
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Tasks List */}
      {isExpanded && (
        <div className="border-t border-border p-3 space-y-2 bg-background/50">
          {tasks.map((task) => (
            <QuestTaskItem
              key={task.id}
              id={task.id}
              title={task.title}
              description={task.description}
              xpReward={task.xpReward}
              type={task.type}
              completed={taskStates[task.id]}
              missionLink={task.missionLink}
              onToggle={handleTaskToggle}
              onOpenModal={onOpenModal}
            />
          ))}
        </div>
      )}
    </div>
  )
}
