# Free-Forever Stack Deployment Guide

## Overview

This guide covers deploying **Brighten Lighting** using the Free-Forever Stack:
- **Frontend**: GitHub Pages (free static hosting)
- **Backend**: Render.com (free Node.js hosting)
- **Database**: MongoDB Atlas (free tier with 512MB storage)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Pages                         │
│        (Frontend - Static HTML/CSS/JS)                  │
│     https://yourusername.github.io/brightenlighting    │
└──────────────────────┬──────────────────────────────────┘
                       │ API Calls
                       ▼
        ┌──────────────────────────────┐
        │      Render.com Backend      │
        │   (Node.js/Express API)      │
        │  https://...onrender.com     │
        └──────────────┬───────────────┘
                       │ MongoDB Driver
                       ▼
        ┌──────────────────────────────┐
        │    MongoDB Atlas (Cloud)     │
        │   (Database - Free Tier)     │
        └──────────────────────────────┘
```

---

## Part 1: MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"** or **"Sign Up"**
3. Create account with email and password
4. Complete verification

### Step 2: Create Free Cluster

1. After login, click **"Create"** (or **"Build a Cluster"**)
2. Choose **"M0 Free"** cluster tier
3. Select your preferred region (closest to your users)
4. Click **"Create Deployment"**
5. Wait 2-3 minutes for cluster to initialize

### Step 3: Set Up Database User

1. In the cluster view, click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Username: `brightenlighting`
5. Password: Generate secure password (click "Autogenerate Secure Password")
6. **SAVE THIS PASSWORD** - you'll need it for `.env`
7. Built-in Role: **"Read and write to any database"**
8. Click **"Add User"**

### Step 4: Configure Network Access

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow access from anywhere"** (for development)
   - Production: Add only Render.com's IP ranges
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **"Databases"**
2. Click **"Connect"** on your cluster
3. Choose **"Node.js"** driver
4. Copy the connection string
5. Replace `<username>` with `brightenlighting`
6. Replace `<password>` with your generated password
7. Replace `myFirstDatabase` with `brightenlighting`

**Example:**
```
mongodb+srv://brightenlighting:YOUR_PASSWORD@cluster.mongodb.net/brightenlighting?retryWrites=true&w=majority
```

This is your `MONGODB_URI` for `.env`

---

## Part 2: Render.com Backend Deployment

### Step 1: Prepare Backend for Render

1. Ensure `backend/package.json` has Node.js engine specified:
```json
"engines": {
  "node": ">=16.0.0"
}
```

2. Create `backend/.env.example` (already provided) with all required variables

3. Commit all changes to GitHub:
```bash
git add .
git commit -m "Add MongoDB backend and deployment config"
git push origin main
```

### Step 2: Create Render.com Account

1. Go to https://render.com
2. Click **"Sign up"**
3. Choose **"GitHub"** (easier integration)
4. Authorize Render to access your GitHub
5. Complete signup

### Step 3: Create Web Service

1. Click **"New +"** (top navigation)
2. Select **"Web Service"**
3. Choose your **brightenlighting** repository
4. Fill in details:
   - **Name**: `brighten-lighting-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Instance Type**: **"Free"**

### Step 4: Add Environment Variables

On the Render settings page, scroll to **"Environment"** and add:

```
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://brightenlighting:PASSWORD@cluster.mongodb.net/brightenlighting?retryWrites=true&w=majority
FRONTEND_URL=https://yourusername.github.io/brightenlighting
SESSION_SECRET=generate_with_node_-e_command
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_mpesa_passkey
MPESA_CALLBACK_URL=https://your-service-name.onrender.com/mpesa/callback
```

**To generate SESSION_SECRET**, run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render starts automatic deployment
3. Wait for **"Live"** status (takes 2-5 minutes)
4. Note your backend URL: `https://your-service-name.onrender.com`

**⚠️ Important**: Free tier services sleep after 15 minutes of inactivity. First request takes ~30 seconds to wake up.

---

## Part 3: GitHub Pages Frontend Deployment

### Step 1: Create GitHub Pages Repository

**Option A: Using existing repository**

1. On GitHub, go to your **brightenlighting** repository
2. Click **Settings** → **Pages**
3. Under **"Source"**, select `main` branch, `/root` folder
4. Click **"Save"**
5. Your site is live at: `https://yourusername.github.io/brightenlighting`

**Option B: Create dedicated Pages repository**

1. Create new repo: `yourusername.github.io`
2. Copy frontend files (HTML, CSS, JS, assets) to root
3. Push to main branch
4. Your site is live at: `https://yourusername.github.io`

### Step 2: Update Frontend API Calls

Edit `script.js` and `contact.html` to use your Render backend:

**In script.js:**
```javascript
const API_BASE = 'https://your-service-name.onrender.com';

// Replace all fetch calls like:
// OLD: fetch('/api/products')
// NEW: fetch(API_BASE + '/api/products')
```

