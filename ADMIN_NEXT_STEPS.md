# ADMIN CONTROL CENTER - NEXT STEPS CHECKLIST

## What You Have NOW (Already Implemented)

- [x] Admin dashboard page (`/app/admin/explorer/page.tsx`)
- [x] Token and pool store functions (`lib/admin/tokenStore.ts`, `poolStore.ts`)
- [x] API endpoints for admin (`/api/admin/tokens`, `/api/admin/pools`)
- [x] Hide/Show token functionality
- [x] Hide/Show pool functionality
- [x] Verify/Unverify token functionality
- [x] Edit token metadata functionality
- [x] Search and filter in admin dashboard
- [x] Cascade hiding (hide token = hide all its pools)
- [x] Confirmation dialogs for destructive actions

## What You Need to Do (4 Steps)

### STEP 1: Execute SQL in Supabase
**Time: 5 minutes**
**File: `SUPABASE_SETUP_ONLY.sql` (in project root)**

```
1. Open https://supabase.com and log into your project
2. Go to: SQL Editor (left sidebar)
3. Click "New Query"
4. Open SUPABASE_SETUP_ONLY.sql from your project root
5. Copy ALL the content
6. Paste into the SQL Editor
7. Click "Run" button
```

**What this does:**
- Creates `admin_tokens` table
- Creates `admin_pools` table  
- Creates `admin_audit_log` table
- Sets up RLS policies (security rules)
- Creates indexes for performance

---

### STEP 2: Set Admin Users
**Time: 2 minutes**
**Location: Supabase Auth > Users**

For each person who should be an admin:

```
1. Go to https://supabase.com → Your Project → Authentication → Users
2. Find the user
3. Click on their row
4. Scroll down to "User Metadata" section (JSON editor)
5. Paste this:
   {
     "role": "admin"
   }
6. Click "Save"
7. Repeat for each admin
```

**Result:**
- Users with `role = admin` can see/edit everything
- Users without this metadata can only see visible items
- RLS policies enforce this at database level

---

### STEP 3: Update API Endpoints
**Time: 20-30 minutes**
**Files to update:**
- `/app/api/admin/tokens/route.ts`
- `/app/api/admin/pools/route.ts`

**Currently they use:** `tokenStore.ts` → `tokens.json` (file storage)
**Need to change to:** `tokenStore.ts` → Supabase `admin_tokens` table

**What to change in `tokenStore.ts`:**

Replace these functions to query Supabase instead of JSON files:
- `getTokensWithVisibility()` - Get all tokens from `admin_tokens` table
- `hideToken(tokenId)` - Update `is_hidden = true` in database
- `showToken(tokenId)` - Update `is_hidden = false` in database
- `verifyToken(tokenId)` - Update `verified = true` in database
- `unverifyToken(tokenId)` - Update `verified = false` in database
- `updateTokenMetadata(tokenId, metadata)` - Update metadata fields
- `getTokenMetadata(tokenId)` - Get metadata from database

**Same for `poolStore.ts`:**
- `getHiddenPoolIds()` - Query `admin_pools` where `is_hidden = true`
- `hidePool(poolId)` - Update `is_hidden = true`
- `showPool(poolId)` - Update `is_hidden = false`

**How to do this:**

1. Import Supabase client:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

2. Replace function implementations. Example:
```typescript
// OLD (file-based):
export async function hideToken(tokenId: string): Promise<void> {
  const data = await readJsonFile<TokenData>(TOKENS_FILE, DEFAULT_TOKEN_DATA)
  if (!data.hiddenTokenIds.includes(tokenId)) {
    data.hiddenTokenIds.push(tokenId)
    await writeJsonFile(TOKENS_FILE, data)
  }
}

// NEW (Supabase):
export async function hideToken(tokenId: string): Promise<void> {
  const { error } = await supabase
    .from('admin_tokens')
    .update({ is_hidden: true })
    .eq('id', tokenId)
  
  if (error) throw error
}
```

3. Update all other functions similarly

---

### STEP 4: Test Everything
**Time: 10 minutes**

#### Test 1: Hide a Token
```
1. Log in as admin
2. Go to /admin/explorer
3. Click Hide button on any token
4. Confirm the dialog
5. Go back to /explorer (regular user view)
6. That token should be gone from Market tab
```

#### Test 2: Verify a Token
```
1. Log in as admin
2. Go to /admin/explorer
3. Click the checkmark icon on a token
4. Verify badge appears
5. Go to /explorer
6. That token should have a checkmark badge
```

