"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"

interface QuestIntroSectionProps {
  projectLogo: string
  projectName: string
  intro: string
  rewardPool: string
  instructions: string
}

export function QuestIntroSection({
  projectLogo,
  projectName,
  intro,
  rewardPool,
  instructions,
}: QuestIntroSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const fullContent = `${intro}\n\nTotal Rewards: ${rewardPool} W3C / PI Coin\nDistributed proportionally based on XP ranking\n\nInstructions:\n${instructions}`
  const lines = fullContent.split("\n")
  const isLongContent = lines.length > 5

  return (
    <div className="border border-border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors">
      {/* Project Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={projectLogo || "/placeholder.svg"} alt={projectName} fill className="object-cover" />
        </div>
        <h2 className="text-xl font-bold">{projectName}</h2>
      </div>

      {/* Content - Expandable */}
      <div className={`space-y-3 ${isExpanded ? "max-h-none" : "max-h-40 overflow-hidden"} transition-all duration-300`}>
        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {isExpanded ? fullContent : lines.slice(0, 5).join("\n")}
          {!isExpanded && isLongContent && "..."}
        </div>
      </div>

      {/* Read More Button */}
      {isLongContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
        >
          {isExpanded ? "Show Less" : "Read More"}
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  )
}
