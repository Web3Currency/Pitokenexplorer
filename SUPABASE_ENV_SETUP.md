# Supabase Environment Variables Setup

## What You Need to Provide

You'll need 3 pieces of information from your Supabase project:

1. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Public/anonymous key
3. **SUPABASE_SERVICE_ROLE_KEY** - Service role key (secret, keep safe!)

## How to Get These Values

### Step 1: Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project

### Step 2: Find Your Credentials
- Click **Settings** (bottom left)
- Click **API**
- You'll see:
  - **Project URL** → Copy this (this is your NEXT_PUBLIC_SUPABASE_URL)
  - **Project API keys** section:
    - `anon public` → Copy this (this is your NEXT_PUBLIC_SUPABASE_ANON_KEY)
    - `service_role secret` → Copy this (this is your SUPABASE_SERVICE_ROLE_KEY)

## Add to Your Project

### Option 1: Using Vercel (Recommended if deploying to Vercel)
1. Go to your Vercel project settings
2. Go to **Environment Variables**
3. Add these 3 variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here
   ```
4. Redeploy your app

### Option 2: Local Development (.env.local)
Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
```

Replace with your actual values from Supabase.

### Option 3: If Already Using SystemAction
When you use the SystemAction tool to set environment variables, add these 3:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## After Setting Environment Variables

1. Restart your dev server: `pnpm dev`
2. Check console for: `[v0] Supabase credentials configured successfully`
3. Your API endpoints will now use Supabase!

## Testing

Once you provide these values and restart, I can:
1. Verify the connection works
2. Test token hiding/showing
3. Test metadata updates
4. Test admin authentication
5. Verify audit logs are being created

## Security Notes

⚠️ **IMPORTANT:**
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public (OK)
- `SUPABASE_SERVICE_ROLE_KEY` is SECRET - never commit to git, never share publicly
- RLS policies on the database ensure security even with these keys

Ready! Just provide the 3 values whenever you have them, and I'll update everything.
