# Tea Inventory System - Deployment Guide

This guide will help you deploy the Tea Inventory System for your team to access online.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- A domain name (for online access)
- SSL certificate (for HTTPS)

## 📋 Deployment Options

### Option 1: Deploy with Docker (Recommended)

1. **Configure Environment Variables**
   ```bash
   # Copy example environment files
   cp .env.example backend/.env
   cp .env.example frontend/.env
   
   # Edit the files with your production values
   # IMPORTANT: Change all secret values!
   ```

2. **Update Production Configuration**
   - Edit `backend/.env`:
     - Set `SESSION_SECRET` to a secure random string
     - Set `CORS_ORIGIN` to your frontend URL
     - Configure database (PostgreSQL recommended for production)
   
   - Edit `frontend/.env`:
     - Set `REACT_APP_API_URL` to your backend API URL

3. **Deploy with Docker Compose**
   ```bash
   # Run the deployment script
   ./deploy.sh
   
   # Or manually:
   docker-compose up -d
   ```

### Option 2: Deploy to Cloud Platforms

#### Deploy to Railway (Easy & Fast)
1. Fork this repository to your GitHub
2. Go to [Railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your forked repository
5. Railway will auto-detect the services
6. Add environment variables in Railway dashboard
7. Deploy!

#### Deploy to Render
1. Create two services on [Render](https://render.com):
   - Web Service for backend (from `backend/` directory)
   - Static Site for frontend (from `frontend/` directory)
2. Set build commands:
   - Backend: `npm install && npm run build`
   - Frontend: `npm install && npm run build`
3. Set start command for backend: `npm start`
4. Add environment variables

#### Deploy to Vercel + Supabase
1. Deploy frontend to [Vercel](https://vercel.com)
2. Use [Supabase](https://supabase.com) for PostgreSQL database
3. Deploy backend to Vercel Functions or Railway

### Option 3: Traditional VPS Deployment

1. **Setup Server**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Install nginx
   sudo apt-get install nginx
   ```

2. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd tea-inventory-system
   
   # Install dependencies
   npm install
   cd backend && npm install && npm run build
   cd ../frontend && npm install && npm run build
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Frontend
       location / {
           root /path/to/frontend/build;
           try_files $uri /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Start Services**
   ```bash
   # Start backend with PM2
   cd backend
   pm2 start dist/server.js --name tea-backend
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

## 🔒 Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Use HTTPS in production
- [ ] Set secure session secrets (at least 32 characters)
- [ ] Configure CORS properly
- [ ] Use PostgreSQL instead of SQLite for production
- [ ] Enable rate limiting
- [ ] Keep dependencies updated

## 🌐 Domain & SSL Setup

### Using Cloudflare (Free SSL)
1. Add your domain to Cloudflare
2. Update DNS records to point to your server
3. Enable "Full SSL/TLS" in Cloudflare
4. Enable "Always Use HTTPS"

### Using Let's Encrypt (Free SSL)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

## 📊 Database Migration

### From SQLite to PostgreSQL
1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE tea_inventory;
   ```
3. Update `DATABASE_URL` in backend `.env`
4. Run migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

## 👥 Team Access Setup

1. **Create Admin User**
   - First user to register becomes admin
   - Or use the seed script to create default admin

2. **Share Access**
   - Share the domain URL with your team
   - Provide login credentials
   - Team members can access from any device

3. **User Roles**
   - Admin: Full system access
   - Fulfillment: Manage products and requests
   - Production: Complete production requests
   - Viewer: Read-only access

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify database connection
- Check environment variables

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` is correct
- Check CORS configuration
- Ensure backend is running

### Database errors
- Run migrations: `npx prisma migrate deploy`
- Check database permissions
- Verify `DATABASE_URL` format

## 📱 Mobile Access

The system is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones

Just share the URL with your team!

## 🔄 Updates & Maintenance

### Update the system
```bash
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
docker-compose restart
```

### Backup Database
```bash
# For SQLite
cp backend/prisma/dev.db backup-$(date +%Y%m%d).db

# For PostgreSQL
pg_dump tea_inventory > backup-$(date +%Y%m%d).sql
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check file permissions

---

## 🎉 Next Steps

1. Configure your environment variables
2. Choose a deployment method
3. Set up your domain and SSL
4. Create user accounts for your team
5. Start managing your tea inventory!

Your tea inventory system is now ready for production use!