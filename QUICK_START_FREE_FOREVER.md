# Free-Forever Stack Setup - Quick Start

Your Brighten Lighting project is now ready for the **Free-Forever Stack** deployment with:
- **Frontend**: GitHub Pages
- **Backend**: Render.com  
- **Database**: MongoDB Atlas

---

## What's Been Updated

✅ **Backend Migration to MongoDB**
- Updated `backend/index.js` to use Mongoose instead of JSON files
- Added MongoDB schemas for Products, Orders, and Admin Settings
- Automatic database initialization on first run
- Connection pooling and error handling

✅ **Environment Configuration**
- Updated `backend/.env.example` with all required variables
- Added MONGODB_URI, FRONTEND_URL, and other config
- Session secret generation guidance included

✅ **Comprehensive Deployment Guide**
- New `DEPLOYMENT.md` with step-by-step instructions
- MongoDB Atlas free tier setup (512MB)
- Render.com backend deployment
- GitHub Pages frontend configuration
- Complete troubleshooting section

✅ **Updated Documentation**
- Enhanced `README.md` with Free-Forever Stack info
- API endpoint reference
- Database schema documentation
- Local development setup instructions

---

## Next: Follow These Steps

### 1. Set Up MongoDB Atlas (5-10 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create M0 free cluster
4. Create database user: `brightenlighting`
5. Get connection string (copy it to `.env`)

**See**: DEPLOYMENT.md → Part 1 for detailed steps

### 2. Deploy Backend to Render.com (10-15 minutes)

1. Go to https://render.com
2. Sign up with GitHub
3. Create new Web Service
4. Connect your GitHub repository
5. Set environment variables (including MONGODB_URI)
6. Deploy

**See**: DEPLOYMENT.md → Part 2 for detailed steps

### 3. Enable GitHub Pages (2 minutes)

1. Go to your GitHub repository
2. Settings → Pages
3. Select `main` branch, `/root` folder
4. Save

**See**: DEPLOYMENT.md → Part 3 for detailed steps

### 4. Update Frontend API Calls (5 minutes)

**In your `script.js` and `contact.html`:**

Find all API calls like:
```javascript
// OLD
fetch('/api/products')

// NEW - Replace with your Render backend URL
const API_BASE = 'https://your-service-name.onrender.com';
fetch(API_BASE + '/api/products')
```

### 5. Test Everything (5 minutes)

1. Open your GitHub Pages site
2. Check if products load (may take 30 sec on first request)
3. Go to `/login.html`
4. Login with admin credentials
5. Add a test product
6. Verify it appears on public site

---

## Environment Variables Needed

Create `backend/.env` with these values:

```env
# Database (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://brightenlighting:PASSWORD@cluster.mongodb.net/brightenlighting?retryWrites=true&w=majority

# Frontend URL (your GitHub Pages domain)
FRONTEND_URL=https://yourusername.github.io/brightenlighting

# Admin credentials
ADMIN_USER=admin
ADMIN_PASS=your_secure_password

# Session security
SESSION_SECRET=generated_via_node_command

# Optional: M-Pesa (if integrating payments)
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
```

### Generate SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deployment URLs

After setup, you'll have:

| Service | URL | Free Tier |
|---------|-----|-----------|
| Frontend | `https://yourusername.github.io/brightenlighting` | ∞ Free |
| Backend API | `https://your-service-name.onrender.com` | 100GB/mo, sleeps after 15min |
| Database | MongoDB Atlas | 512MB, 3 free backups |
| **Total Cost** | | **$0/month** |

---

## File Changes Made

### Modified Files
- ✅ `backend/index.js` - MongoDB integration
- ✅ `backend/package.json` - Added mongoose dependency
- ✅ `backend/.env.example` - Complete configuration template
- ✅ `README.md` - Comprehensive documentation
- ✅ `DEPLOYMENT.md` - Full deployment guide

### New Files
- None (all changes are updates to existing files)

### Deleted/Replaced
- `backend/` data folder (JSON files) → MongoDB Atlas
- Old DEPLOYMENT.md → New comprehensive guide

---

## Local Testing Before Deployment

### Start MongoDB (if using local instance)
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux with systemctl
sudo systemctl start mongod
```

### Start Backend
```bash
cd backend
npm install
npm start
```

Backend will:
- Connect to MongoDB
- Initialize default products
- Create admin user
- Listen on port 3000

### Start Frontend (another terminal)
```bash
python -m http.server 5500
# Visit http://localhost:5500
```

### Test Admin
1. Go to http://localhost:5500/login.html
2. Username: `admin`
3. Password: `password123` (or your configured `ADMIN_PASS`)

---

## Troubleshooting

### MongoDB Connection Error
- ✅ Check `MONGODB_URI` format
- ✅ Verify Network Access in MongoDB Atlas
- ✅ Confirm database user password is correct

### Backend won't start
- ✅ Run `npm install` in backend folder
- ✅ Check all env variables are set
- ✅ Look at error message in terminal

### Frontend can't reach backend
- ✅ Check API_BASE URL in script.js
- ✅ Verify backend is running
- ✅ Check browser console for CORS errors
- ✅ Ensure FRONTEND_URL matches your GitHub Pages domain

### Admin login doesn't work
- ✅ Database might not be initialized
- ✅ Restart backend server
- ✅ Check ADMIN_USER and ADMIN_PASS env vars

---

## Key Differences from Old Setup

| Aspect | Old Setup | New Setup |
|--------|-----------|----------|
| Database | JSON files in `backend/data/` | MongoDB Atlas cloud |
| Frontend Host | Render.com | GitHub Pages |
| Backend Host | Render.com | Render.com (same) |
| Cost | Free (with paid upgrade) | $0/month (free forever) |
| Data Loss Risk | Files could be lost | Cloud backups |
| Scalability | Limited by server | Auto-scaling |
| Sleep Behavior | Depends on tier | Free tier sleeps after 15min |

---

## Cost Breakdown

```
GitHub Pages:     $0/month (forever free for public repos)
Render.com:       $0/month (free tier, limited features)
MongoDB Atlas:    $0/month (512MB free tier)
─────────────────────────────
TOTAL:            $0/month ✅

Upgrade Options:
- Render.com: +$7/month for always-on instance
- MongoDB: +$57/month for dedicated 2GB cluster
- Custom Domain: +cost of domain (optional)
```

---

## Next Steps Summary

1. ☐ Create MongoDB Atlas account and cluster
2. ☐ Create database user `brightenlighting`
3. ☐ Get MongoDB connection string
4. ☐ Sign up for Render.com account
5. ☐ Create Web Service on Render
6. ☐ Add all environment variables to Render
7. ☐ Enable GitHub Pages on repository
8. ☐ Update frontend API calls to Render backend
9. ☐ Test backend connectivity from frontend
10. ☐ Test admin login and product management
11. ☐ Test M-Pesa (if applicable)
12. ☐ Monitor logs on Render and MongoDB Atlas

---

## Support Resources

- **DEPLOYMENT.md** - Complete deployment guide with screenshots
- **README.md** - Full API reference and database schema
- **backend/.env.example** - Configuration template with comments
- **MongoDB Atlas Docs** - https://docs.mongodb.com/atlas/
- **Render Docs** - https://render.com/docs
- **Express.js Docs** - https://expressjs.com/

---

**You're ready to deploy! 🚀**

Start with Part 1 (MongoDB Atlas) in DEPLOYMENT.md and work through each section.
