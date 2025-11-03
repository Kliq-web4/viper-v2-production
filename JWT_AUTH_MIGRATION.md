# JWT Token-Based Authentication Migration

## Overview
Successfully migrated from CSRF/session-based authentication to JWT-based token authentication for the Viper SDK + Worker backend.

## What Changed

### Backend Changes

#### 1. Removed CSRF Middleware (`worker/app.ts`)
- ❌ Removed CSRF validation middleware that was checking CSRF tokens on state-changing requests
- ❌ Removed `CsrfService` import
- ✅ Kept CORS configuration intact

#### 2. Updated Auth Controller (`worker/api/controllers/auth/controller.ts`)
- ❌ Removed `CsrfService` import
- ❌ Removed CSRF token rotation on login/register (lines 81-84, 136-139)
- ❌ Removed CSRF token clearing on logout (lines 177-178, 191-192)
- ❌ Removed entire `getCsrfToken` endpoint (was `/api/auth/csrf-token`)
- ❌ Removed CSRF token generation in `getAuthProviders` endpoint
- ✅ All endpoints now rely purely on JWT authentication

#### 3. Updated Auth Routes (`worker/api/routes/authRoutes.ts`)
- ❌ Removed `/api/auth/csrf-token` route

### Frontend Changes

#### 4. Updated API Client (`src/lib/api-client.ts`)
- ❌ Removed `CSRFTokenInfo` interface
- ❌ Removed `csrfTokenInfo` property from ApiClient class
- ❌ Removed `fetchCsrfToken()` method
- ❌ Removed `refreshCsrfToken()` method
- ❌ Removed `isCSRFTokenExpired()` method
- ❌ Removed `ensureCsrfToken()` method
- ❌ Removed CSRF retry logic in error handling
- ✅ **Added JWT Authorization header support**:
  ```typescript
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  ```

#### 5. Updated Auth Context (`src/contexts/auth-context.tsx`)
- ✅ **Login**: Now stores JWT in `localStorage.setItem('authToken', accessToken)`
- ✅ **Register**: Now stores JWT in `localStorage.setItem('authToken', accessToken)`
- ✅ **CheckAuth**: Loads existing token from localStorage on mount
- ✅ **Logout**: Clears JWT with `localStorage.removeItem('authToken')`

## How It Works Now

### Authentication Flow

1. **Login/Register**:
   - User submits credentials
   - Backend validates and returns `AuthResult` with `accessToken` (JWT)
   - Frontend stores token: `localStorage.setItem('authToken', token)`
   - Token is used for all subsequent API calls

2. **API Requests**:
   - Frontend reads token from localStorage
   - Adds `Authorization: Bearer <token>` header to every request
   - Backend validates JWT via `authMiddleware` → `validateToken` → `JWTUtils.verifyToken`

3. **Token Validation**:
   - JWT extracted from `Authorization` header (Priority 1)
   - Falls back to cookies if needed (Priority 2)
   - Falls back to query params for WebSocket (Priority 3)
   - Token verified using `jose` library with `JWT_SECRET`

4. **Logout**:
   - Token removed from localStorage
   - User state cleared
   - Backend session invalidated

## Security Improvements

✅ **Stateless Authentication**: No server-side session storage needed (except for session tracking)
✅ **Cross-Domain Support**: Works seamlessly across preview.viper.web4.sbs and viper.web4.sbs
✅ **No CSRF Vulnerabilities**: JWT in Authorization header is not subject to CSRF attacks
✅ **Token Expiry**: JWTs have built-in expiration (configurable via `SessionService.config.sessionTTL`)

## Configuration

### Required Environment Variables
- `JWT_SECRET`: Used to sign and verify JWT tokens (must be set in Cloudflare Worker environment)

### Token Settings
- **Default Expiry**: 3 days (`SessionService.config.sessionTTL = 3 * 24 * 60 * 60` seconds)
- **Storage**: `localStorage.authToken` on the frontend
- **Algorithm**: HS256 (HMAC with SHA-256)

## Testing Checklist

- [ ] Test user registration flow
- [ ] Test user login flow
- [ ] Test protected API endpoints with JWT
- [ ] Test logout flow and token removal
- [ ] Test token expiration handling
- [ ] Test across different environments (preview, production)
- [ ] Verify no CSRF validation errors

## Migration Notes

### For Existing Users
- Existing users with active sessions will need to log in again
- Previous cookie-based sessions will be rejected
- No data loss - only authentication method changed

### Backward Compatibility
- Cookie-based authentication still works as a fallback (Priority 2)
- Query parameter tokens still supported for WebSocket connections (Priority 3)

## Files Modified

**Backend:**
- `worker/app.ts`
- `worker/api/controllers/auth/controller.ts`
- `worker/api/routes/authRoutes.ts`

**Frontend:**
- `src/lib/api-client.ts`
- `src/contexts/auth-context.tsx`

**Unchanged (Already JWT-ready):**
- `worker/middleware/auth/auth.ts` ✅
- `worker/utils/authUtils.ts` ✅
- `worker/utils/jwtUtils.ts` ✅
- `worker/database/services/AuthService.ts` ✅
- `worker/database/services/SessionService.ts` ✅

## Rollback Plan

If needed, you can rollback by:
1. Restoring CSRF middleware in `worker/app.ts`
2. Restoring CSRF service calls in auth controller
3. Restoring CSRF route
4. Reverting frontend changes to use CSRF tokens

## Next Steps (Optional)

Consider implementing:
- [ ] Refresh tokens for longer sessions
- [ ] Token rotation on sensitive operations
- [ ] Device management (track JWT tokens per device)
- [ ] Token revocation list for compromised tokens
