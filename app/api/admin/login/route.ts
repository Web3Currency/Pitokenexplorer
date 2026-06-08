import { NextRequest, NextResponse } from 'next/server'
import { createSession, deleteSession } from '@/lib/admin/sessionStore'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = '@Web3Currency123'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create server-side session
      const token = await createSession(username)
      
      const response = NextResponse.json({ success: true, token })
      
      // Set HTTP-only cookie for server-side validation
      response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      })
      
      return response
    }
    
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_session')?.value
    
    if (token) {
      await deleteSession(token)
    }
    
    const response = NextResponse.json({ success: true })
    response.cookies.delete('admin_session')
    
    return response
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 })
  }
}
