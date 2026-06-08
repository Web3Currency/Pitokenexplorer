# Pi Network SDK v2 Authentication Guide

## Overview

Web3Currency (W3C) implements Pi Network SDK v2 authentication for secure user login. The system requests **only the username permission** and runs exclusively inside the Pi Browser.

## Critical Implementation Details

### Pi SDK v2 Requirements
- **Version**: Pi.init({ version: "2.0" })
- **Permission**: Only `username` (no wallet address)
- **Environment**: Pi Browser only (no browser detection needed)
- **Trigger**: User click only (never on page load)
- **No Redirects**: Prevents reload/redirect loops
- **Persistence**: 30-day session storage in localStorage

### What Changed from Previous Implementation
❌ **OLD**: Requested `username` AND `wallet_address`  
✅ **NEW**: Requests `username` ONLY

❌ **OLD**: Used Promise-based Pi.authenticate()  
✅ **NEW**: Uses callback-based Pi.authenticate(scopes, onSuccess, onFailure)

❌ **OLD**: Loaded SDK dynamically  
✅ **NEW**: Assumes Pi Browser environment (SDK already available)

## Architecture

### Core Files

#### 1. `/lib/pi-sdk.ts` - Pi SDK v2 Wrapper
```typescript
class PiSDK {
  // Initialize Pi SDK once at startup
  async init(): Promise<void> {
    await window.Pi.init({ version: "2.0" })
    this.initialized = true
  }

  // Authenticate with username only
  authenticate(): Promise<PiUserData> {
    return new Promise((resolve, reject) => {
      window.Pi.authenticate(
        ["username"], // ONLY username
        (auth: AuthResult) => {
          // Save and resolve
          resolve(userData)
        },
        (error: Error) => {
          reject(error)
        }
      )
    })
  }
}
```

#### 2. `/lib/user-context.tsx` - Global User State
- Initializes Pi SDK on app mount
- Loads saved user from localStorage
- Provides `useUser()` hook
- Manages login/logout state

#### 3. `/components/pi-auth-dialog.tsx` - Permission Dialog
- Shows exactly what permission is requested
- Clear explanation: "Username for authentication"
- User can cancel or confirm

#### 4. `/components/profile-menu.tsx` - Login UI
- Entry point in global header
- Shows "Login / Connect" for guests
- Displays username for authenticated users
- Logout button available

## Authentication Flow

### 1. App Startup (Automatic)
```
UserProvider mounts
  ↓
piSDK.init() called
  ↓
Pi.init({ version: "2.0" })
  ↓
Load saved user from localStorage
  ↓
Restore session if valid (< 30 days old)
```

### 2. User Clicks Login (Manual Trigger)
```
User clicks "Login / Connect"
  ↓
Permission dialog appears
  ↓
User clicks "Connect with Pi"
  ↓
Dialog closes
```

### 3. Pi Authentication
```
login() function called
  ↓
piSDK.authenticate() executes
  ↓
Pi.authenticate(["username"], onSuccess, onFailure)
  ↓
Pi Browser handles auth flow
```

### 4. Success Callback
```typescript
onSuccess: (auth) => {
  const userData = {
    uid: auth.user.uid,
    username: auth.user.username,
    accessToken: auth.accessToken,
    authenticatedAt: Date.now()
  }
  
  // Save to localStorage
  localStorage.setItem('w3c_pi_user', JSON.stringify(userData))
  
  // Update global state
  setUser(userData)
  
  // Show success toast
  toast.success("Successfully connected!")
}
```

### 5. Post-Authentication
- Profile menu updates with username
- Green indicator dot appears on user icon
- User state persists across page refreshes
- No redirect or reload needed

### 6. Session Persistence
On subsequent visits:
1. UserProvider loads user from localStorage
2. Checks if < 30 days old
3. Restores session automatically
4. No re-authentication needed

### 7. Logout
- User clicks "Disconnect"
- localStorage.removeItem('w3c_pi_user')
- State resets to guest mode
- App continues working normally

## Usage for Developers

### Accessing User State

```tsx
import { useUser } from "@/lib/user-context"

function MyComponent() {
  const { user, isAuthenticated, piSDKReady, login, logout } = useUser()
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.username}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login} disabled={!piSDKReady}>
          Login with Pi
        </button>
      )}
    </div>
  )
}
```

### User Data Structure

```typescript
interface PiUserData {
  uid: string           // Pi Network user ID
  username: string      // Pi username
  accessToken: string   // JWT token for backend auth
  authenticatedAt: number // Timestamp (milliseconds)
}
```

### Checking Authentication Status

```tsx
const { isAuthenticated, user } = useUser()

if (isAuthenticated) {
  console.log("User:", user.username)
  console.log("User ID:", user.uid)
}
```

### Requiring Authentication

```tsx
function ProtectedFeature() {
  const { isAuthenticated, login } = useUser()
  
  if (!isAuthenticated) {
    return (
      <div>
        <p>Login required to access this feature</p>
        <button onClick={login}>Login with Pi</button>
      </div>
    )
  }
  
  return <FeatureContent />
}
```

## Data Storage

