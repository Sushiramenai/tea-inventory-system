# 🚀 GitHub Setup Instructions

## Step 1: Create Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: `tea-inventory-system`
3. Make it **Public**
4. **Don't** initialize with README, .gitignore, or license
5. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository, run these commands in your terminal:

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/tea-inventory-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

If you're prompted for authentication:
- **Username**: Your GitHub username
- **Password**: Your GitHub Personal Access Token (not your password!)
  - Create a token at: https://github.com/settings/tokens/new
  - Select scopes: `repo` (full control)

## Step 3: Import to Replit

1. Go to: https://replit.com
2. Click **"+ Create"**
3. Click **"Import from GitHub"**
4. Enter: `https://github.com/YOUR_USERNAME/tea-inventory-system`
5. Click **"Import from GitHub"**

## Step 4: Run on Replit

When Replit opens:
1. The app will show "Configure run command"
2. Enter: `bash deploy.sh`
3. Click **"Done"**
4. Click **"Run"**

The system will automatically:
- Install all dependencies
- Build the frontend
- Set up the database
- Start the server

## 🎉 Success!

Your app will be available at:
`https://tea-inventory-system.YOUR_REPLIT_USERNAME.repl.co`

## 🔐 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Production | production | production123 |
| Fulfillment | fulfillment | fulfillment123 |