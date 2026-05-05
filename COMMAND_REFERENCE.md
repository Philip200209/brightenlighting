# Free-Forever Stack - Command Reference

Quick copy-paste commands for setting up the Free-Forever Stack deployment.

---

## MongoDB Atlas Setup

### Create MongoDB Connection String

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up → Create cluster (M0 free)
3. Database Access → Add User
   - Username: `brightenlighting`
   - Auto-generate password
4. Network Access → Allow 0.0.0.0/0 (for development)
5. Databases → Connect → Copy connection string

**Result:** Your `MONGODB_URI`

```
mongodb+srv://brightenlighting:PASSWORD@cluster.mongodb.net/brightenlighting?retryWrites=true&w=majority
```

---

## Local Development Setup

### 1. Generate Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Output:** Copy this value for `SESSION_SECRET`

### 2. Create Backend Environment File

```bash
cd backend
cp .env.example .env
```

### 3. Edit .env with Your Values

```bash
# Use your editor to set:
# - MONGODB_URI (from Atlas)
# - FRONTEND_URL (your GitHub Pages domain)
# - SESSION_SECRET (from above command)
# - ADMIN_USER (default: admin)
# - ADMIN_PASS (default: password123)
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Backend Server

```bash
npm start
```

**Output:**
```
✅ Connected to MongoDB
✅ Initialized default products
✅ Initialized admin settings

🎉 Brighten Lighting server running on port 3000
📍 Frontend: http://localhost:3000
🗄️  Database: MongoDB Atlas
```

### 6. Start Frontend (New Terminal)

```bash
python -m http.server 5500
```

**Access:** http://localhost:5500

### 7. Test Admin Login

```bash
# In browser:
# Go to http://localhost:5500/login.html
# Username: admin
# Password: password123 (or your ADMIN_PASS)
```

---

## Deploy to Render.com

### 1. Push to GitHub

```bash
git add .
git commit -m "Update to Free-Forever Stack with MongoDB"
git push origin main
```

### 2. Create Render Service

Via CLI (if using Render CLI):
```bash
# Not typically used - use web dashboard instead
```

Via Web Dashboard:
1. Go to https://render.com/dashboard
2. Click "New Web Service"
3. Connect GitHub repository
4. Select `brightenlighting`
5. Fill in:
   - **Name:** `brighten-lighting-api`
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Instance Type:** Free

### 3. Add Environment Variables

```bash
# Via Render dashboard, add these:

PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://brightenlighting:PASSWORD@cluster.mongodb.net/brightenlighting?retryWrites=true&w=majority
FRONTEND_URL=https://yourusername.github.io/brightenlighting
SESSION_SECRET=your_generated_secret_here
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6e
MPESA_CALLBACK_URL=https://brighten-lighting-api.onrender.com/mpesa/callback
```

**Note:** Replace `brighten-lighting-api` with your actual service name

### 4. Deploy

Click "Create Web Service" → Auto-deploys from `main` branch

Check status: https://dashboard.render.com → Service should show "Live"

**Your backend URL:** `https://brighten-lighting-api.onrender.com`

---

## Deploy Frontend to GitHub Pages

### 1. Enable GitHub Pages

```bash
# Via GitHub web interface:
# 1. Go to repository Settings
# 2. Pages (left sidebar)
# 3. Select: main branch, /root folder
# 4. Save
```

### 2. Update Frontend API Endpoint

**Find and replace in all files:**

```javascript
// In script.js, add at top:
const API_BASE = 'https://brighten-lighting-api.onrender.com';

// Replace all fetch calls:
// OLD: fetch('/api/products')
// NEW: fetch(API_BASE + '/api/products')

// OLD: fetch('/stkpush', {...})
// NEW: fetch(API_BASE + '/stkpush', {...})
```

### 3. Commit and Push

```bash
git add .
git commit -m "Update API endpoints for Render backend"
git push origin main
```

**Access frontend:** `https://yourusername.github.io/brightenlighting`

---

## Test Full Stack

### 1. Test Backend Connectivity

```bash
# In browser console:
fetch('https://brighten-lighting-api.onrender.com/api/products')
    .then(r => r.json())
    .then(d => console.log(d))
```

Expected: Array of 5 default products

### 2. Test Admin Login

```bash
# Browser: https://yourusername.github.io/brightenlighting/login.html
# Username: admin
# Password: (your ADMIN_PASS value)
```

Should redirect to admin dashboard

### 3. Add Test Product

```javascript
// In admin dashboard:
// 1. Click "+ Add Product"
// 2. Fill form:
//    - Name: Test Product
//    - Price: 100
//    - Category: decorative
// 3. Click Add
```

### 4. Verify Public Site

```bash
# Visit: https://yourusername.github.io/brightenlighting
# Should see your product in the catalog
```

### 5. Test M-Pesa

```bash
# On product page:
# 1. Click "Buy Now" (or cart)
// 2. Enter phone: 0712345678
# 3. Enter amount: 100
# 4. Click Pay
# Should show M-Pesa STK prompt
```

