import { readJsonFile, writeJsonFile } from './fileStorage'
import { updateEnrollmentXP } from './enrollmentStore'

const COMPLETIONS_FILE = 'taskCompletions.json'

export interface TaskCompletion {
  id: string
  questId: string
  taskId: string
  userId: string
  username: string
  proof: string // Screenshot URL, transaction hash, or other proof
  proofType: 'screenshot' | 'transaction' | 'referral' | 'text'
  xpEarned: number
  completedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

const DEFAULT_COMPLETIONS: TaskCompletion[] = []

export async function getAllCompletions(): Promise<TaskCompletion[]> {
  return await readJsonFile<TaskCompletion[]>(COMPLETIONS_FILE, DEFAULT_COMPLETIONS)
}

export async function getCompletionsByQuest(questId: string): Promise<TaskCompletion[]> {
  const completions = await getAllCompletions()
  return completions.filter((c) => c.questId === questId)
}

export async function getUserCompletions(questId: string, userId: string): Promise<TaskCompletion[]> {
  const completions = await getAllCompletions()
  return completions.filter((c) => c.questId === questId && c.userId === userId)
}

export async function hasUserCompletedTask(questId: string, taskId: string, userId: string): Promise<boolean> {
  const completions = await getAllCompletions()
  return completions.some((c) => 
    c.questId === questId && 
    c.taskId === taskId && 
    c.userId === userId &&
    c.status === 'approved'
  )
}

export async function addTaskCompletion(completion: Omit<TaskCompletion, 'id' | 'completedAt' | 'status'>): Promise<TaskCompletion> {
  const completions = await getAllCompletions()
  
  // Check if task already completed
  const existing = await hasUserCompletedTask(completion.questId, completion.taskId, completion.userId)
  if (existing) {
    throw new Error('Task already completed')
  }
  
  const newCompletion: TaskCompletion = {
    ...completion,
    id: `completion-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    completedAt: new Date().toISOString(),
    status: 'approved', // Auto-approve for now, can add manual review later
  }
  
  completions.push(newCompletion)
  await writeJsonFile(COMPLETIONS_FILE, completions)
  
  // Update user's total XP
  await updateEnrollmentXP(completion.questId, completion.userId, completion.xpEarned)
  
  return newCompletion
}

export async function getUserTotalXP(questId: string, userId: string): Promise<number> {
  const completions = await getUserCompletions(questId, userId)
  return completions
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.xpEarned, 0)
}
