"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ChevronRight, Gift } from "lucide-react"

interface QuestPreviewCardProps {
  id: string
  title: string
  description: string
  bannerUrl: string
  projectName: string
  projectLogo: string
  status: "locked" | "ongoing" | "completed" | "expired"
  participants: number
  rewardPool: string
  onReadMore?: () => void
}

const statusConfig = {
  locked: { label: "Locked", bg: "bg-muted", text: "text-muted-foreground" },
  ongoing: { label: "Ongoing", bg: "bg-blue-500/20", text: "text-blue-600" },
  completed: { label: "Completed", bg: "bg-green-500/20", text: "text-green-600" },
  expired: { label: "Expired", bg: "bg-destructive/20", text: "text-destructive" },
}

export function QuestPreviewCard({
  id,
  title,
  description,
  bannerUrl,
  projectName,
  projectLogo,
  status,
  participants,
  rewardPool,
  onReadMore,
}: QuestPreviewCardProps) {
  const config = statusConfig[status]

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg cursor-pointer">
      <Link href={`/quest/${id}`} className="block w-full h-full absolute inset-0 z-10" />
      {/* Banner Section */}
      <div className="relative h-40 overflow-hidden bg-secondary">
        <Image
          src={bannerUrl || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Floating Badges */}
        <div className="absolute inset-0 flex items-start justify-between p-3 pointer-events-none">
          <Badge className="bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants}
          </Badge>
          <Badge className={`${config.bg} ${config.text} backdrop-blur-sm`}>{config.label}</Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Project Identity Row */}
        <div className="flex items-center gap-3">
          <Image
            src={projectLogo || "/placeholder.svg"}
            alt={projectName}
            width={32}
            height={32}
            className="rounded-full"
          />
          <h3 className="font-semibold text-sm">{projectName}</h3>
        </div>

        {/* Project Introduction */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-foreground/70 line-clamp-3">{description}</p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-accent hover:text-accent/80 text-xs"
            onClick={onReadMore}
            asChild
          >
            <Link href={`/quest/${id}`} className="flex items-center gap-1">
              Read more <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {/* Reward Pool - Prominent Display */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Gift className="h-3.5 w-3.5 text-primary" />
            Reward Pool
          </div>
          <p className="text-lg font-bold text-primary">{rewardPool}</p>
        </div>
      </div>
    </div>
  )
}
