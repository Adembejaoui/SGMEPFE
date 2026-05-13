# Password Change Redirection Fix - Documentation

## Overview
This document describes the fix implemented to ensure users with `mustChangePassword: true` are properly redirected to the change password page.

## Problem
When a user logs in with `mustChangePassword: true`, they were not being redirected to `/change-password`. Instead, they were redirected directly to `/dashboard`.

## Root Cause
The issue was in the login flow:

1. **Login Form** (`components/login-form.tsx`): After successful login, the code was using `window.location.href = "/dashboard"` which immediately redirected to the dashboard without checking if the user needs to change their password.

2. **Missing checks in role-specific dashboards**: The role-specific dashboard pages (`/dashboard/admin`, `/dashboard/employe`, `/dashboard/technicien`) didn't have the `mustChangePassword` check.

## Solution
Three files were modified to fix this issue:

### 1. Login Form (`components/login-form.tsx`)
- Added `useSession` hook from `next-auth/react`
- After successful login, updated the session using `updateSession()` to get fresh data including `mustChangePassword`
- Added a `useEffect` that checks the session after login and redirects accordingly:
  - If `mustChangePassword` is `true` → redirect to `/change-password`
  - If `mustChangePassword` is `false` → redirect to `/dashboard`

### 2. Dashboard Layout (`app/dashboard/layout.tsx`)
- Added a check for `session.user.mustChangePassword`
- If `true`, redirects to `/change-password`

### 3. Dashboard Page (`app/dashboard/page.tsx`)
- Already had the check in place (lines 30-32)

## How It Works

### Login Flow
1. User enters credentials and submits login form
2. `signIn("credentials", ...)` is called with `redirect: false`
3. After successful authentication, `updateSession()` is called to refresh the JWT token with the latest data from the database
4. The `useEffect` hook detects the session change and checks `mustChangePassword`
5. User is redirected to the appropriate page

### Session Update Mechanism
The JWT callback in `lib/auth.ts` includes logic to fetch the latest `mustChangePassword` value from the database on each request:

```typescript
async jwt({ token, user }) {
  if (user) {
    // Initial sign in - use data from user object
    token.mustChangePassword = user.mustChangePassword
  } else if (token.id) {
    // Subsequent calls - read from database to get current state
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id },
      select: { mustChangePassword: true },
    })
    if (dbUser) {
      token.mustChangePassword = dbUser.mustChangePassword
    }
  }
  return token
}
```

## Files Modified
| File | Change |
|------|--------|
| `components/login-form.tsx` | Added session check after login |
| `app/dashboard/layout.tsx` | Added mustChangePassword redirect |
| `app/dashboard/page.tsx` | Already had check (no change needed) |

## Alternative Solutions Considered
1. **Middleware** - Not used as per requirements
2. **Server-side redirect after signIn** - Could work but less flexible than client-side handling

## Testing
To test this fix:
1. Create a new user or update an existing user to have `mustChangePassword: true`
2. Login with that user's credentials
3. Verify redirect to `/change-password` instead of `/dashboard`
4. Complete the password change
5. Verify redirect to `/dashboard` after password change
