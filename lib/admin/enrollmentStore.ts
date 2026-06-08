import { readJsonFile, writeJsonFile } from './fileStorage'

const ENROLLMENTS_FILE = 'enrollments.json'

export interface QuestEnrollment {
  id: string
  questId: string
  userId: string
  username: string
  enrolledAt: string
  totalXP: number
}

const DEFAULT_ENROLLMENTS: QuestEnrollment[] = []

export async function getAllEnrollments(): Promise<QuestEnrollment[]> {
  return await readJsonFile<QuestEnrollment[]>(ENROLLMENTS_FILE, DEFAULT_ENROLLMENTS)
}

export async function getEnrollmentsByQuest(questId: string): Promise<QuestEnrollment[]> {
  const enrollments = await getAllEnrollments()
  return enrollments.filter((e) => e.questId === questId)
}

export async function getUserEnrollment(questId: string, userId: string): Promise<QuestEnrollment | undefined> {
  const enrollments = await getAllEnrollments()
  return enrollments.find((e) => e.questId === questId && e.userId === userId)
}

export async function enrollUser(questId: string, userId: string, username: string): Promise<QuestEnrollment> {
  const enrollments = await getAllEnrollments()
  
  // Check if already enrolled
  const existing = enrollments.find((e) => e.questId === questId && e.userId === userId)
  if (existing) {
    return existing
  }
  
  const newEnrollment: QuestEnrollment = {
    id: `enroll-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    questId,
    userId,
    username,
    enrolledAt: new Date().toISOString(),
    totalXP: 0,
  }
  
  enrollments.push(newEnrollment)
  await writeJsonFile(ENROLLMENTS_FILE, enrollments)
  return newEnrollment
}

export async function updateEnrollmentXP(questId: string, userId: string, xpToAdd: number): Promise<boolean> {
  const enrollments = await getAllEnrollments()
  const enrollment = enrollments.find((e) => e.questId === questId && e.userId === userId)
  
  if (!enrollment) {
    return false
  }
  
  enrollment.totalXP += xpToAdd
  await writeJsonFile(ENROLLMENTS_FILE, enrollments)
  return true
}

export async function getQuestParticipantCount(questId: string): Promise<number> {
  const enrollments = await getEnrollmentsByQuest(questId)
  return enrollments.length
}
