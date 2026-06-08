import { NextRequest, NextResponse } from 'next/server'
import { getEnrollmentsByQuest } from '@/lib/admin/enrollmentStore'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Get all enrollments for this quest
    const enrollments = await getEnrollmentsByQuest(params.id)
    
    // Sort by XP (descending)
    const sortedEnrollments = enrollments
      .sort((a, b) => b.totalXP - a.totalXP)
      .map((enrollment, index) => ({
        rank: index + 1,
        username: enrollment.username,
        questXP: enrollment.totalXP,
        userId: enrollment.userId,
      }))
    
    // Find current user's rank if userId provided
    let currentUserRank = null
    if (userId) {
      const userEntry = sortedEnrollments.find((e) => e.userId === userId)
      if (userEntry) {
        currentUserRank = {
          rank: userEntry.rank,
          username: userEntry.username,
          questXP: userEntry.questXP,
        }
      }
    }
    
    return NextResponse.json({
      currentUserRank,
      entries: sortedEnrollments,
    })
  } catch (error) {
    console.error('[v0] Leaderboard fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