#### Test 3: Edit Token Metadata
```
1. Log in as admin
2. Go to /admin/explorer
3. Click Edit button on a token
4. Change something (e.g., category, description)
5. Save
6. Go to /explorer → click on that token
7. The changes should be visible in the token details
```

#### Test 4: Hide a Pool
```
1. Log in as admin
2. Go to /admin/explorer → Pools tab
3. Click Hide button on a pool
4. Go to /explorer → Liquidity Pools tab
5. That pool should be gone
```

#### Test 5: Cascade Hide
```
1. Log in as admin
2. Go to /admin/explorer
3. Hide a token (click Hide)
4. Go to Pools tab in admin
5. All pools using that token should now be hidden too
```

---

## File Reference

### Documentation (in project root):
- `ADMIN_ACTUAL_CONTROLS.md` - What's implemented
- `SUPABASE_SETUP_ONLY.sql` - SQL to execute
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Full guide
- `ADMIN_NEXT_STEPS.md` - This file (checklist)

### Code Files (already working):
- `/lib/admin/tokenStore.ts` - Token control functions (NEEDS UPDATE)
- `/lib/admin/poolStore.ts` - Pool control functions (NEEDS UPDATE)
- `/app/admin/explorer/page.tsx` - Admin dashboard UI (NO CHANGE NEEDED)
- `/app/api/admin/tokens/route.ts` - API endpoint (NO MAJOR CHANGE NEEDED)
- `/app/api/admin/pools/route.ts` - API endpoint (NO MAJOR CHANGE NEEDED)

---

## Quick Checklist

Copy this into a checklist and track your progress:

```
STEP 1: Supabase Setup
  [ ] Copy SUPABASE_SETUP_ONLY.sql
  [ ] Open Supabase SQL Editor
  [ ] Paste SQL
  [ ] Click Run
  [ ] Verify 3 tables created (admin_tokens, admin_pools, admin_audit_log)
  [ ] Verify RLS policies created

STEP 2: Admin Users
  [ ] Go to Supabase Auth > Users
  [ ] Add {"role": "admin"} to each admin user metadata
  [ ] Verify metadata saved

STEP 3: Update Code
  [ ] Update tokenStore.ts to use Supabase
  [ ] Update poolStore.ts to use Supabase
  [ ] Update /api/admin/tokens endpoint if needed
  [ ] Update /api/admin/pools endpoint if needed
  [ ] Test that code compiles without errors

STEP 4: Testing
  [ ] Test hiding a token → disappears from Explorer
  [ ] Test verifying a token → badge appears on Explorer
  [ ] Test editing metadata → changes appear on Explorer
  [ ] Test hiding a pool → disappears from Explorer
  [ ] Test cascade hide → hiding token hides its pools
  [ ] Test as regular user → only see visible items
  [ ] Test as admin → see everything + can edit
  [ ] Verify audit log records actions

DONE!
  [ ] Everything working
  [ ] Ready for production
  [ ] Document any custom changes made
```

---

## Troubleshooting

### "Tokens/pools not loading in admin dashboard"
- Check browser console for errors
- Verify API endpoints are returning data
- Verify Supabase credentials are correct
- Check RLS policies aren't blocking queries

### "Admin can't see all tokens"
- Verify user has `{"role": "admin"}` metadata in Supabase Auth
- Verify RLS policy: `is_hidden = FALSE OR user_is_admin`
- Check browser console for RLS errors

### "Regular user can still see hidden tokens"
- Verify RLS policy is enabled on table
- Verify Explorer queries include `is_hidden = false` filter
- Check that admin_tokens table is being used (not old JSON files)

### "Changes aren't appearing on Explorer"
- Verify changes are actually saved in Supabase
- Check that Explorer queries the admin_tokens table
- Verify browser cache is cleared
- Check network requests in browser DevTools

---

## Need Help?

If something isn't working:

1. Check `ADMIN_ACTUAL_CONTROLS.md` for detailed explanation
2. Check `ADMIN_IMPLEMENTATION_SUMMARY.md` for step-by-step guide
3. Look at the current implementation in `/lib/admin/`
4. Check browser console for JavaScript errors
5. Check Supabase logs for database errors

---

## That's It!

Follow these 4 steps and your admin control center will be fully connected to Supabase and working with the Explorer.

Timeline: ~45-60 minutes total
- Step 1: 5 minutes
- Step 2: 2 minutes
- Step 3: 20-30 minutes
- Step 4: 10 minutes

Good luck!
