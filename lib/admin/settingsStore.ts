import { readJsonFile, writeJsonFile } from './fileStorage'

const SETTINGS_FILE = 'settings.json'

export interface SystemSettings {
  platform: {
    name: string
    version: string
    environment: 'development' | 'staging' | 'production'
  }
  api: {
    horizonUrl: string
    stellarTomlUrl: string
    timeout: number
  }
  features: {
    maintenanceMode: boolean
    allowQuestSubmissions: boolean
    allowPublicAccess: boolean
  }
  cache: {
    tokenCacheTtl: number
    poolCacheTtl: number
    marketStatsCacheTtl: number
  }
}

const DEFAULT_SETTINGS: SystemSettings = {
  platform: {
    name: 'Web3Currency',
    version: '1.0.0',
    environment: 'production'
  },
  api: {
    horizonUrl: 'https://horizon.stellar.org',
    stellarTomlUrl: 'https://stellar.org/.well-known/stellar.toml',
    timeout: 30000
  },
  features: {
    maintenanceMode: false,
    allowQuestSubmissions: true,
    allowPublicAccess: true
  },
  cache: {
    tokenCacheTtl: 300,
    poolCacheTtl: 60,
    marketStatsCacheTtl: 120
  }
}

/**
 * Get all system settings
 */
export async function getSettings(): Promise<SystemSettings> {
  return await readJsonFile<SystemSettings>(SETTINGS_FILE, DEFAULT_SETTINGS)
}

/**
 * Update system settings (partial update)
 */
export async function updateSettings(updates: Partial<SystemSettings>): Promise<void> {
  const currentSettings = await getSettings()
  
  // Deep merge the updates
  const newSettings: SystemSettings = {
    platform: { ...currentSettings.platform, ...updates.platform },
    api: { ...currentSettings.api, ...updates.api },
    features: { ...currentSettings.features, ...updates.features },
    cache: { ...currentSettings.cache, ...updates.cache }
  }
  
  await writeJsonFile(SETTINGS_FILE, newSettings)
}

/**
 * Reset settings to default
 */
export async function resetSettings(): Promise<void> {
  await writeJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS)
}

/**
 * Get a specific setting value
 */
export async function getSetting<K extends keyof SystemSettings>(
  category: K
): Promise<SystemSettings[K]> {
  const settings = await getSettings()
  return settings[category]
}
