# 🚂 Railway Deployment Guide - Tea Inventory System

This guide will walk you through deploying your Tea Inventory System to Railway, making it accessible online for your team.

## 📋 Prerequisites

1. A [Railway account](https://railway.app) (free tier available)
2. A GitHub account
3. Your tea inventory system code pushed to a GitHub repository

## 🚀 Step-by-Step Deployment

### Step 1: Push to GitHub

First, push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit - Tea Inventory System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tea-inventory-system.git
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your `tea-inventory-system` repository

### Step 3: Deploy Backend Service

Railway should automatically detect the monorepo structure. If not:

1. Click **"New"** → **"GitHub Repo"** 
2. Select your repository again
3. Click on the service settings (⚙️)
4. Set the **Root Directory** to `/backend`
5. Railway will use the `railway.json` configuration automatically

### Step 4: Add PostgreSQL Database

1. In your Railway project, click **"New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically create the database and inject `DATABASE_URL`

### Step 5: Configure Backend Environment Variables

Click on your backend service and go to the **Variables** tab. Add these:

```env
NODE_ENV=production
PORT=3001
SESSION_SECRET=<generate-a-secure-32-character-string>
CORS_ORIGIN=https://your-frontend.up.railway.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important**: 
- Replace `SESSION_SECRET` with a secure random string
- Update `CORS_ORIGIN` after deploying the frontend (see Step 7)

### Step 6: Deploy Frontend Service

1. In the same Railway project, click **"New"** → **"GitHub Repo"**
2. Select your repository again
3. Click on the service settings (⚙️)
4. Set the **Root Directory** to `/frontend`
5. Add a **Custom Build Command**: `npm install && npm run build`
6. Add a **Custom Start Command**: `npx serve -s build -l 3000`

### Step 7: Configure Frontend Environment Variables

Click on your frontend service and add these variables:

```env
REACT_APP_API_URL=https://your-backend.up.railway.app/api
REACT_APP_NAME=Tea Inventory System
REACT_APP_ENV=production
```

**Important**: Replace `your-backend` with your actual backend service URL from Railway

### Step 8: Update CORS Origin

1. Go back to your backend service
2. Update the `CORS_ORIGIN` variable to your frontend's Railway URL
3. The service will automatically redeploy

### Step 9: Generate Railway Domain

For each service:
1. Click on the service
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Railway will provide URLs like:
   - Backend: `https://tea-inventory-backend.up.railway.app`
   - Frontend: `https://tea-inventory-frontend.up.railway.app`

## 🔧 Post-Deployment Setup

### Initialize Database

The database migrations will run automatically on first deploy. To seed initial data:

1. Go to your backend service
2. Click on the **"Railway Shell"** button
3. Run: `npm run prisma:seed`

### Create First Admin User

1. Visit your frontend URL
2. Register the first user (will automatically be admin)
3. Share credentials with your team

## 🌐 Custom Domain (Optional)

To use your own domain:

1. Go to service **Settings** → **Networking**
2. Add your custom domain
3. Update DNS records as instructed by Railway
4. Update environment variables with new domain

## 🔍 Monitoring & Logs

- Click on any service to view logs
- Check **Metrics** tab for resource usage
- Set up **Deployments** notifications in project settings

## 🚨 Troubleshooting

### Backend won't start
- Check logs for errors
- Verify all environment variables are set
- Ensure PostgreSQL is connected

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` is correct
- Check `CORS_ORIGIN` matches frontend URL
- Ensure both services are running

### Database issues
- Check if `DATABASE_URL` is injected (should be automatic)
- Look for migration errors in logs
- Try redeploying the backend service

### Build failures
- Check if all dependencies are in `package.json`
- Verify build commands in Railway settings
- Check logs for specific error messages

## 🔄 Updates & Maintenance

### Deploying Updates
Simply push to your GitHub repository:
```bash
git add .
git commit -m "Update: description of changes"
git push
```
Railway will automatically redeploy.

### Database Backups
Railway PostgreSQL includes automatic daily backups on paid plans.

### Scaling
Upgrade to Railway's paid plan to:
- Add more replicas
- Increase resource limits
- Get better support

## 📊 Cost Estimation

Railway's free tier includes:
- $5 free credit per month
- 500 GB hours
- Perfect for small teams

Typical usage for tea inventory:
- Backend: ~$3-5/month
- Frontend: ~$1-2/month  
- PostgreSQL: ~$5/month
- **Total: ~$9-12/month** (covered by free tier initially)

## 🎉 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Backend service deployed
- [ ] PostgreSQL database connected
- [ ] Frontend service deployed
- [ ] Environment variables configured
- [ ] Custom domains generated
- [ ] First admin user created
- [ ] Team has access to URLs

## 🆘 Need Help?

1. Check [Railway Docs](https://docs.railway.app)
2. Join [Railway Discord](https://discord.gg/railway)
3. Review deployment logs
4. Check this guide again

---

Your Tea Inventory System is now live on Railway! Share the frontend URL with your team to start managing inventory online.