### Step 3: Configure CORS on Backend

The backend `index.js` already handles CORS for GitHub Pages. Verify:
```javascript
app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5500'],
    credentials: true
}));
```

Where `FRONTEND_URL` matches your GitHub Pages domain.

### Step 4: Deploy Frontend

1. Make API URL changes in your files
2. Commit and push to GitHub:
```bash
git add .
git commit -m "Update API endpoints for Render backend"
git push origin main
```
3. GitHub Pages auto-deploys on push
4. Your site updates within 30 seconds

---

## Part 4: Testing the Full Stack

### Test Backend Connectivity

1. Open browser console on your GitHub Pages site
2. Run:
```javascript
fetch('https://your-service-name.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log(d))
```

3. Should see product list (may take 30 seconds on first request)

### Test Admin Login

1. Go to `https://yourusername.github.io/brightenlighting/login.html`
2. Login with credentials from `.env`:
   - Username: `admin`
   - Password: `your_secure_password`
3. Should redirect to admin dashboard

### Test Product Management

1. In admin dashboard, add/edit/delete a product
2. Go to public site
3. Verify changes appear

### Test M-Pesa Payment

1. On product page, click "Buy Now"
2. Enter phone number: `0712345678`
3. Enter amount: `100`
4. Should show M-Pesa STK prompt (sandbox mode)

---

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `FRONTEND_URL` | GitHub Pages domain | `https://user.github.io/repo` |
| `ADMIN_USER` | Admin username | `admin` |
| `ADMIN_PASS` | Admin password (min 6 chars) | `SecurePass123!` |
| `SESSION_SECRET` | Session encryption key | Generated via Node |
| `MPESA_CONSUMER_KEY` | M-Pesa API key | From Safaricom |
| `MPESA_CONSUMER_SECRET` | M-Pesa API secret | From Safaricom |
| `MPESA_CALLBACK_URL` | M-Pesa callback URL | Your Render URL + `/mpesa/callback` |
| `NODE_ENV` | Environment | `production` |

---

## Monitoring & Maintenance

### Check Backend Status
- Render Dashboard: https://dashboard.render.com
- Look for **"Live"** status indicator
- View logs: Click service → scroll to "Logs"

### View Database
1. MongoDB Atlas → Clusters → "Collections"
2. Browse documents in:
   - `adminsettings` - Admin credentials
   - `products` - Product catalog
   - `orders` - M-Pesa payments

### Common Issues

**Backend returning 503?**
- Free tier service may be sleeping. First request takes time to wake.

**CORS errors in console?**
- Verify `FRONTEND_URL` matches your GitHub Pages URL exactly
- Check `origin` array in `index.js`

**Can't login to admin?**
- Verify `ADMIN_USER` and `ADMIN_PASS` in Render env vars
- Check MongoDB connection by viewing logs

**Products not showing?**
- Go to admin dashboard, add at least one product
- Verify MongoDB connection string is correct

---

## Upgrading from Free Tier

### MongoDB Atlas Upgrade
- Free: 512MB storage, shared cluster
- $57/month: Dedicated 2GB M2 cluster
- Scales up with your data needs

### Render Backend Upgrade
- Free: 100GB bandwidth/month, sleeps after 15min
- $7/month: 1GB RAM, always-on instance
- Better for high-traffic sites

### GitHub Pages
- Always free for public repositories
- $21/month for private repo hosting (or use separate hosting)

---

## Troubleshooting Checklist

- [ ] MongoDB Atlas cluster is green/running
- [ ] Database user created with correct password
- [ ] Network Access allows connections (or specific IPs)
- [ ] Render environment variables all set correctly
- [ ] Render build logs show successful deployment
- [ ] MPESA_CALLBACK_URL uses your Render service URL
- [ ] GitHub Pages source is set to `main` branch
- [ ] Frontend API calls use your Render backend URL
- [ ] CORS origin settings include your GitHub Pages domain

---

## Next Steps

1. **Custom Domain** (optional)
   - Render: Add custom domain in settings
   - GitHub Pages: Add CNAME file to repo
   
2. **SSL Certificates** (automatic)
   - Both Render and GitHub Pages include free HTTPS

3. **Monitoring**
   - Set up uptime monitoring (e.g., UptimeRobot)
   - Monitor MongoDB usage in Atlas dashboard

4. **Backups**
   - MongoDB Atlas: Enable automatic backups
   - GitHub: Push code regularly

---

**Deployment Summary**
- ✅ GitHub Pages: Free, instant deploy
- ✅ Render: Free backend, auto-scales
- ✅ MongoDB: Free 512MB, perfect for growth
- ✅ No credit card required
- ✅ Scale up when needed

Good luck with Brighten Lighting! 🎉
