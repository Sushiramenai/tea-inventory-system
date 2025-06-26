# 🚀 Quick Deploy to Railway - 5 Minutes

Follow these steps to get your Tea Inventory System online in just 5 minutes!

## Step 1: Push to GitHub (2 minutes)

```bash
# If you haven't already, create a GitHub repo
git init
git add .
git commit -m "Tea Inventory System ready for deployment"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/tea-inventory.git
git push -u origin main
```

## Step 2: Deploy to Railway (3 minutes)

1. **Go to [Railway.app](https://railway.app)** and sign in with GitHub

2. **Click "New Project"** → **"Deploy from GitHub repo"**

3. **Select your `tea-inventory` repository**

4. Railway will create services automatically. You'll see:
   - A Backend service
   - A Frontend service (might need to add manually)

5. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "Add PostgreSQL"

## Step 3: Configure Environment Variables

### Backend Service:
Click on the backend service → Variables → Add these:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=3001
NODE_ENV=production
SESSION_SECRET=change-this-to-a-random-string-at-least-32-chars
CORS_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}
```

### Frontend Service:
If not created automatically, click "New" → "Empty Service", then:
- Set root directory to `/frontend`
- Add variable:
```
REACT_APP_API_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/api
```

## Step 4: Deploy!

Railway will automatically deploy your app. Wait for the green checkmarks.

## Step 5: Access Your App

1. Click on each service to see its URL
2. Visit the frontend URL to access your system
3. Login with:
   - Username: `admin`
   - Password: `admin123`

⚠️ **IMPORTANT**: Change the password immediately!

## 🎉 That's it! Your app is live!

## Common Issues & Fixes:

**Database not connecting?**
- Make sure DATABASE_URL uses the Railway PostgreSQL variable

**Frontend can't reach backend?**
- Check CORS_ORIGIN in backend matches frontend URL
- Verify REACT_APP_API_URL in frontend

**Build failing?**
- Check logs in Railway dashboard
- Ensure all dependencies are in package.json

## Next Steps:
1. Change default passwords
2. Invite your team members
3. Start managing inventory!

Need help? Check the [full deployment guide](./DEPLOYMENT_GUIDE.md) or Railway's docs.