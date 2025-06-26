# 🚀 Tea Inventory System - Replit Deployment

## ✨ One-Click Deployment to Replit

This tea inventory system is **optimized for Replit** deployment. Just import and run!

## 📋 Quick Start (2 minutes)

1. **Go to [Replit.com](https://replit.com)**
2. Click **"+ Create"** → **"Import from GitHub"**
3. Paste: `https://github.com/Sushiramenai/tea-inventory-system`
4. Click **"Import from GitHub"**
5. Once imported, click **"Run"** button
6. Wait 2-3 minutes for first-time setup
7. Your app is ready! 🎉

## 🔐 Default Login Credentials

After deployment, use these credentials:
- **Admin**: Username: `admin`, Password: `admin123`
- **Fulfillment**: Username: `fulfillment`, Password: `fulfillment123`
- **Production**: Username: `production`, Password: `production123`

⚠️ **Important**: Change these passwords after first login!

## 🛠️ What Happens Automatically

When you click "Run", Replit will:
1. Install all dependencies
2. Build the frontend
3. Set up the SQLite database
4. Run database migrations
5. Seed initial user accounts
6. Start the server

## 🎯 Features

- ✅ **No configuration needed** - Just click Run!
- ✅ **SQLite database** - No external database required
- ✅ **Single server** - Frontend and backend served together
- ✅ **Auto-restart** - Replit keeps your app running
- ✅ **Custom domain** - Use Replit's free subdomain or add your own

## 🔧 Environment Variables (Optional)

To customize, add these in Replit's Secrets tab:
- `SESSION_SECRET` - Random string for sessions (auto-generated if not set)
- `NODE_ENV` - Set to `production` (default)
- `PORT` - Server port (Replit handles this automatically)

## 📱 Accessing Your App

Once running, you'll see:
- A webview in Replit
- A public URL like: `https://tea-inventory-system.YOUR-USERNAME.repl.co`

## 🚨 Troubleshooting

### App not starting?
- Click "Stop" then "Run" again
- Check the Console for error messages

### Can't login?
- Make sure the database was created (check for `backend/prisma/dev.db`)
- Try running in Shell: `cd backend && npx prisma db seed`

### Page not loading?
- Wait for "✨ Tea Inventory System is ready!" message in console
- Refresh the webview

## 💰 Replit Pricing

- **Free tier**: Your app sleeps after inactivity
- **Hacker plan** (~$7/month): Always-on hosting
- **Recommended**: Use Hacker plan for production use

## 🎉 That's It!

Your tea inventory system is now live on Replit. No complex setup, no configuration headaches - just click and run!

## 📞 Support

If you encounter issues:
1. Check the Console tab for errors
2. Try stopping and running again
3. Check that all files were imported correctly

---

Made with ❤️ for easy deployment