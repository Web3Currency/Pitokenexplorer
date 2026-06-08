"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

export function QuestIntroCard() {
  const [isExpanded, setIsExpanded] = useState(false)

  const fullText =
    "Quests are interactive challenges and missions designed to engage you in the Web3 community. Complete them to earn rewards, unlock achievements, and level up your profile. Each quest has specific objectives and time windows. Participate at your own pace and discover new opportunities."

  const previewText = "Quests are interactive challenges and missions designed to engage you in the Web3 community. Complete them to earn rewards and unlock achievements."

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-3">What are Quests?</h2>
            <p className="text-sm leading-relaxed text-foreground/90">
              {isExpanded ? fullText : previewText}
            </p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors text-sm font-medium group"
          >
            {isExpanded ? "Show less" : "Read more"}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 group-hover:scale-110 transition-transform" />
            ) : (
              <ChevronDown className="h-4 w-4 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
