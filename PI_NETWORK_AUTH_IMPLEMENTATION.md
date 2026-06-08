# Pi Network Authentication Implementation

## Overview
Pi Network user authentication is now fully integrated into Web3Currency. The app automatically attempts to authenticate users when loaded, and provides a manual sign-in button for explicit user control.

## How It Works

### 1. Automatic Authentication (On App Load)
- When the app initializes, the `UserProvider` in `lib/user-context.tsx` attempts to:
  1. Initialize the Pi SDK via `piSDK.init()` - **fully awaited**
  2. Check for a saved user in localStorage (30-day session)
  3. If no saved user, attempt automatic authentication via `piSDK.authenticate()`
- Users can cancel auto-authentication without error - this triggers the manual sign-in flow

### 2. Manual Sign-In Button
- Located in the header (top-right area before profile menu)
- Component: `components/pi-signin-button.tsx`
- Opens a confirmation dialog showing requested permissions (username only)
- User explicitly clicks "Connect with Pi" to proceed
- Shows loading states: SDK loading → Connecting → Complete

### 3. Authentication Permissions
- **Requested Permission**: `username` only
- No wallet, payments, or sensitive data is accessed
- All authentication data is stored locally in localStorage (max 30-day session)

## Implementation Details

### Files Modified/Created

1. **`lib/user-context.tsx`** (Modified)
   - Auto-authentication on app load
   - Fully awaits `piSDK.init()` before calling `authenticate()`
   - Handles both automatic and manual login flows

2. **`lib/pi-sdk.ts`** (Modified)
   - Promise-based initialization (v2 compatible)
   - `authenticate()` method works for both auto and manual flows

3. **`components/pi-signin-button.tsx`** (New)
   - Standalone sign-in button with loading states
   - Displays in header for quick access
   - Handles auth flow with toast notifications

4. **`components/header.tsx`** (Modified)
   - Integrated `PiSignInButton` component
   - Positioned before profile menu in header

5. **`components/profile-menu.tsx`** (Modified)
   - Removed inline auth dialog logic
   - Simplified to show account status and disconnect button
   - Cleaner separation of concerns

## User Flows

### Flow 1: First-Time User (No Saved Session)
1. App loads → Pi SDK initializes
2. Auto-authentication attempt → User sees Pi auth prompt in Pi Browser
3. User grants/denies permission
4. If granted: User logged in automatically
5. If denied: User sees manual "Sign In with Pi" button

### Flow 2: Returning User (Saved Session)
1. App loads → Pi SDK initializes
2. Saved user loaded from localStorage automatically
3. User is logged in without additional prompts (session < 30 days)

### Flow 3: Manual Sign-In
1. User clicks "Sign In with Pi" button in header
2. Confirmation dialog appears (username permission requested)
3. User clicks "Connect with Pi"
4. Pi authentication flow proceeds
5. On success: User session created, redirect/update UI

### Flow 4: Logout
1. User clicks profile menu → "Disconnect"
2. User session cleared from localStorage
3. User state reset
4. Sign-in button reappears

## Session Management

- **Storage**: `localStorage` key `w3c_pi_user`
- **Session Duration**: 30 days from authentication
- **Data Stored**: `uid`, `username`, `accessToken`, `authenticatedAt`
- **Auto-Cleanup**: Expired sessions automatically cleared on next app load

## Error Handling

- Missing Pi SDK: Shows "App must run in Pi Browser" error
- Network errors: Toast notification with retry option
- Cancelled auth: Silently dismissed, user can retry via manual button
- Expired session: Auto-cleared, user prompted to re-authenticate

## Testing

### Manual Testing Steps
1. **Auto-Auth**: Load app in Pi Browser → Should prompt for auth if not previously saved
2. **Saved Session**: Authenticate → Reload page → Should auto-login
3. **Manual Sign-In**: Click header button → Confirm in dialog → Complete auth
4. **Logout**: Open profile menu → Click Disconnect → Verify button reappears
5. **Expired Session**: Change authenticated date in localStorage to 31+ days ago → Reload → Should prompt re-auth

## Configuration

All Pi Network configuration is in `lib/system-config.ts`:
```typescript
export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: false, // Set to true for sandbox testing
} as const;
```

## Migration Notes

- Existing user context is preserved
- No breaking changes to existing API routes or components
- Auto-auth happens silently on app load
- Manual auth is always available via header button
