import { NextRequest, NextResponse } from 'next/server'
import { enrollUser, getUserEnrollment } from '@/lib/admin/enrollmentStore'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId, username } = body
    
    if (!userId || !username) {
      return NextResponse.json(
        { error: 'Missing userId or username' },
        { status: 400 }
      )
    }
    
    const enrollment = await enrollUser(params.id, userId, username)
    
    return NextResponse.json({
      success: true,
      enrollment,
    })
  } catch (error) {
    console.error('[v0] Enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in quest' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }
    
    const enrollment = await getUserEnrollment(params.id, userId)
    
    return NextResponse.json({
      enrolled: !!enrollment,
      enrollment,
    })
  } catch (error) {
    console.error('[v0] Check enrollment error:', error)
    return NextResponse.json(
      { error: 'Failed to check enrollment' },
      { status: 500 }
    )
  }
}
