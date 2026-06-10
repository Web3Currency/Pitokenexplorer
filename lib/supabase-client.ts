import { createClient } from '@supabase/supabase-js'

// These will come from your environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[v0] Supabase credentials not configured. Admin features disabled.')
}

// Client for public queries (use this for GET requests)
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Server client with service role (use this for PATCH/POST with admin checks)
// This can bypass RLS for specific operations, but we keep RLS enforced
export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
})

// Helper to verify if a user is admin based on auth session
export async function isUserAdmin(request: Request): Promise<boolean> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return false

    const token = authHeader.replace('Bearer ', '')
    
    // Verify token and get user
    const { data: { user }, error } = await supabaseClient.auth.getUser(token)
    
    if (error || !user) return false
    
    // Check if user has admin role in metadata
    const userRole = user.user_metadata?.role
    return userRole === 'admin'
  } catch (error) {
    console.error('[v0] Error checking admin status:', error)
    return false
  }
}

// Helper to get current user from request
export async function getCurrentUser(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseClient.auth.getUser(token)
    
    if (error || !user) return null
    return user
  } catch (error) {
    console.error('[v0] Error getting current user:', error)
    return null
  }
}
