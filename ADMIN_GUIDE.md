# Admin Dashboard Guide

## Overview

The Brighten Lighting admin dashboard is a secure, web-based interface for managing products, inventory, and admin credentials. It's located at `/admin` and requires authentication.

## Accessing the Dashboard

1. Navigate to `http://localhost:3000/login.html` (or your deployed domain)
2. Enter your admin credentials
3. You'll be redirected to `/admin` upon successful login

**Default Credentials (Change Immediately):**
- Username: `admin`
- Password: `password123`

## Features

### 1. Product Management

#### Adding Products
1. Fill in the Product Form on the dashboard
2. **Product Name**: Enter a descriptive name
3. **Category**: Choose from: Decorative, Pendant, Ceiling, Wall, or Outdoor
4. **Price**: Enter the price in KES (whole numbers only)
5. **Stock**: Enter initial quantity
6. **Image**: Click "Choose from Gallery" to select from available assets
7. **Description**: Add a brief product summary
8. **Featured**: Check to mark as featured product
9. Click "Save Product"

#### Gallery Image Picker
- Click "Choose from Gallery" button
- Browse available images from `/assets` folder
- Click an image to select it (highlighted in gold)
- Click "Select Image" to confirm

#### Editing Products
1. In the Products table, click the "Edit" button on any product
2. Form will populate with product details
3. Modify fields as needed
4. Click "Update Product"

#### Deleting Products
1. Click the "Delete" button in the Products table
2. Confirm the deletion prompt
3. Product will be removed and website updated instantly

#### Stock Management
- **Quick Stock Adjustment**: Use +/- buttons directly in the Products table
- **Bulk Editing**: Edit a product and change the Stock field to any value

### 2. Inventory Control

The stock number shown in the table represents actual inventory on the public website. Only products with stock > 0 are visible to customers.

**Stock Actions:**
- Click **+** to increase stock by 1
- Click **−** to decrease stock by 1
- Minimum stock is 0 (stock cannot go negative)
- Changes are applied immediately

### 3. Admin Settings

#### Changing Username and Password
1. Click "Settings" button in top-right corner
2. Enter your **Current Password** (required for security)
3. Enter new **Username** (optional)
4. Enter new **Password** (optional, minimum 6 characters)
5. Confirm new password
6. Click "Save Settings"

**Security Note:** The current password verification prevents unauthorized changes to admin credentials.

### 4. Dashboard Overview

The overview section shows real-time statistics:
- **Products**: Total number of products
- **Featured**: Count of featured products
- **Orders**: Total successful M-Pesa payments received
- **Revenue**: Total KES collected from payments

### 5. Orders Management

The "Successful M-Pesa Payments" table displays:
- **Receipt**: M-Pesa receipt number
- **Amount**: Transaction amount in KES
- **Phone**: Customer's phone number
- **Status**: Payment status
- **Received At**: Timestamp of payment

## API Endpoints (Backend)

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/session` - Check login status

### Products
- `GET /api/products` - Get public products (stock > 0)
- `GET /api/admin/products` - Get all products (admin only)
- `POST /api/admin/products` - Create product (admin only)
- `PUT /api/admin/products/:id` - Update product (admin only)
- `DELETE /api/admin/products/:id` - Delete product (admin only)

### Gallery
- `GET /api/gallery` - List available images from assets folder

### Admin Settings
- `GET /api/admin/settings` - Get admin username (admin only)
- `PUT /api/admin/settings` - Update username/password (admin only)

### Orders
- `GET /api/admin/orders` - Get all M-Pesa orders (admin only)

## Data Storage

All data is persisted as JSON files:
- `backend/data/products.json` - Product catalog
- `backend/data/orders.json` - M-Pesa payment records
- `backend/data/admin.json` - Admin credentials (hashed)

## Security Features

1. **Session Management**: Admin sessions expire after 1 hour
2. **Password Hashing**: Passwords use scrypt with salt
3. **CSRF Protection**: Session-based cookie security
4. **SQL Injection Prevention**: All inputs are validated
5. **Current Password Verification**: Required for credential changes

## Best Practices

1. **Regular Password Changes**: Update your password monthly
2. **Unique Username**: Use a custom username, not "admin"
3. **Strong Passwords**: Use passwords with mix of uppercase, lowercase, numbers, symbols
4. **Monitor Inventory**: Review stock levels regularly
5. **Backup Data**: Regularly backup `backend/data/` folder
6. **Use HTTPS**: Always use HTTPS in production (not HTTP)

## Troubleshooting

### Can't Access Dashboard
- Ensure you're logged in first
- Check that backend server is running (`npm start` in `backend/` folder)
- Verify you're using correct URL: `/admin`

### Changes Not Saving
- Check browser console for errors (F12)
- Ensure backend server is running
- Verify you have correct permissions

### Images Not Showing
- Place image files in `assets/` folder
- Ensure filename is referenced correctly in product form
- Supported formats: JPG, JPEG, PNG, GIF, WebP

### Forgotten Password
- Contact site administrator
- May require manual `.env` file password reset

## Environment Variables

The backend uses `.env` file for configuration. Key variables:

```
PORT=3000                          # Server port
ADMIN_USER=admin                   # Default admin username
ADMIN_PASS=password123             # Default admin password
SESSION_SECRET=brighten-store-secret  # Session encryption key
MPESA_ENV=sandbox                  # M-Pesa environment
MPESA_CONSUMER_KEY=your_key        # M-Pesa credentials
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_code
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/mpesa/callback
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## Support

For issues or questions:
1. Check error messages in browser console (F12)
2. Review server logs in terminal
3. Verify all `.env` variables are set
4. Contact development team with error details
