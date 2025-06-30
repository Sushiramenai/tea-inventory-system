# Authentication Fix Guide

## The Problem
You're logged in as admin but getting "authentication required" errors when trying to access products or other features.

## Root Causes
1. **Session cookies not persisting** - The browser isn't sending cookies with API requests
2. **CORS misconfiguration** - Cross-origin requests blocking cookies
3. **Secure cookie issues** - HTTPS requirements not met
4. **Session state not shared** - Frontend and backend session mismatch

## Comprehensive Fix Applied

### 1. Session Configuration (backend/src/server.ts)
```javascript
// Fixed configuration that works in all environments
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  name: 'tea-inventory-session',
  cookie: {
    secure: isProduction && isReplit, // Only secure on Replit HTTPS
    httpOnly: true,
    maxAge: config.session.maxAge,
    sameSite: isReplit ? 'none' : 'lax', // Cross-origin for Replit
    path: '/', // Available for all paths
    domain: undefined, // Let browser determine
  },
  rolling: true, // Reset expiration on activity
  proxy: isReplit, // Trust Replit proxy
}));
```

### 2. CORS Configuration
- Allows credentials from all Replit domains
- Properly handles preflight requests
- Allows localhost for development

### 3. API Client (frontend/src/services/api.ts)
- Always sends credentials: `withCredentials: true`
- Uses relative URLs in production: `/api`
- Handles 401 errors by redirecting to login

### 4. Debug Endpoints Added
- `/api/auth/check-session` - Check session without authentication
- Enhanced logging in login/session endpoints
- Session debugging middleware (when DEBUG_SESSIONS=true)

## Testing Your Deployment

### 1. Run the Authentication Test
```bash
# From your local machine
cd backend
node test-auth.js --url https://your-replit-url.repl.co

# Or set as environment variable
API_URL=https://your-replit-url.repl.co node test-auth.js
```

### 2. Manual Browser Test
1. Open browser developer tools (F12)
2. Go to Network tab
3. Try to login
4. Check:
   - Login request has `Set-Cookie` header in response
   - Subsequent requests have `Cookie` header
   - No CORS errors in console

### 3. Check Session Directly
Visit: `https://your-replit-url.repl.co/api/auth/check-session`

Should show:
```json
{
  "hasSession": true,
  "sessionId": "...",
  "userId": "...", // Should be present after login
  "isAuthenticated": true,
  "cookie": "tea-inventory-session=..."
}
```

## Quick Fixes to Try

### If cookies aren't being set:
1. **Clear all cookies** for your Replit domain
2. **Use HTTPS** - Replit provides this automatically
3. **Check browser settings** - Ensure third-party cookies aren't blocked

### If session expires immediately:
1. Set `DEBUG_SESSIONS=true` in Replit environment
2. Check logs for session debugging info
3. Increase session maxAge if needed

### If CORS errors appear:
1. Ensure your Replit URL is using HTTPS
2. Check that the frontend is using relative URLs `/api`
3. Verify CORS allows your specific Replit subdomain

## Environment Variables for Replit

Set these in Replit Secrets:
```
SESSION_SECRET=your-very-secure-random-string-here
DEBUG_SESSIONS=true  # For debugging only
```

## Verification Steps

1. **Login Test**
   ```bash
   curl -X POST https://your-replit.repl.co/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}' \
     -c cookies.txt -v
   ```

2. **Check Session**
   ```bash
   curl https://your-replit.repl.co/api/auth/check-session \
     -b cookies.txt
   ```

3. **Access Products**
   ```bash
   curl https://your-replit.repl.co/api/products \
     -b cookies.txt
   ```

## What This Fix Ensures

✅ Sessions persist across requests
✅ Cookies work with Replit's HTTPS
✅ CORS allows credentialed requests
✅ Frontend properly sends cookies
✅ Backend validates sessions correctly
✅ Debug tools to diagnose issues

## Next Steps

1. Pull the latest code in Replit
2. Ensure SESSION_SECRET is set
3. Restart the Replit
4. Run the test script to verify
5. Clear browser cookies and try again

The authentication system should now work flawlessly!