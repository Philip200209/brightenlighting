# Admin Dashboard Quick Start

## What's New

Your Brighten Lighting admin dashboard now has powerful new features:

### 🖼️ Image Gallery Picker
Select product images from a visual gallery instead of typing paths. All images in the `/assets` folder are automatically available.

### 📦 Stock Management
Adjust inventory with one-click +/- buttons directly from the product table. Stock instantly updates across the public website.

### 🔐 Admin Settings
Securely manage your username and password from a dedicated settings modal. Changes require current password verification.

### 📊 Live Dashboard
Real-time stats show product count, featured items, orders, and revenue in KES.

## Getting Started (30 seconds)

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Open your browser:**
   - Go to http://localhost:3000/login.html
   - Login with default credentials (see below)
   - Or deploy to GitHub (already pushed!)

3. **Change your password immediately:**
   - Click "Settings" button
   - Enter current password + new credentials
   - Never use default credentials in production

## Default Admin Credentials

**Username:** `admin`  
**Password:** `password123`

⚠️ **Change these immediately on first login!**

## Quick Features Overview

### Add a Product (1 minute)
1. Fill Product Name, Category, Price, Stock
2. Click "Choose from Gallery" to pick an image
3. Add description and mark as featured if desired
4. Click "Save Product"
✅ Product goes live instantly on website

### Adjust Stock (10 seconds)
1. Find product in Products table
2. Click + to add 1 unit or − to remove 1 unit
3. Done! Website updates automatically

### Change Username/Password (30 seconds)
1. Click "Settings" button (top-right)
2. Enter current password (required)
3. Enter new username and/or password
4. Click "Save Settings"

## File Locations

- **Frontend:** `/` (index.html, decorative.html, etc.)
- **Admin Dashboard:** `/admin` (protected route)
- **Login:** `/login.html`
- **API Endpoints:** `/api/*`
- **Product Images:** `/assets/`
- **Backend Code:** `/backend/`

## How Data Works

- **Products:** `backend/data/products.json` - Updated instantly when you save
- **Orders:** `backend/data/orders.json` - Auto-updated by M-Pesa callback
- **Admin Creds:** `backend/data/admin.json` - Hashed passwords stored here

All data persists between server restarts.

## GitHub Deployment

Your code is now live on GitHub:
- **Repository:** https://github.com/Philip200209/brightenlighting
- **Latest Features:** Image picker, stock management, admin settings
- **Ready to Deploy:** To Heroku, Railway, Render, or any Node.js host

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.

## API Endpoints Quick Reference

**Products:**
- `GET /api/products` - Get public products
- `GET /api/admin/products` - Get all products (admin)
- `POST /api/admin/products` - Add product (admin)
- `PUT /api/admin/products/:id` - Edit product (admin)
- `DELETE /api/admin/products/:id` - Delete product (admin)

**Gallery:**
- `GET /api/gallery` - List images from assets folder

**Admin Settings:**
- `GET /api/admin/settings` - Get admin username (admin)
- `PUT /api/admin/settings` - Update credentials (admin)

**Authentication:**
- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout
- `GET /api/session` - Check if logged in

## Environment Setup (.env)

Create `backend/.env` with:
```
PORT=3000
ADMIN_USER=your_username
ADMIN_PASS=your_strong_password
SESSION_SECRET=random_string_here
```

For M-Pesa integration, add:
```
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_code
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/mpesa/callback
```

## Supported Image Formats

- JPG / JPEG
- PNG
- GIF
- WebP

Place images in `/assets/` folder and they'll automatically appear in the gallery picker.

## Security Tips

1. ✅ Change default password on first login
2. ✅ Use strong passwords (mix of upper, lower, numbers, symbols)
3. ✅ Keep `.env` file secret (never commit to git)
4. ✅ Use HTTPS in production (not HTTP)
5. ✅ Backup data regularly
6. ✅ Session expires after 1 hour of inactivity

## Troubleshooting

**Server won't start:**
```bash
# Make sure you're in the backend folder
cd backend
# Clear npm cache if needed
npm cache clean --force
npm install
npm start
```

**Can't see images in gallery:**
- Make sure image files are in `/assets/` folder
- Supported formats: JPG, PNG, GIF, WebP
- Restart server if you added new images

**Forgot admin password:**
- Edit `backend/.env` file
- Change `ADMIN_PASS` value
- Restart server
- Or delete `backend/data/admin.json` to reset to defaults

**Products not showing on website:**
- Check stock value (must be > 0)
- Ensure `publicVisible` is not set to false
- Refresh page (Ctrl+R or Cmd+R)

## Next Steps

1. ✅ [Change your admin password](http://localhost:3000/login.html)
2. ✅ [Add your first product](http://localhost:3000/admin)
3. ✅ [Review ADMIN_GUIDE.md](ADMIN_GUIDE.md) for complete features
4. ✅ [Deploy to production](DEPLOYMENT.md)

## Support Documents

- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** - Complete admin dashboard documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment instructions
- **[README.md](README.md)** - General project information

## Questions?

Review the documentation files or check the error logs in your terminal for detailed error messages.

---

**Happy managing!** 🚀 Your Brighten Lighting admin dashboard is now fully operational.
