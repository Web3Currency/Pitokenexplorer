import { readJsonFile, writeJsonFile } from './fileStorage'

const POOLS_FILE = 'pools.json'

interface PoolData {
  hiddenPoolIds: string[]
}

const DEFAULT_POOL_DATA: PoolData = {
  hiddenPoolIds: []
}

export interface PoolVisibility {
  id: string
  tokenCode: string
  tokenIssuer: string
  mainPair: string
  isHidden: boolean
}

/**
 * Get list of hidden pool IDs
 */
export async function getHiddenPoolIds(): Promise<string[]> {
  const data = await readJsonFile<PoolData>(POOLS_FILE, DEFAULT_POOL_DATA)
  return data.hiddenPoolIds
}

/**
 * Hide a pool from public view
 */
export async function hidePool(poolId: string): Promise<void> {
  const data = await readJsonFile<PoolData>(POOLS_FILE, DEFAULT_POOL_DATA)
  if (!data.hiddenPoolIds.includes(poolId)) {
    data.hiddenPoolIds.push(poolId)
    await writeJsonFile(POOLS_FILE, data)
  }
}

/**
 * Show a previously hidden pool
 */
export async function showPool(poolId: string): Promise<void> {
  const data = await readJsonFile<PoolData>(POOLS_FILE, DEFAULT_POOL_DATA)
  data.hiddenPoolIds = data.hiddenPoolIds.filter(id => id !== poolId)
  await writeJsonFile(POOLS_FILE, data)
}

/**
 * Check if a pool is hidden
 */
export async function isPoolHidden(poolId: string): Promise<boolean> {
  const hiddenIds = await getHiddenPoolIds()
  return hiddenIds.includes(poolId)
}

/**
 * Hide all pools that use a specific token (cascade hiding)
 */
export async function hidePoolsByToken(tokenId: string): Promise<void> {
  // This will be called when a token is hidden
  // The actual filtering happens in the API layer
  console.log(`[v0] Token ${tokenId} hidden - pools will be filtered in API`)
}
