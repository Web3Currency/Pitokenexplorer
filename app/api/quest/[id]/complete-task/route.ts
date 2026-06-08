import { NextRequest, NextResponse } from 'next/server'
import { addTaskCompletion, hasUserCompletedTask } from '@/lib/admin/taskCompletionStore'
import { getUserEnrollment } from '@/lib/admin/enrollmentStore'
import { getQuestById } from '@/lib/admin/questStore'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { taskId, userId, username, proof, proofType, xpEarned } = body
    
    // Validate required fields
    if (!taskId || !userId || !username || !xpEarned) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if user is enrolled in quest
    const enrollment = await getUserEnrollment(params.id, userId)
    if (!enrollment) {
      return NextResponse.json(
        { error: 'User not enrolled in quest. Please join the quest first.' },
        { status: 403 }
      )
    }
    
    // Check if quest exists and is live
    const quest = await getQuestById(params.id)
    if (!quest) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      )
    }
    
    if (quest.status !== 'live') {
      return NextResponse.json(
        { error: 'Quest is not live' },
        { status: 403 }
      )
    }
    
    // Check if task already completed
    const alreadyCompleted = await hasUserCompletedTask(params.id, taskId, userId)
    if (alreadyCompleted) {
      return NextResponse.json(
        { error: 'Task already completed' },
        { status: 400 }
      )
    }
    
    // Record task completion
    const completion = await addTaskCompletion({
      questId: params.id,
      taskId,
      userId,
      username,
      proof: proof || '',
      proofType: proofType || 'text',
      xpEarned,
    })
    
    return NextResponse.json({
      success: true,
      completion,
      message: `Task completed! +${xpEarned} XP earned`,
    })
  } catch (error) {
    console.error('[v0] Task completion error:', error)
    
    if (error instanceof Error && error.message === 'Task already completed') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}
