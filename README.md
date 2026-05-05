# Brighten Lighting - Free-Forever Stack

**Full-stack e-commerce platform for Brighten Lighting** with product catalog, admin dashboard, and M-Pesa payment integration.

## Tech Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Hosted on GitHub Pages (free)

**Backend:**
- Node.js / Express.js
- Hosted on Render.com (free tier)
- MongoDB Atlas database (free 512MB tier)

**Payment Integration:**
- M-Pesa (Safaricom Daraja)

## Pages

### Public Site
- `index.html` - Homepage with hero and featured products
- `about.html` - Company overview
- `services.html` - Services overview
- `pricing.html` - Pricing packages
- `coverage.html` - Service area coverage
- `gallery.html` - Lighting inspiration gallery
- `projects.html` - Project showcase
- `support.html` - Customer support
- `contact.html` - Contact and quote form
- `request-service.html` - Primary conversion flow
- `privacy.html` - Privacy policy
- `terms.html` - Terms of service

### Admin Panel
- `login.html` - Admin authentication
- `backend/private/admin.html` - Dashboard (product & order management)

## Features

✅ **Product Management** - Add, edit, delete products with images
✅ **Stock Management** - Real-time inventory tracking
✅ **M-Pesa Payments** - Safaricom Daraja integration
✅ **Order Tracking** - Track payments from M-Pesa callbacks
✅ **Admin Dashboard** - Secure, password-protected interface
✅ **Responsive Design** - Mobile-first layout
✅ **Image Gallery** - Auto-detect product images from assets

## Quick Start

### Local Development

#### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas connection string)

#### Setup Backend

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file in `backend/` folder:
```bash
cp backend/.env.example backend/.env
```

3. Update `.env` with your values:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/brightenlighting
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
SESSION_SECRET=your_session_secret
```

4. Start backend server:
```bash
npm start
```

Backend runs on `http://localhost:3000`

#### Serve Frontend

In another terminal:
```bash
python -m http.server 5500
```

Or run the VS Code task: **Run Brighten Lighting Site**

Access site at `http://localhost:5500`

## Deployment

### Production Stack (Free-Forever)

- **Frontend**: GitHub Pages
- **Backend**: Render.com
- **Database**: MongoDB Atlas

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup guide including:
- MongoDB Atlas free tier setup
- Render.com deployment
- GitHub Pages configuration
- Environment variables
- Troubleshooting

### Quick Deployment Checklist

1. ✅ MongoDB Atlas account created
2. ✅ Database cluster running
3. ✅ Render.com service deployed
4. ✅ Backend environment variables configured
5. ✅ GitHub Pages enabled on repository
6. ✅ Frontend API calls point to Render backend

## Environment Variables

**Backend** (`.env` file):

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes | Database connection string |
| `FRONTEND_URL` | Yes | GitHub Pages URL (for CORS) |
| `ADMIN_USER` | No | Admin username (default: `admin`) |
| `ADMIN_PASS` | No | Admin password (default: `password123`) |
| `SESSION_SECRET` | No | Session encryption key |
| `NODE_ENV` | No | `production` or `development` |
| `MPESA_CONSUMER_KEY` | Optional | M-Pesa API key |
| `MPESA_CONSUMER_SECRET` | Optional | M-Pesa secret |
| `MPESA_CALLBACK_URL` | Optional | Webhook for M-Pesa payments |

