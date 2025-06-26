# ✅ Tea Inventory System - Deployment Checklist

Use this checklist to ensure your deployment goes smoothly!

## 📋 Pre-Deployment Checklist

### Repository Setup
- [ ] Code is committed to Git
- [ ] `.gitignore` excludes sensitive files
- [ ] No `.env` files are committed
- [ ] Database files (*.db) are excluded
- [ ] `node_modules` are excluded

### Code Readiness
- [ ] All tests pass locally
- [ ] No console errors in development
- [ ] Frontend builds without errors
- [ ] Backend compiles without TypeScript errors

### Configuration Files
- [ ] `railway.toml` exists in root
- [ ] Backend has `Dockerfile`
- [ ] Frontend has build configuration
- [ ] Database schema is up to date

## 🚀 Railway Deployment Steps

### 1. GitHub Setup
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Railway Project Creation
- [ ] Created Railway account
- [ ] Connected GitHub account
- [ ] Created new project from repo
- [ ] PostgreSQL database added

### 3. Environment Variables

#### Backend Variables:
- [ ] `DATABASE_URL` - Set to `${{Postgres.DATABASE_URL}}`
- [ ] `PORT` - Set to `3001`
- [ ] `NODE_ENV` - Set to `production`
- [ ] `SESSION_SECRET` - Generated secure random string (32+ chars)
- [ ] `CORS_ORIGIN` - Set to frontend URL

#### Frontend Variables:
- [ ] `REACT_APP_API_URL` - Set to backend URL + `/api`

### 4. Service Configuration

#### Backend Service:
- [ ] Root directory: `/backend`
- [ ] Build command: `npm run railway:build`
- [ ] Start command: `npm run railway:start`

#### Frontend Service:
- [ ] Root directory: `/frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`

### 5. Post-Deployment

- [ ] Backend service is green/running
- [ ] Frontend service is green/running
- [ ] Database migrations completed
- [ ] Can access frontend URL
- [ ] Can login with default credentials
- [ ] API health check responds

## 🔐 Security Tasks

### Immediate (Day 1):
- [ ] Change admin password
- [ ] Change fulfillment password
- [ ] Change production password
- [ ] Verify SESSION_SECRET is unique

### Within First Week:
- [ ] Review rate limiting settings
- [ ] Set up monitoring/alerts
- [ ] Configure backup strategy
- [ ] Document team access procedures

## 🧪 Post-Deployment Testing

### Functionality Tests:
- [ ] Login works for all roles
- [ ] Can create raw materials
- [ ] Can create products
- [ ] Can create bill of materials
- [ ] Production requests work
- [ ] Inventory updates correctly
- [ ] Dashboard loads

### Performance Tests:
- [ ] Page load time < 3 seconds
- [ ] API responses < 500ms
- [ ] No memory leaks after extended use

## 📊 Monitoring Setup

- [ ] Set up Railway metrics monitoring
- [ ] Configure error alerts
- [ ] Set up uptime monitoring
- [ ] Database backup configured

## 📝 Documentation

- [ ] Team has deployment guide
- [ ] Login credentials documented securely
- [ ] Support procedures defined
- [ ] Update procedures documented

## 🎉 Launch Tasks

- [ ] Announce to team
- [ ] Provide training if needed
- [ ] Gather initial feedback
- [ ] Plan first update cycle

## 🚨 Rollback Plan

If issues occur:
1. Check Railway logs for errors
2. Verify environment variables
3. Check database connectivity
4. Rollback to previous deployment if needed
5. Contact Railway support if blocked

## 📞 Support Contacts

- Railway Support: https://railway.app/help
- Railway Status: https://railway.app/status
- Your GitHub Repo: [your-repo-url]

---

## ✨ Congratulations!

Once all items are checked, your Tea Inventory System is successfully deployed and ready for production use!