# Replit Deployment Guide for Tea Inventory System

## Quick Deploy to Replit

### Option 1: Import from GitHub (Recommended)
1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Select "Import from GitHub"
4. Enter your repository URL
5. Click "Import from GitHub"

### Option 2: Manual Upload
1. Create a new Repl with Node.js template
2. Upload all files from this repository
3. The system will auto-start using the configured scripts

## What Happens Automatically

When you run the Repl, the following will happen automatically:

1. **Dependencies Installation**: All npm packages for both frontend and backend
2. **Database Setup**: SQLite database creation and migration
3. **Database Seeding**: Initial data including sample users, products, and materials
4. **Backend Build**: TypeScript compilation
5. **Frontend Build**: React production build
6. **Server Start**: Both frontend (port 3000) and backend (port 3001) servers

## Default Login Credentials

After the system starts, you can login with these accounts:

- **Admin**: `admin@tea.com` / `admin123`
- **Production**: `production@tea.com` / `prod123`
- **Fulfillment**: `fulfillment@tea.com` / `fulfill123`

## Accessing Your Application

Once running, you can access:

- **Frontend**: Your Repl URL (e.g., `https://tea-inventory.yourusername.repl.co`)
- **Backend API**: Your Repl URL with port 3001 (e.g., `https://tea-inventory.yourusername.repl.co:3001`)
- **Health Check**: `https://tea-inventory.yourusername.repl.co:3001/health`

## Environment Variables (Optional)

The system works out-of-the-box, but you can customize by adding Secrets in Replit:

- `SESSION_SECRET`: Custom session secret (default provided)
- `DATABASE_URL`: Custom database URL (defaults to SQLite)
- `CORS_ORIGIN`: Custom CORS origin (auto-detected on Replit)

## Troubleshooting

### If the application doesn't start:
1. Check the Console for errors
2. Try running `npm run install:all` in the Shell
3. Ensure all files were uploaded correctly

### If you can't login:
1. Check if the backend is running on port 3001
2. Verify the database was seeded (check console logs)
3. Try the health endpoint: `/health`

### If you see CORS errors:
1. The system auto-configures CORS for Replit
2. Check that cookies are enabled in your browser
3. Try accessing from the main Repl URL (not the preview)

## File Structure

```
tea-inventory-system/
├── backend/              # Express.js API server
│   ├── src/             # TypeScript source files
│   ├── prisma/          # Database schema and migrations
│   └── dist/            # Compiled JavaScript (auto-generated)
├── frontend/            # React application
│   ├── src/            # React components and services
│   └── build/          # Production build (auto-generated)
├── .replit             # Replit configuration
├── replit-start.sh     # Startup script
└── package.json        # Root package configuration
```

## Features Available

1. **User Management**: Create and manage users with different roles
2. **Product Inventory**: Track tea products with real-time stock levels
3. **Raw Materials**: Manage ingredients and supplies
4. **Bill of Materials**: Define recipes for products
5. **Production Requests**: Create and fulfill production orders
6. **Dashboard**: View system statistics and low stock alerts

## Performance Notes

- The system uses SQLite which is perfect for Replit
- Initial startup may take 1-2 minutes for dependency installation
- Subsequent starts are much faster
- The database persists between restarts

## Security Notes

- Change the default passwords immediately after deployment
- The session secret is automatically generated but can be customized
- All API endpoints require authentication except `/health`
- CORS is configured to accept only Replit domains and localhost

## Support

If you encounter issues:
1. Check the Replit console for error messages
2. Verify all files were uploaded correctly
3. Ensure you're using Node.js 18 or higher
4. Try restarting the Repl

The system is designed to be zero-configuration on Replit!