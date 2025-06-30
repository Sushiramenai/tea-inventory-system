# Replit Deployment Guide for Tea Inventory System

This guide ensures a successful deployment on Replit.

## Pre-Deployment Checklist

### 1. Import Repository
- Import from GitHub: https://github.com/Sushiramenai/tea-inventory-system.git
- Replit will automatically detect the configuration

### 2. Set Environment Variables in Replit Secrets
**Required:**
```
SESSION_SECRET=your-secure-random-string-here
```

**Optional (defaults provided):**
```
DATABASE_URL=file:./prisma/dev.db
NODE_ENV=production
```

### 3. Deployment Process
The system will automatically:
1. Build the frontend (one-time, cached)
2. Install backend dependencies
3. Set up the SQLite database
4. Start the production server

## How It Works

### Architecture
- **Single Port**: Frontend and backend run on the same port
- **Static Serving**: Backend serves the React build files
- **API Routes**: All API calls go to `/api/*`
- **Session Management**: Secure cookies with cross-origin support

### Key Fixes Implemented
1. **Static File Path**: Uses `process.cwd()` for reliable path resolution
2. **Session Cookies**: Properly configured for Replit's HTTPS
3. **API Detection**: Frontend detects Replit domains automatically
4. **Database Path**: Absolute paths prevent location issues

## Troubleshooting

### "Network Error" on Login
- Check browser console for CORS errors
- Ensure cookies are enabled
- Try clearing browser cache

### Build Failures
- Check for TypeScript errors in the logs
- Ensure all dependencies are installed
- Verify environment variables are set

### Database Issues
- The SQLite database is created automatically
- Located at `backend/prisma/dev.db`
- Seeded with default users on first run

### Session Issues
- Ensure SESSION_SECRET is set in Replit Secrets
- Check that cookies have `sameSite=none` and `secure=true`
- Verify CORS allows your Replit domain

## Default Credentials
- **Admin**: username: `admin`, password: `admin123`
- **Production**: username: `production`, password: `production123`
- **Fulfillment**: username: `fulfillment`, password: `fulfillment123`

⚠️ **Important**: Change these passwords immediately in production!

## Performance Tips
1. The frontend build is cached after first deployment
2. Use Replit's "Always On" feature for production
3. Monitor the SQLite database size (consider PostgreSQL for scale)

## Security Notes
1. Always set a strong SESSION_SECRET
2. Change default passwords
3. Consider adding rate limiting for production use
4. Enable HTTPS (automatic on Replit)

## Support
If deployment fails after following this guide:
1. Check the deployment logs in Replit console
2. Verify all environment variables are set
3. Ensure the latest code is pushed to GitHub
4. Try running `npm start` manually in the Replit shell