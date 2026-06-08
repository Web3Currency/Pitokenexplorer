"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ExternalLink, ChevronRight } from "lucide-react"
import Link from "next/link"

interface QuestTaskItemProps {
  id: string
  title: string
  description: string
  xpReward: number
  type: "social" | "onchain" | "offchain" | "referral"
  completed: boolean
  missionLink?: string
  onToggle?: (id: string) => void
  onOpenModal?: (taskId: string) => void
}

export function QuestTaskItem({
  id,
  title,
  description,
  xpReward,
  type,
  completed,
  missionLink,
  onToggle,
  onOpenModal,
}: QuestTaskItemProps) {
  const [isChecked, setIsChecked] = useState(completed)
  const [showClaim, setShowClaim] = useState(isChecked)

  const handleToggle = () => {
    const newState = !isChecked
    setIsChecked(newState)
    setShowClaim(newState)
    onToggle?.(id)
  }

  const handleTaskClick = () => {
    if (type === "social" && missionLink) {
      window.open(missionLink, "_blank")
    } else {
      onOpenModal?.(id)
    }
  }

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
        isChecked
          ? "bg-primary/5 border-primary/30"
          : "bg-card hover:bg-card/80 border-border hover:border-primary/50"
      }`}
    >
      {/* Checkbox */}
      <div className="pt-1">
        <Checkbox checked={isChecked} onCheckedChange={handleToggle} />
      </div>

      {/* Task Details */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleTaskClick}>
        <h4 className="font-semibold text-sm leading-tight">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      {/* XP Reward & Action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex flex-col items-end">
          <span className="font-bold text-primary text-sm">+{xpReward} XP</span>
          <span className="text-xs text-muted-foreground">Ranking Score</span>
        </div>

        {type === "social" && missionLink ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            asChild
          >
            <a href={missionLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : type !== "social" && !isChecked ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onOpenModal?.(id)
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : isChecked && showClaim ? (
          <Button
            size="sm"
            variant="default"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation()
              setShowClaim(false)
            }}
          >
            Claim
          </Button>
        ) : null}
      </div>
    </div>
  )
}