---

## Useful Links

| Service | URL |
|---------|-----|
| MongoDB Atlas Dashboard | https://cloud.mongodb.com/ |
| Render.com Dashboard | https://dashboard.render.com |
| Your GitHub Pages | https://yourusername.github.io/brightenlighting |
| Your Backend API | https://brighten-lighting-api.onrender.com |

---

## Monitoring Commands

### Check Backend Logs

```bash
# Via Render dashboard:
# Click service → Logs (auto-streams)

# Or curl to check status:
curl https://brighten-lighting-api.onrender.com/api/products
```

### Check Database

```bash
# Via MongoDB Atlas web interface:
# Clusters → Collections → Browse products
```

### View Admin Settings

```bash
# Via MongoDB Atlas:
# Collections → adminsettings → View documents
```

### View Orders

```bash
# Via MongoDB Atlas:
# Collections → orders → View documents
```

---

## Troubleshooting Commands

### Test MongoDB Connection

```bash
# On local machine with backend running:
curl http://localhost:3000/api/products
# Should return: [array of products]
```

### Check Environment Variables (Render)

```bash
# In Render dashboard:
# Service page → Environment section
# View all configured variables
```

### View Backend Errors

```bash
# In Render dashboard:
# Click service → scroll to "Logs" section
# Look for error messages
```

### Manually Restart Backend

```bash
# In Render dashboard:
# Service page → Manual deploy → "Deploy latest commit"
```

---

## Production Upgrades

### Upgrade Render to Always-On

```bash
# Render dashboard → Service settings
# Instance Type → Change to "Starter" ($7/month)
# Benefits: No sleep, faster response times
```

### Upgrade MongoDB Storage

```bash
# MongoDB Atlas → Clusters → Change tier
# M0 (512MB free) → M2 (2GB, $57/month)
# Or M5 (10GB, $117/month)
```

### Add Custom Domain

```bash
# GitHub Pages:
# Settings → Pages → Custom domain → enter yourdomain.com

# Render:
# Service page → Settings → Custom domains → add yourdomain.com
```

---

## Database Backups

### Enable MongoDB Automatic Backups

```bash
# MongoDB Atlas:
# Clusters → Backup (left sidebar)
# Settings → Enable automated backups
# Free tier includes 3 daily snapshots
```

### Manual Backup Export

```bash
# MongoDB Atlas:
# Clusters → Tools → "Download MongoDB Database Tools"
# Use mongodump to export:
mongodump --uri "mongodb+srv://brightenlighting:PASSWORD@..." --out ./backup
```

### Restore from Backup

```bash
mongorestore --uri "mongodb+srv://brightenlighting:PASSWORD@..." ./backup
```

---

## Git Operations

### Update After MIGRATION

```bash
git add -A
git commit -m "Free-Forever Stack: MongoDB, GitHub Pages, Render"
git push origin main
```

### Revert to Previous Version (if needed)

```bash
git log --oneline
git reset --hard COMMIT_HASH
git push origin main --force
```

---

## Database Commands (Advanced)

### Connect to MongoDB Locally

```bash
# Using MongoDB Compass GUI:
# Download from https://www.mongodb.com/products/compass
# Connection string: your MONGODB_URI
```

### Query Products via mongosh

```bash
# After connecting:
db.products.find()
db.products.updateOne({id: "prod-xxx"}, {$set: {stock: 0}})
db.products.deleteOne({id: "prod-xxx"})
```

### Reset Admin Password

```bash
# Via MongoDB Compass or mongosh:
db.adminsettings.deleteMany({})

# Backend will reinitialize with defaults on next restart
# Then set PASSWORD env var and restart
```

---

## Performance Tuning

### Enable Caching Headers (Render)

```javascript
// In backend index.js, add:
app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300');
    next();
});
```

### Optimize MongoDB Queries

```javascript
// Already done - backend uses .lean() for read-only queries
// Indexes created automatically for product id and category
```

### Compress Responses

```javascript
// Install compression:
npm install compression

// Use in index.js:
const compression = require('compression');
app.use(compression());
```

---

## Summary

```bash
# Step 1: Local setup
cd backend && npm install && npm start

# Step 2: Test locally
# Browser: http://localhost:5500

# Step 3: Deploy to MongoDB
# Create free cluster at mongodb.com/cloud/atlas

# Step 4: Deploy to Render
# Create web service at render.com/dashboard

# Step 5: Deploy to GitHub Pages
# Enable in GitHub Settings → Pages

# Step 6: Update frontend API
# Edit script.js with Render backend URL

# Step 7: Push to GitHub
git add . && git commit -m "Deploy Free-Forever Stack" && git push

# Done! 🎉
```

---

**Your Free-Forever Stack is live!**

- Frontend: Always free on GitHub Pages
- Backend: Free on Render.com (with sleep)
- Database: Free on MongoDB Atlas (512MB)
- Total Cost: $0/month forever
