import { NextResponse } from "next/server"

const PI_HORIZON_URL = "https://api.testnet.minepi.com"

async function fetchAllPools() {
  let allRecords: any[] = []
  let url = `${PI_HORIZON_URL}/liquidity_pools?limit=200&order=desc`

  // Fetch up to 3 pages to get more pairs (Horizon limit is usually 200 per page)
  for (let i = 0; i < 3; i++) {
    const response = await fetch(url)
    if (!response.ok) break
    const data = await response.json()
    const records = data._embedded.records
    if (!records || records.length === 0) break
    allRecords = [...allRecords, ...records]
    if (!data._links.next) break
    url = data._links.next.href
  }
  return allRecords
}

async function getAssetStats(assetCode: string, assetIssuer: string) {
  try {
    const assetParam = `${assetCode}:${assetIssuer}`

    // 1. Get Trustlines (Authorized Accounts)
    const assetResponse = await fetch(`${PI_HORIZON_URL}/assets?asset_code=${assetCode}&asset_issuer=${assetIssuer}`, {
      cache: "no-store",
    })
    let trustlines = 0
    if (assetResponse.ok) {
      const assetData = await assetResponse.json()
      if (assetData._embedded.records.length > 0) {
        trustlines = assetData._embedded.records[0].num_accounts
      }
    }

    // 2. Iterate through accounts (Parallelized fetching with 30s total timeout)
    let circulatingSupply = 0
    let holderCount = 0
    const MAX_PAGES = 10
    const PAGE_SIZE = 200

    // Generate initial URLs for parallel fetching
    const urls = []
    for (let i = 0; i < MAX_PAGES; i++) {
      urls.push(`${PI_HORIZON_URL}/accounts?asset=${assetParam}&limit=${PAGE_SIZE}&cursor=${i * PAGE_SIZE}`)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s total timeout

      const responses = await Promise.all(
        urls.map((url) =>
          fetch(url, {
            cache: "no-store",
            signal: controller.signal,
          })
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
        ),
      )

      clearTimeout(timeoutId)

      responses.forEach((data: any) => {
        if (!data || !data._embedded || !data._embedded.records) return

        data._embedded.records.forEach((acc: any) => {
          const balance = acc.balances.find((b: any) => b.asset_code === assetCode && b.asset_issuer === assetIssuer)
          if (balance) {
            const balVal = Number.parseFloat(balance.balance)
            if (balVal > 0) {
              circulatingSupply += balVal
              holderCount++
            }
          }
        })
      })
    } catch (err) {
      console.error("Parallel fetch error or timeout:", err)
    }

    return { trustlines, circulatingSupply, holderCount }
  } catch (e) {
    return { trustlines: 0, circulatingSupply: 0, holderCount: 0 }
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Use /api/explorer/tokens/registry for the token list" },
    {
      status: 301,
      headers: { Location: "/api/explorer/tokens/registry" },
    },
  )
}
