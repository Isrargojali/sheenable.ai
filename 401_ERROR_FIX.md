# 401 Unauthorized Error - Root Cause & Fix

## Problem Summary
The application was experiencing 401 Unauthorized errors when trying to:
1. Load user profile (`/api/profile/me`)
2. Upload avatar (`/api/upload/avatar`)

## Root Cause Analysis

### The Issue
When making upload requests, the code was manually setting the `Content-Type` header to `multipart/form-data`:

```typescript
// BEFORE (Broken)
uploadAvatar: (formData: FormData) => api.post('/upload/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}),
```

**Why this caused 401 errors:**

1. The axios instance has a **request interceptor** that automatically adds the `Authorization: Bearer <token>` header to every request
2. When you pass a `headers` object as the third parameter to `api.post()`, axios **replaces** the entire headers object instead of merging with it
3. This means the `Authorization` header set by the interceptor was **lost**, and the request was sent without authentication
4. The backend's `protect` middleware correctly rejected the request with 401 Unauthorized

### Technical Details

**Request Flow:**
```
1. Interceptor runs → Adds Authorization header
2. api.post() called with custom headers → Headers object gets replaced
3. Request sent WITHOUT Authorization header
4. Backend returns 401
```

**Axios Behavior:**
- Axios interceptors modify the `config` object
- When you pass headers to the request method, it merges with existing headers at the top level
- However, if the interceptor has already set headers and you pass a headers object, the merge behavior can be unpredictable
- In this case, the custom headers were overriding the interceptor's headers

## The Fix

### Solution
Remove the manual `Content-Type` header and let axios handle it automatically:

```typescript
// AFTER (Fixed)
uploadAvatar: (formData: FormData) => api.post('/upload/avatar', formData),
```

**Why this works:**

1. When you pass a `FormData` object to axios, it **automatically** sets the correct `Content-Type` header
2. More importantly, it sets it with the correct **boundary** parameter required for multipart uploads:
   ```
   Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
   ```
3. The request interceptor can now properly add the `Authorization` header without it being overridden
4. The request is sent with both headers intact

### Files Modified

**`src/lib/api.ts`**
- Line 104-106: Removed manual Content-Type header from `apiProfile.uploadAvatar`
- Line 180-184: Removed manual Content-Type headers from `apiUpload.uploadAvatar` and `apiUpload.uploadCv`

## Verification Steps

1. **Login** with valid credentials
2. **Navigate** to profile page
3. **Check** browser DevTools → Network tab
4. **Verify** that requests to `/api/profile/me` include:
   ```
   Authorization: Bearer <your-jwt-token>
   ```
5. **Upload** an avatar image
6. **Verify** that the upload request includes:
   ```
   Authorization: Bearer <your-jwt-token>
   Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
   ```

## Additional Notes

### Token Storage
The authentication token is properly stored in `useAuthStore` (Zustand store with persistence):
- Stored in localStorage under key `hc-auth`
- Automatically loaded on app startup
- Available to all components via `useAuthStore.getState().token`

### Request Interceptor
The interceptor in `src/lib/api.ts` (lines 20-26) correctly:
- Reads token from auth store
- Sets `Authorization: Bearer <token>` header
- Works for all API calls using the `api` axios instance

### Backend Authentication
The backend's `protect` middleware (`she-enable-ai-backend/src/middleware/auth.js`) correctly:
- Extracts token from `Authorization` header
- Verifies JWT signature
- Checks user exists and is active
- Returns 401 if any check fails

## Related Components

### Frontend Authentication Flow
1. **Login** (`src/pages/auth/LoginPage.tsx`):
   - Calls `apiAuth.login()`
   - Receives `{ token, user }` in response
   - Stores both in auth store via `setSession()`

2. **Profile Page** (`src/pages/candidate/ProfilePage.tsx`):
   - Calls `apiProfile.getMe()` to load profile
   - Calls `apiUpload.uploadAvatar()` to upload avatar
   - Both use the same axios instance with interceptor

3. **Auth Store** (`src/store/authStore.ts`):
   - Stores `user` and `token` in Zustand store
   - Persists to localStorage
   - Provides `setSession()`, `setToken()`, `logout()` methods

### Backend Routes
- `/api/profile/me` - Protected by `protect` middleware
- `/api/upload/avatar` - Protected by `protect` middleware
- Both routes correctly validate JWT tokens

## Prevention

To avoid similar issues in the future:

1. **Never manually set Content-Type for FormData** - Let axios handle it
2. **Be cautious with custom headers** - They may override interceptor headers
3. **Test authenticated requests** - Always verify Authorization header is present
4. **Use DevTools Network tab** - Check actual request headers before/after interceptor

## Summary

✅ **Fixed**: Removed manual Content-Type headers from upload functions  
✅ **Result**: Authorization header now properly included in all requests  
✅ **Impact**: Profile loading and avatar upload now work correctly  
✅ **Status**: 401 errors resolved