### LocalStorage Key
`w3c_pi_user` - Stores user session data

### Stored Data Example
```json
{
  "uid": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "username": "pioneer123",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "authenticatedAt": 1706543210000
}
```

### Session Expiration
- **Duration**: 30 days
- **Check**: On app load
- **Action**: Auto-logout if expired
- **User Action**: Re-authenticate if needed

## Error Handling

### Pi SDK Not Ready
```tsx
<button onClick={login} disabled={!piSDKReady}>
  {piSDKReady ? "Login" : "Initializing..."}
</button>
```

### Authentication Failed
- Error caught in try/catch
- Toast notification shown
- User stays in guest mode
- Can retry immediately

### User Declined Permission
- onFailure callback triggered
- Error toast displayed
- App continues normally
- Login button remains available

### Session Expired
- Detected on app load
- localStorage cleared automatically
- User prompted to re-login
- No data corruption

## Domain Configuration

**IMPORTANT**: Your app domain must match the Pi Developer Console settings.

### Development
- Configure sandbox domain in Pi Developer Portal
- Set `SANDBOX: true` in system-config.ts (if needed)

### Production
- Configure production domain in Pi Developer Portal
- Domain must exactly match deployed URL
- HTTPS required

### Common Issues
- ❌ Domain mismatch → Authentication fails
- ❌ Wrong protocol (http vs https) → Fails
- ❌ Subdomain difference → Fails
- ✅ Exact domain match → Works

## Testing Checklist

### Guest Mode
- [ ] App loads without errors
- [ ] All features accessible
- [ ] Login button visible
- [ ] No console errors

### Login Flow
- [ ] Click user icon → Profile menu opens
- [ ] Click "Login / Connect" → Dialog appears
- [ ] Dialog shows username permission only
- [ ] Click "Connect with Pi" → Pi auth starts
- [ ] Success toast appears
- [ ] Username displays in profile menu
- [ ] Green dot shows on user icon

### Session Persistence
- [ ] Login successfully
- [ ] Refresh page
- [ ] Still logged in
- [ ] Username still displayed
- [ ] Green dot still visible

### Logout Flow
- [ ] Click "Disconnect"
- [ ] Confirmation toast appears
- [ ] Username removed from menu
- [ ] Green dot disappears
- [ ] Login button reappears

### Error Handling
- [ ] Cancel authentication → App continues
- [ ] Retry login → Works correctly
- [ ] Expired session → Auto-logout
- [ ] Invalid data → Cleared safely

## Browser Console Testing

### Check Current User
```javascript
const user = JSON.parse(localStorage.getItem('w3c_pi_user'))
console.log(user)
```

### Check Session Age
```javascript
const user = JSON.parse(localStorage.getItem('w3c_pi_user'))
const days = (Date.now() - user.authenticatedAt) / (1000 * 60 * 60 * 24)
console.log(`Session age: ${days.toFixed(1)} days`)
```

### Manual Logout
```javascript
localStorage.removeItem('w3c_pi_user')
window.location.reload()
```

### Check Pi SDK
```javascript
console.log('Pi SDK available:', !!window.Pi)
```

## Troubleshooting

### "Pi SDK not available"
- **Cause**: Not running in Pi Browser
- **Solution**: Open app in Pi Browser app
- **Note**: External browsers won't have Pi SDK

### Authentication does nothing
- **Cause**: SDK not initialized
- **Check**: Console for initialization errors
- **Solution**: Wait for "Pi SDK ready" message

### Authentication fails immediately
- **Cause**: Domain mismatch
- **Check**: Pi Developer Console settings
- **Solution**: Match domain exactly

### Session doesn't persist
- **Cause**: localStorage disabled
- **Check**: Browser settings
- **Solution**: Enable localStorage / disable private mode

### Green dot but no username
- **Cause**: Corrupted localStorage data
- **Solution**: Logout and re-login
- **Manual**: Clear localStorage and refresh

## Security Notes

### Data Privacy
- Username stored locally only
- No server transmission (yet)
- User controls data (can logout anytime)
- 30-day auto-expiration

### Access Token
- Stored for future backend integration
- Valid for Pi Network API calls
- Expires per Pi Network policy
- Refresh not implemented (manual re-auth)

### Best Practices
1. Never request permissions you don't need
2. Always provide guest mode fallback
3. Explain permissions clearly to users
4. Allow logout at any time
5. Handle all error cases gracefully
6. Test in real Pi Browser environment

## Future Enhancements

### Planned Features
- Backend user account creation
- Quest progress sync to database
- Leaderboard with authenticated users
- Token reward distribution
- Profile customization

### Additional Permissions (Future)
When needed, will request separately:
- `payments` - For Pi token transactions
- `wallet_address` - For receiving tokens
- Always with clear user consent

## Summary

**What it does**: Authenticates users with Pi Network using only username permission  
**Where it works**: Pi Browser only  
**How it persists**: localStorage with 30-day expiration  
**Error handling**: Graceful fallback to guest mode  
**User control**: Can login/logout anytime  

---

**Status**: Production Ready  
**Last Updated**: Pi SDK v2 Implementation  
**Dependencies**: Pi Network SDK v2.0
