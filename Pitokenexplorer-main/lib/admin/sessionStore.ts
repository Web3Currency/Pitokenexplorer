import { readJsonFile, writeJsonFile } from './fileStorage'
import crypto from 'crypto'

const SESSIONS_FILE = 'sessions.json'

interface SessionData {
  sessions: {
    [token: string]: {
      username: string
      createdAt: string
      expiresAt: string
    }
  }
}

const DEFAULT_SESSION_DATA: SessionData = {
  sessions: {}
}

const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Create a new session for a user
 */
export async function createSession(username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DURATION)
  
  const data = await readJsonFile<SessionData>(SESSIONS_FILE, DEFAULT_SESSION_DATA)
  data.sessions[token] = {
    username,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  }
  
  await writeJsonFile(SESSIONS_FILE, data)
  return token
}

/**
 * Validate a session token
 */
export async function validateSession(token: string): Promise<boolean> {
  const data = await readJsonFile<SessionData>(SESSIONS_FILE, DEFAULT_SESSION_DATA)
  const session = data.sessions[token]
  
  if (!session) return false
  
  const expiresAt = new Date(session.expiresAt)
  if (expiresAt < new Date()) {
    // Session expired, clean it up
    delete data.sessions[token]
    await writeJsonFile(SESSIONS_FILE, data)
    return false
  }
  
  return true
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  const data = await readJsonFile<SessionData>(SESSIONS_FILE, DEFAULT_SESSION_DATA)
  delete data.sessions[token]
  await writeJsonFile(SESSIONS_FILE, data)
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const data = await readJsonFile<SessionData>(SESSIONS_FILE, DEFAULT_SESSION_DATA)
  const now = new Date()
  
  for (const [token, session] of Object.entries(data.sessions)) {
    const expiresAt = new Date(session.expiresAt)
    if (expiresAt < now) {
      delete data.sessions[token]
    }
  }
  
  await writeJsonFile(SESSIONS_FILE, data)
}