Generate secure `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## API Endpoints

### Public
- `GET /api/products` - List public products
- `GET /api/gallery` - List images from assets folder
- `POST /stkpush` - Initiate M-Pesa payment

### Admin (requires login)
- `GET /api/session` - Check login status
- `POST /api/admin/login` - Authenticate admin
- `POST /api/admin/logout` - End session
- `GET /api/admin/settings` - Get admin settings
- `PUT /api/admin/settings` - Update credentials
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - View M-Pesa orders

## Database Schema

### Products
```json
{
  "id": "prod-...",
  "name": "Product Name",
  "category": "ceiling|wall|pendant|decorative|outdoor",
  "price": 5500,
  "image": "/assets/image.jpg",
  "description": "...",
  "featured": true,
  "publicVisible": true,
  "stock": 10,
  "createdAt": "2024-01-01T...",
  "updatedAt": "2024-01-01T..."
}
```

### Orders (M-Pesa)
```json
{
  "id": "order-...",
  "source": "mpesa",
  "status": "successful",
  "amount": 5500,
  "phoneNumber": "254712345678",
  "receiptNumber": "LIJ...",
  "transactionDate": "20240101120000",
  "receivedAt": "2024-01-01T...",
  "raw": {...}
}
```

### Admin Settings
```json
{
  "username": "admin",
  "passwordHash": "...",
  "passwordSalt": "...",
  "createdAt": "2024-01-01T...",
  "updatedAt": "2024-01-01T..."
}
```

## File Structure

```
lighting/
├── index.html              # Homepage
├── about.html              # About page
├── services.html           # Services page
├── pricing.html            # Pricing page
├── gallery.html            # Gallery page
├── projects.html           # Projects page
├── contact.html            # Contact form
├── login.html              # Admin login
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── script.js               # Frontend logic
├── styles.css              # Styling
├── README.md               # This file
├── DEPLOYMENT.md           # Deployment guide
├── assets/                 # Product images
├── backend/
│   ├── index.js            # Express server
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment template
│   ├── private/
│   │   └── admin.html      # Admin dashboard
│   └── data/               # JSON backup (legacy)
└── .github/
    └── copilot-instructions.md
```

## Admin Dashboard

**URL**: `/login.html`

**Login**: 
- Username: value of `ADMIN_USER` env var
- Password: value of `ADMIN_PASS` env var

**Features:**
- ➕ Add new products with images
- ✏️ Edit product details and pricing
- 🗑️ Delete products
- 📦 Adjust stock levels
- 👤 Change admin credentials
- 📊 View M-Pesa payment orders

## Troubleshooting

### Backend won't connect to MongoDB
- ❌ `MONGODB_URI` is missing or incorrect
- ✅ Copy connection string from MongoDB Atlas
- ✅ Replace `<username>` and `<password>` with actual values
- ✅ Ensure network access is allowed in Atlas

### Admin login fails
- ❌ Database not initialized
- ✅ Check MongoDB connection in logs
- ✅ Verify `ADMIN_USER` and `ADMIN_PASS` env vars
- ✅ Restart backend server

### Products not showing on public site
- ❌ CORS error preventing API calls
- ✅ Check browser console for errors
- ✅ Verify `FRONTEND_URL` matches your GitHub Pages domain
- ✅ Add at least one product in admin dashboard

### M-Pesa not working
- ❌ Missing M-Pesa credentials
- ✅ Set `MPESA_ENV=sandbox` for testing
- ✅ Get API keys from Safaricom Developer Portal
- ✅ Ensure `MPESA_CALLBACK_URL` points to your backend

## Next Steps

1. **Deploy Backend** → Follow [DEPLOYMENT.md](DEPLOYMENT.md)
2. **Set Admin Credentials** → Change default password
3. **Add Products** → Upload product catalog
4. **Configure M-Pesa** → Get API keys from Safaricom
5. **Custom Domain** → Point domain to GitHub Pages + Render

## Support

For issues or questions:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
2. View backend logs on Render dashboard
3. Check MongoDB Atlas for data
4. Review browser console for frontend errors

---

**Free-Forever Stack** ✅
- GitHub Pages: Forever free
- Render.com: Free tier with sleep after 15min inactivity
- MongoDB Atlas: Free 512MB tier, always running
- Total cost: $0/month (upgrade to paid tiers as you grow)

5. Wait for GitHub to publish the site and copy the Pages URL.

The site is already static and uses relative links, so it is ready for GitHub Pages without extra build steps.

## Business Details

- Brand: Brighten Lighting
- Tagline: Light That Inspires
- Phone: 0722339377
- Location: Eldoret City
