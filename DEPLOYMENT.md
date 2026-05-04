# Deployment Guide - Brighten Lighting

## GitHub Repository

The admin dashboard and backend are now live on GitHub:
- **Repository**: https://github.com/Philip200209/brightenlighting
- **Branch**: main
- **Latest Commit**: Enhanced admin dashboard with image gallery picker, stock management, and admin settings panel

## Deployed Features

✅ **Image Gallery Picker** - Admin can select product images from assets folder
✅ **Stock Management** - Quick +/- buttons to adjust inventory directly from product table
✅ **Admin Settings Panel** - Secure password and username management
✅ **Live Product Management** - Add, edit, delete products with instant updates
✅ **M-Pesa Integration** - Order tracking from payment callbacks
✅ **Session Authentication** - 1-hour session timeout with password hashing
✅ **JSON Data Persistence** - All data stored in backend/data/ folder

## Local Development Setup

### Prerequisites
- Node.js 16+ installed
- npm installed
- Git installed

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Philip200209/brightenlighting.git
cd brightenlighting
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create `.env` file in backend folder:
```bash
cp .env.example .env
```

4. Update `.env` with your values:
```
PORT=3000
ADMIN_USER=your_username
ADMIN_PASS=your_secure_password
SESSION_SECRET=your_session_secret
```

5. Start the backend server:
```bash
npm start
```

6. The site will be available at:
- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin
- Login: http://localhost:3000/login.html

## Production Deployment (Heroku, Railway, Render, etc.)

### Option 1: Heroku Deployment

1. Install Heroku CLI and login:
```bash
heroku login
```

2. Create Heroku app:
```bash
heroku create your-app-name
```

3. Add buildpacks (if not auto-detected):
```bash
heroku buildpacks:add heroku/nodejs
```

4. Set environment variables:
```bash
heroku config:set ADMIN_USER=your_username
heroku config:set ADMIN_PASS=your_secure_password
heroku config:set PORT=3000
heroku config:set MPESA_CONSUMER_KEY=your_mpesa_key
# ... other M-Pesa env vars
```

5. Deploy:
```bash
git push heroku main
```

6. View logs:
```bash
heroku logs --tail
```

### Option 2: Railway.app Deployment

1. Push to GitHub (already done)
2. Go to https://railway.app
3. Click "New Project" → "Deploy from GitHub"
4. Select `brightenlighting` repository
5. Add environment variables from `.env` file
6. Deploy automatically on each push

### Option 3: Render.com Deployment

1. Go to https://render.com/dashboard
2. Click "New Web Service"
3. Connect GitHub account and select repository
4. Configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Add environment variables
5. Deploy

### Option 4: DigitalOcean App Platform

1. Go to DigitalOcean Dashboard
2. Create new App
3. Connect GitHub repository
4. Choose backend folder as source
5. Configure environment variables
6. Deploy

## Database Persistence in Production

**Important**: The current setup uses local JSON files for data storage. For production:

### Option A: Keep JSON Files (Simple)
- Data persists in `backend/data/` folder
- Works on single-server deployments
- Not ideal for distributed systems

### Option B: Migrate to MongoDB (Recommended)

Install MongoDB Atlas cloud database and update backend to use MongoDB instead of JSON files.

Update dependencies:
```bash
npm install mongoose
```

### Option C: Use PostgreSQL

Install Supabase or PostgreSQL and update backend accordingly.

## File Structure

```
brightenlighting/
├── index.html                    # Frontend home
├── login.html                    # Admin login page
├── admin.html                    # Admin dashboard
├── decorative.html               # Category pages
├── assets/                       # Product images
│   ├── decorative-luxury-cluster.jpg
│   ├── pendant-light.jpg
│   └── ...
├── backend/
│   ├── index.js                  # Express server
│   ├── package.json              # Dependencies
│   ├── .env.example              # Environment template
│   ├── private/
│   │   └── admin.html            # Protected admin page
│   └── data/
│       ├── products.json         # Product catalog
│       ├── orders.json           # M-Pesa payments
│       └── admin.json            # Admin credentials
└── README.md
```

## Environment Variables (Production)

Required for full functionality:

```env
# Server
PORT=3000
NODE_ENV=production

# Admin
ADMIN_USER=change_me_in_production
ADMIN_PASS=strong_password_here
SESSION_SECRET=random_string_32_chars_minimum

# M-Pesa Integration
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/mpesa/callback
```

## Continuous Deployment

The repository is set up for automatic deployment:

1. Push to main branch
2. GitHub Actions (or platform CI/CD) automatically:
   - Installs dependencies
   - Runs tests (if configured)
   - Deploys to production
   - Notifies on success/failure

## Monitoring

### Check Server Status
```bash
curl https://yourdomain.com
curl https://yourdomain.com/api/session
```

### View Backend Logs
- Heroku: `heroku logs --tail`
- Railway: Dashboard logs
- Render: Logs tab in dashboard

### Check Database Files
```bash
ls -la backend/data/
```

## Backup & Recovery

### Backup Data
```bash
# Local backup
cp -r backend/data/ backup_$(date +%Y%m%d)

# Or for production, download from server:
scp -r user@server:/app/backend/data/ ./backup
```

### Restore Data
```bash
# Stop server
npm stop

# Restore files
rm -rf backend/data/*
cp -r backup_20260504/* backend/data/

# Restart
npm start
```

## Security Checklist

- [ ] Change default admin password immediately
- [ ] Set unique admin username
- [ ] Use HTTPS only in production
- [ ] Store `.env` file securely (not in git)
- [ ] Set strong SESSION_SECRET (32+ random characters)
- [ ] Enable firewall rules
- [ ] Set up SSL/TLS certificate
- [ ] Configure CORS appropriately
- [ ] Regular password rotation (monthly)
- [ ] Backup data regularly
- [ ] Monitor error logs
- [ ] Update Node.js and dependencies

## Updating the Site

To deploy updates:

1. Make changes locally
2. Test thoroughly
3. Commit to git:
```bash
git add .
git commit -m "describe changes"
```

4. Push to GitHub:
```bash
git push origin main
```

5. Automatic deployment triggers (depends on platform)
6. Verify at https://yourdomain.com/admin

## Troubleshooting

### Site Shows 404
- Check that server is running
- Verify PORT environment variable
- Check firewall/proxy settings

### Can't Login to Admin
- Verify ADMIN_USER and ADMIN_PASS in `.env`
- Check browser cookies are enabled
- Clear browser cache

### Images Not Loading
- Verify files are in `assets/` folder
- Check file permissions (should be readable)
- Verify paths in products.json

### M-Pesa Not Working
- Verify all MPESA_* environment variables
- Check credentials on M-Pesa dashboard
- Ensure callback URL is correct
- Test in sandbox first

## Performance Optimization

For production:

1. Add caching headers to static assets
2. Enable gzip compression
3. Use CDN for images (AWS S3, Cloudflare, etc.)
4. Optimize images (reduce file size)
5. Monitor response times
6. Consider load balancing for high traffic

## Scaling Considerations

Current setup works for:
- Small to medium traffic (< 100 concurrent users)
- Single server deployments

For larger scale:
- Migrate to proper database (MongoDB, PostgreSQL)
- Implement caching layer (Redis)
- Use load balancer
- Separate frontend and backend servers
- Implement CDN

## Support & Questions

- Review error logs in terminal/dashboard
- Check [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for features
- Verify all environment variables are set
- Contact development team with detailed error information

## Version History

- **v1.0** (2026-05-04): Initial deployment with image gallery picker, stock management, and admin settings
