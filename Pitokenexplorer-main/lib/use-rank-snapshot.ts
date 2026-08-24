"use client"

import { useState, useEffect, useMemo } from "react"

interface TokenRankSnapshot {
  tokenId: string
  liquidity: number
  rank: number
}

interface RankSnapshotData {
  timestamp: number
  snapshots: TokenRankSnapshot[]
}

const SNAPSHOT_KEY = "pi_explorer_rank_snapshot"
const SNAPSHOT_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Calculates rank movement by comparing current token positions
 * against a 24-hour snapshot stored in localStorage.
 *
 * Returns: "up" | "down" | "neutral" for each token
 */
export function useRankMovement(tokens: Array<{ id: string; liquidity?: string | null }>) {
  const [previousSnapshot, setPreviousSnapshot] = useState<RankSnapshotData | null>(null)

  // Load previous snapshot from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SNAPSHOT_KEY)
      if (stored) {
        const parsed: RankSnapshotData = JSON.parse(stored)
        setPreviousSnapshot(parsed)
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])

  // Calculate current ranks based on liquidity (sorted descending)
  const currentRanks = useMemo(() => {
    const ranked = tokens
      .map((token) => ({
        tokenId: token.id,
        liquidity: Number.parseFloat(token.liquidity?.replace(/[^\d.-]/g, "") || "0"),
      }))
      .filter((t) => t.liquidity > 0)
      .sort((a, b) => b.liquidity - a.liquidity)
      .map((t, index) => ({
        ...t,
        rank: index + 1,
      }))

    return ranked
  }, [tokens])

  // Save new snapshot if 24 hours have passed or no snapshot exists
  useEffect(() => {
    if (currentRanks.length === 0) return

    const now = Date.now()
    const shouldCreateSnapshot = !previousSnapshot || now - previousSnapshot.timestamp >= SNAPSHOT_INTERVAL

    if (shouldCreateSnapshot) {
      const newSnapshot: RankSnapshotData = {
        timestamp: now,
        snapshots: currentRanks,
      }
      try {
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(newSnapshot))
        // Don't update previousSnapshot state here - we want to keep comparing
        // against the old snapshot until the page is reloaded
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [currentRanks, previousSnapshot])

  // Build a map of token movements
  const rankMovements = useMemo(() => {
    const movements: Record<string, "up" | "down" | "neutral"> = {}

    if (!previousSnapshot || previousSnapshot.snapshots.length === 0) {
      // No previous snapshot - all tokens are neutral
      currentRanks.forEach((t) => {
        movements[t.tokenId] = "neutral"
      })
      return movements
    }

    // Create a map of previous ranks
    const previousRankMap: Record<string, number> = {}
    previousSnapshot.snapshots.forEach((s) => {
      previousRankMap[s.tokenId] = s.rank
    })

    // Compare current ranks to previous ranks
    currentRanks.forEach((current) => {
      const previousRank = previousRankMap[current.tokenId]

      if (previousRank === undefined) {
        // New token - treat as neutral (or could be "up" since it's now listed)
        movements[current.tokenId] = "neutral"
      } else if (current.rank < previousRank) {
        // Lower rank number = higher position = moved up
        movements[current.tokenId] = "up"
      } else if (current.rank > previousRank) {
        // Higher rank number = lower position = moved down
        movements[current.tokenId] = "down"
      } else {
        movements[current.tokenId] = "neutral"
      }
    })

    // Also include tokens that don't have liquidity anymore (for completeness)
    tokens.forEach((t) => {
      if (!movements[t.id]) {
        movements[t.id] = "neutral"
      }
    })

    return movements
  }, [currentRanks, previousSnapshot, tokens])

  return rankMovements
}
