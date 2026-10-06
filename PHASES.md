# Pi Token Explorer — reliability phases

Goal: a token page millions of Pi users can trust. Horizon stays the source. The page should not rebuild a token from live Horizon calls on every visit.

Status key: done, now, next, later.

## Already done

- Market, pools, and domain share one search row. Sort is one tap.
- Token details and pool details are mobile pages, not popups.
- Pool fee, shares, and last activity come from the pool record already returned by Horizon.
- Circulating supply, trustlines, pool balance, and issuer flags come from Horizon `/assets`, not from paging accounts.
- 24h volume is the Pi side of pool trades, not a swap count.
- Order book is best bid, best ask, spread, and the top levels, on the token page.

## Now — Phase A: diagnose one real token

Trace one token that shows `—` or `0` from Horizon to the page.

Check, in order: Horizon `/assets`, Horizon `/order_book`, `/api/explorer/tokens/[code]/details`, `/api/explorer/tokens/[code]/orderbook`, then the token page.

Record which stage turns supply, trustlines, holders, or orders into null or zero.

Done when we can name the failing stage for one real token.

## Next — Phase B: honest values

Do this before any database.

- `0` means we checked and the value is zero.
- `null` means we do not have the data.
- Loading stays loading until the snapshot arrives.
- A failed Horizon call must not be stored as zero, and must not replace a previous good value.
- Holders must not be hardcoded to `0`.
- The token page must show “Unavailable” instead of `0` when the order book request failed.

## Next — Phase C: one token snapshot

One endpoint, `/api/explorer/tokens/[code]/snapshot?issuer=`, returns price, supply, trustlines, holders, pool balance, flags, volume, and order book together, plus `updatedAt` and a status per field.

The token page reads that one response. Skeleton only on the first load. Cards resolve together.

## Next — Phase D: retry and freshness

Horizon fetches retry up to 3 times. The page shows “Updated 24 seconds ago” from `updatedAt`. Secondary blocks (chart, extra pool rows) can arrive after the main snapshot.

## Later — Phase E: Supabase index

Tables: tokens, token_market, token_pools, token_orders.

A worker reads Horizon, validates, calculates, and writes Supabase. It keeps the last good row if Horizon fails.

Refresh: price and liquidity 15–60s, orders 10–30s, volume 30–60s, supply and trustlines 1–5 min, metadata 1–6 hours.

## Later — Phase F: explorer reads the index

The snapshot endpoint reads Supabase first. Horizon is only the worker’s source. The page does not call Horizon.

## Later — Phase G: domains and claimable balances

Replace the fake Domain tab with issuer `home_domain` and claimable balances. Horizon has no domain registry.

## Not in this track

Do not raise the old 20,000-account crawl. That crawl is no longer the token-page path. The index is the real holder count.
