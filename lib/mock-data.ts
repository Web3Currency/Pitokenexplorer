/**
 * MOCK DATA STRUCTURE FOR W3C APPLICATION
 *
 * This file contains all mock/placeholder data used throughout the application.
 * All data structures are designed to be easily replaced with real backend API responses.
 *
 * To integrate with mainnet:
 * 1. Replace these mock functions with actual API calls
 * 2. Update the return types if needed to match real API responses
 * 3. Add proper error handling and loading states in components
 * 4. Implement data fetching libraries (SWR, React Query, etc.)
 *
 * Data Categories:
 * - Explorer: tokens, domains, liquidity pools, market stats
 * - Learn: news articles, quizzes, progress tracking
 * - User: wallet balances, watchlists, alerts, preferences
 */

// ============================================
// EXPLORER DATA
// ============================================

export interface Token {
  id: string
  rank: number
  name: string
  symbol: string
  issuer: string
  price: string
  change: string
  highestPrice?: string | null
  lowestPrice?: string | null
  sparklineData: number[]
  volume: string
  circulatingSupply?: string | null
  trustlines?: number | null
  holders: string
  liquidity: string
  verified: boolean
  icon: string
  color: string
  category?: string
  poolId?: string | null
}

export interface Domain {
  id: string
  rank: number
  name: string
  registrar: string
  price: string
  registered: string
  expires: string
  verified: boolean
  icon: string
  color: string
  category?: string
  poolId?: string | null
}

export interface LiquidityPool {
  id: string
  rank: number
  name: string
  token1: string
  token2: string
  liquidity: string
  volume24h: string
  apr: string
  fees24h: string
  icon1: string
  icon2: string
  color: string
}

export interface MarketStats {
  liquidity: string
  liquidityChange: string
  tokenCount: number
  tokenCountChange: string
  poolCount: number
  largestPool: string
  largestPoolLiquidity: string
  activePools: number
}

// ============================================
// LEARN HUB DATA
// ============================================

export interface NewsArticle {
  id: string
  title: string
  category: string
  date: string
  icon: string
  content?: string
  author?: string
  readTime?: string
}

export interface Quiz {
  id: string
  title: string
  questions: number
  reward: string
  completed: boolean
  description?: string
  difficulty?: string
}

export interface SavedArticle {
  id: string
  title: string
  category: string
  saved: string
}

// MOCK: Replace with API call to fetch latest news
export const getNewsArticles = (): NewsArticle[] => [
  {
    id: "1",
    title: "Pi Network Mainnet Launch Updates",
    category: "News",
    date: "2 hours ago",
    icon: "Newspaper",
    readTime: "5 min",
  },
  {
    id: "2",
    title: "Understanding Pi Tokenomics",
    category: "Education",
    date: "5 hours ago",
    icon: "Flame",
    readTime: "8 min",
  },
  {
    id: "3",
    title: "DeFi on Pi: What You Need to Know",
    category: "Trending",
    date: "1 day ago",
    icon: "Flame",
    readTime: "10 min",
  },
]

// MOCK: Replace with API call to fetch available quizzes
export const getQuizzes = (): Quiz[] => [
  {
    id: "1",
    title: "Pi Network Basics",
    questions: 10,
    reward: "50π",
    completed: false,
    difficulty: "Beginner",
  },
  {
    id: "2",
    title: "Crypto Security 101",
    questions: 8,
    reward: "40π",
    completed: false,
    difficulty: "Intermediate",
  },
  {
    id: "3",
    title: "Blockchain Fundamentals",
    questions: 12,
    reward: "60π",
    completed: true,
    difficulty: "Advanced",
  },
]

// MOCK: Replace with API call to fetch user's saved articles
export const getSavedArticles = (): SavedArticle[] => [
  { id: "1", title: "DeFi Basics", category: "Education", saved: "2 days ago" },
  { id: "2", title: "Pi Network Update", category: "News", saved: "1 week ago" },
]

// MOCK: Replace with API call to fetch user's learning progress
export const getLearningProgress = () => ({
  quizzesCompleted: 8,
  totalQuizzes: 15,
  piEarned: "340π",
  articlesRead: 24,
  streak: 5,
})

// ============================================
// USER DATA
// ============================================

export interface UserWallet {
  w3cBalance: string
  piBalance: string
  w3cUsdValue?: string
  piUsdValue?: string
}

export interface UserProfile {
  name?: string
  email?: string
  isAuthenticated: boolean
  isPiConnected: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type?: "alert" | "info" | "success"
}

// MOCK: Replace with API call to fetch user's wallet balances
export const getUserWallet = (): UserWallet => ({
  w3cBalance: "1,250.00",
  piBalance: "42.75",
  w3cUsdValue: "125.00",
  piUsdValue: "213.75",
})

// MOCK: Replace with actual authentication state
export const getUserProfile = (): UserProfile => ({
  name: "Demo User",
  email: "demo@w3c.pi",
  isAuthenticated: false,
  isPiConnected: false,
})

// MOCK: Replace with API call to fetch notification count
export const getNotificationCount = (): number => 3

// MOCK: Replace with API call to fetch user notifications
export const getNotifications = (): Notification[] => [
  {
    id: "1",
    title: "Price Alert Triggered",
    message: "BTC reached $50,000",
    time: "5 min ago",
    read: false,
    type: "alert",
  },
  {
    id: "2",
    title: "New Quiz Available",
    message: "Earn 50π by completing the Pi Network quiz",
    time: "1 hour ago",
    read: false,
    type: "info",
  },
  {
    id: "3",
    title: "Market Update",
    message: "Your watchlist tokens are up 12%",
    time: "2 hours ago",
    read: true,
    type: "success",
  },
]

// MOCK: Replace with API call to update user settings
export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log("Settings updated:", settings)
}

// MOCK: Replace with API call to authenticate user with Pi Network
export const authenticateWithPi = async (): Promise<boolean> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return true
}

// MOCK: Replace with API call to sign out user
export const signOut = async (): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log("User signed out")
}

// ============================================
// SETTINGS & PREFERENCES (kept for local state)
// ============================================

export interface UserSettings {
  theme: "light" | "dark" | "system"
  language: string
  notifications: boolean
  enhancedResponses: boolean
}

export const getUserSettings = (): UserSettings => ({
  theme: "system",
  language: "en",
  notifications: true,
  enhancedResponses: false,
})
