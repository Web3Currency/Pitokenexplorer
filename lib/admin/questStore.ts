import { readJsonFile, writeJsonFile } from './fileStorage'

const QUESTS_FILE = 'quests.json'

export type QuestStatus = "pending" | "approved" | "live" | "archived"

export interface Quest {
  id: string
  title: string
  description: string
  projectName: string
  projectLogo: string
  bannerUrl: string
  rewardPool: string
  status: QuestStatus
  submittedAt: string
  submittedBy: string
  liveAt?: string // Timestamp when quest went live
  endsAt?: string // Calculated from liveAt + duration
  data: any // Additional quest data including tasks, categories, etc.
}

// Start with empty quests - no defaults
const DEFAULT_QUESTS: Quest[] = []

export async function getAllQuests(): Promise<Quest[]> {
  const quests = await readJsonFile<Quest[]>(QUESTS_FILE, DEFAULT_QUESTS)
  return quests
}

export async function getQuestById(id: string): Promise<Quest | undefined> {
  const quests = await getAllQuests()
  return quests.find((q) => q.id === id)
}

export async function getLiveQuests(): Promise<Quest[]> {
  const quests = await getAllQuests()
  return quests.filter((q) => q.status === "live")
}

export async function addQuest(quest: Quest): Promise<void> {
  const quests = await getAllQuests()
  quests.push(quest)
  await writeJsonFile(QUESTS_FILE, quests)
}

export async function updateQuestStatus(id: string, status: QuestStatus): Promise<boolean> {
  const quests = await getAllQuests()
  const quest = quests.find((q) => q.id === id)
  if (quest) {
    quest.status = status
    
    // When status changes to "live", set liveAt timestamp and calculate endsAt
    if (status === "live" && !quest.liveAt) {
      quest.liveAt = new Date().toISOString()
      
      // Calculate endsAt based on quest duration (in days)
      const durationDays = quest.data?.questDuration || 14
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + durationDays)
      quest.endsAt = endsAt.toISOString()
    }
    
    await writeJsonFile(QUESTS_FILE, quests)
    return true
  }
  return false
}

export async function deleteQuest(id: string): Promise<boolean> {
  const quests = await getAllQuests()
  const index = quests.findIndex((q) => q.id === id)
  if (index !== -1) {
    quests.splice(index, 1)
    await writeJsonFile(QUESTS_FILE, quests)
    return true
  }
  return false
}
