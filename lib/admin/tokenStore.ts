import { readJsonFile, writeJsonFile } from './fileStorage'
import { getTokenRegistry } from '@/lib/horizon-fetcher'
import { hidePoolsByToken } from './poolStore'

const TOKENS_FILE = 'tokens.json'

export interface TokenMetadata {
  verified: boolean
  logoUrl?: string
  category?: string
  description?: string
  tradeUrl?: string
  appUrl?: string
  circulatingSupply?: string
  totalSupply?: string
  marketCap?: string
  website?: string
  twitter?: string
  telegram?: string
}

interface TokenData {
  hiddenTokenIds: string[]
  tokenMetadata: Record<string, TokenMetadata> // tokenId -> metadata
}

const DEFAULT_TOKEN_DATA: TokenData = {
  hiddenTokenIds: [],
  tokenMetadata: {}
}

export interface TokenVisibility {
  id: string
  symbol: string
  issuer: string
  isHidden: boolean
  verified: boolean
  logoUrl?: string
  category?: string
  description?: string
  tradeUrl?: string
  appUrl?: string
  circulatingSupply?: string
  totalSupply?: string
  marketCap?: string
  website?: string
  twitter?: string
  telegram?: string
}

/**
 * Get list of hidden token IDs
 */
export async function getHiddenTokenIds(): Promise<string[]> {
  const data = await readJsonFile<TokenData>(TOKENS_FILE, DEFAULT_TOKEN_DATA)
  return data.hiddenTokenIds
}

/**
 * Hide a token from public view and cascade to pools
 */
export async function hideToken(tokenId: string): Promise<void> {
  const data = await readJsonFile<TokenData>(TOKENS_FILE, DEFAULT_TOKEN_DATA)
  if (!data.hiddenTokenIds.includes(tokenId)) {
    data.hiddenTokenIds.push(tokenId)
    await writeJsonFile(TOKENS_FILE, data)
    
    // Cascade hide to all pools using this token
    await hidePoolsByToken(tokenId)
  }
}

/**
 * Show a previously hidden token
 */
export async function showToken(tokenId: string): Promise<void> {
  const data = await readJsonFile<TokenData>(TOKENS_FILE, DEFAULT_TOKEN_DATA)
  data.hiddenTokenIds = data.hiddenTokenIds.filter(id => id !== tokenId)
  await writeJsonFile(TOKENS_FILE, data)
}

/**
 * Check if a token is hidden
 */
export async function isTokenHidden(tokenId: string): Promise<boolean> {
  const hiddenIds = await getHiddenTokenIds()
  return hiddenIds.includes(tokenId)
}

/**
 * Get token metadata
 */
export async function getTokenMetadata(tokenId: string): Promise<TokenMetadata> {
  const data = await readJsonFile<TokenData>(TOKENS_FILE, DEFAULT_TOKEN_DATA)
  return data.tokenMetadata[tokenId] || {
    verified: false,
    logoUrl: undefined,
    category: undefined,
    description: undefined,
    tradeUrl: undefined,
    appUrl: undefined,
    circulatingSupply: undefined,
    totalSupply: undefined,
    marketCap: undefined,
    website: undefined,
    twitter: undefined,
    telegram: undefined
  }
}

/**
 * Update token metadata (logo, category, description, verification)
 */
export async function updateTokenMetadata(tokenId: string, metadata: Partial<TokenMetadata>): Promise<void> {
  const data = await readJsonFile<TokenData>(TOKENS_FILE, DEFAULT_TOKEN_DATA)
  
  // Merge with existing metadata
  data.tokenMetadata[tokenId] = {
    ...data.tokenMetadata[tokenId],
    ...metadata
  }
  
  await writeJsonFile(TOKENS_FILE, data)
}

/**
 * Verify a token
 */
export async function verifyToken(tokenId: string): Promise<void> {
  await updateTokenMetadata(tokenId, { verified: true })
}

/**
 * Unverify a token
 */
export async function unverifyToken(tokenId: string): Promise<void> {
  await updateTokenMetadata(tokenId, { verified: false })
}

/**
 * Get all tokens with their visibility and metadata
 */
export async function getTokensWithVisibility(): Promise<TokenVisibility[]> {
  const tokens = await getTokenRegistry()
  const hiddenIds = await getHiddenTokenIds()
  const data = await readJsonFile<TokenData>(TOKENS_FILE, DEFAULT_TOKEN_DATA)
  
  return tokens.map((token: any) => {
    const metadata = data.tokenMetadata[token.id] || {}
    
    return {
      id: token.id,
      symbol: token.symbol,
      issuer: token.fullIssuer || token.issuer,
      isHidden: hiddenIds.includes(token.id),
      verified: metadata.verified || false,
      logoUrl: metadata.logoUrl,
      category: metadata.category || token.category,
      description: metadata.description,
      tradeUrl: metadata.tradeUrl,
      appUrl: metadata.appUrl,
      circulatingSupply: metadata.circulatingSupply,
      totalSupply: metadata.totalSupply,
      marketCap: metadata.marketCap,
      website: metadata.website,
      twitter: metadata.twitter,
      telegram: metadata.telegram
    }
  })
}
