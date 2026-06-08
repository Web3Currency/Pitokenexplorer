import { promises as fs } from 'fs'
import path from 'path'

const ADMIN_DATA_DIR = path.join(process.cwd(), '.admin-data')

// Ensure the admin data directory exists
async function ensureDataDir() {
  try {
    await fs.access(ADMIN_DATA_DIR)
  } catch {
    await fs.mkdir(ADMIN_DATA_DIR, { recursive: true })
  }
}

// Read JSON file
export async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir()
  const filePath = path.join(ADMIN_DATA_DIR, filename)
  
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    // File doesn't exist or invalid JSON, return default
    return defaultValue
  }
}

// Write JSON file
export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(ADMIN_DATA_DIR, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
