# Deploy to Railway.app (5 Minutes)

## Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Start Now" → "GitHub"
3. Authorize Railway to access your GitHub account
4. Select the `brightenlighting` repository

## Step 2: Configure Deployment

1. Railway will auto-detect Node.js project
2. Click "Deploy"
3. Wait 2-3 minutes for build to complete

## Step 3: Set Environment Variables

1. Go to "Variables" tab in Railway
2. Add these variables:

```
PORT=3000
ADMIN_USER=admin
ADMIN_PASS=your_strong_password_here
SESSION_SECRET=your_random_secret_string_32_chars
NODE_ENV=production
```

3. Save variables
4. Railway auto-redeploys

## Step 4: Get Your Public URL

1. Go to "Deployments" tab
2. Copy the domain (looks like: `https://brightenlighting-production.up.railway.app`)
3. Your live links are:
   - **Admin Login:** `https://brightenlighting-production.up.railway.app/login.html`
   - **Admin Dashboard:** `https://brightenlighting-production.up.railway.app/admin`
   - **Public Site:** `https://brightenlighting-production.up.railway.app`

## Step 5: Change Default Password (IMPORTANT!)

1. Visit your deployment URL
2. Login with `admin` / `password123`
3. Click "Settings"
4. Change username and password
5. Never use defaults in production!

## Share These Links

Now you can share with team on phone:

**Admin Login:**
```
https://brightenlighting-production.up.railway.app/login.html
```

**Public Site (for customers):**
```
https://brightenlighting-production.up.railway.app
```

## Mobile Access

On any phone/device connected to internet:
1. Paste the link in browser
2. Login with your credentials
3. Full admin access on mobile!

## Future Updates

Every time you push to GitHub:
```bash
git add .
git commit -m "your message"
git push origin main
```

Railway auto-deploys in ~2 minutes ✨

## Free Tier Details

Railway gives you:
- **$5/month free credit** (plenty for small projects)
- Auto-deploys from GitHub
- Free SSL/HTTPS
- No credit card needed initially
- Can add credit anytime for more features

---

**Done!** You now have a live, shareable admin dashboard! 🎉
