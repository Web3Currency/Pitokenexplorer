# Test Admin Token Setup Guide

This guide helps you verify that admin token metadata is properly configured and visible in the Explorer UI.

## Step 1: Access Admin Dashboard

1. Navigate to `/admin/login`
2. Enter admin credentials
3. Go to **Admin Dashboard → Explorer Control Settings**

## Step 2: Configure a Test Token

Select any token (e.g., "W3C" or "PI") and set the following fields:

### Basic Metadata
- **Verified**: ✓ Check the box
- **Logo URL**: `https://example.com/logo.png` (or any valid image URL)
- **Category**: Select "Utilities"
- **Description**: "This is a test token with full admin metadata configured."

### URLs
- **Trade URL**: `https://pi-dex.com/trade/W3C`
- **App URL**: `https://app.w3c.com`

### Token Metrics
- **Circulating Supply**: `1,000,000`
- **Total Supply**: `10,000,000`
- **Market Cap (π)**: `500,000`

### Social Media
- **Website**: `https://w3currency.com`
- **Twitter**: `@web3currency`
- **Telegram**: `t.me/w3currency`

Click **Save Changes**.

## Step 3: Verify in Explorer UI

### Check Token List
1. Go to the main Explorer page
2. Find your test token in the list
3. **Verify:**
   - ✓ Logo appears (not first-letter placeholder)
   - ✓ Verified badge shows next to symbol
   - ✓ Category filter works

### Check Token Details Dialog
1. Click on the token to open details
2. **Verify:**
   - ✓ Circulating Supply shows your value (not "—")
   - ✓ Total Supply shows your value
   - ✓ Market Cap shows your value
   - ✓ Trade button is visible and clickable
   - ✓ App button is visible and clickable

### Check About Card
1. In the token dialog, click "About" button
2. **Verify:**
   - ✓ Social icons appear centered at top (Website, Twitter, Telegram)
   - ✓ Description text appears below icons
   - ✓ Clicking icons opens correct URLs

## Step 4: Debug Data Flow

### Browser Console Logs
Open browser DevTools console and look for:

```
[v0] Sample token from registry: {
  symbol: "W3C",
  verified: true,
  hasLogo: true,
  hasDescription: true,
  hasWebsite: true,
  hasTwitter: true,
  hasTelegram: true,
  hasCircSupply: true,
  hasTotalSupply: true,
  hasMarketCap: true
}
```

```
[v0] Token Dialog - displayToken data: {
  symbol: "W3C",
  hasDescription: true,
  hasWebsite: true,
  hasTwitter: true,
  hasTelegram: true,
  hasCircSupply: true,
  hasTotalSupply: true,
  hasMarketCap: true
}
```

### API Response Check
Check Network tab for:
- `/api/explorer/tokens/registry` - Should include all metadata fields
- `/api/explorer/tokens/W3C/details` - Should include enriched metadata

## Step 5: Verify Admin Summary

Visit `/api/admin/tokens/summary` to see:
```json
{
  "totalTokens": 10,
  "verifiedTokens": 1,
  "tokensWithLogo": 1,
  "tokensWithDescription": 1,
  "tokensWithMetrics": 1,
  "tokensWithSocial": 1,
  "tokensWithTradeUrl": 1,
  "tokensWithAppUrl": 1,
  "sampleTokens": [...]
}
```

## Troubleshooting

### Issue: Changes not visible
**Solution:** Clear browser cache or hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Issue: Logo still shows placeholder
**Solution:** Verify Logo URL is valid and publicly accessible

### Issue: Metrics show "—"
**Solution:** Ensure values are saved without extra formatting (no commas, just numbers)

### Issue: Social icons don't appear
**Solution:** 
- Check URL format (should be full URLs for Website/Telegram)
- Twitter can be `@username` or full URL
- Click About button to see the floating card

### Issue: Data not persisting
**Solution:** Check `.admin-data/tokens.json` file exists and has write permissions

## Data Storage Location

All admin token metadata is stored in:
```
.admin-data/tokens.json
```

This file persists across server restarts and contains all:
- Verification flags
- Logo URLs
- Categories
- Descriptions
- Trade/App URLs
- Token metrics
- Social media links

## Expected Data Flow

1. **Admin saves metadata** → `.admin-data/tokens.json`
2. **API reads from file** → `/api/explorer/tokens/registry`
3. **Frontend fetches** → `useTokenRegistry()` hook (SWR cache: 10 min)
4. **UI renders** → Explorer list + Token Dialog

---

**Note:** Changes may take up to 10 minutes to appear due to SWR caching. Use hard refresh to force immediate update.
