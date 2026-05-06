require('dotenv').config();

const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const projectRoot = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'brighten-store-secret';
const MPESA_ENV = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox';
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Schemas
const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: '/assets/decorative-luxury-cluster.jpg' },
    description: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    publicVisible: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    source: { type: String, enum: ['mpesa'], required: true },
    status: { type: String, default: 'successful' },
    merchantRequestId: String,
    checkoutRequestId: String,
    receiptNumber: String,
    amount: Number,
    phoneNumber: String,
    transactionDate: String,
    resultDesc: String,
    receivedAt: { type: Date, default: Date.now },
    raw: mongoose.Schema.Types.Mixed,
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

const endpoints = {
    sandbox: {
        oauth: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        stk: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    },
    production: {
        oauth: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        stk: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    },
};

const defaultProducts = [
    {
        id: 'prod-decorative-cluster',
        name: 'Decorative Cluster Pendant',
        category: 'decorative',
        price: 5500,
        image: '/assets/decorative-luxury-cluster.jpg',
        description: 'Modern statement decorative pendant cluster',
        featured: true,
        stock: 8,
    },
    {
        id: 'prod-pendant-trio',
        name: 'Pendant Light Trio',
        category: 'pendant',
        price: 12500,
        image: '/assets/pendant-light.jpg',
        description: 'Warm interior pendant set for dining and counters',
        featured: true,
        stock: 4,
    },
    {
        id: 'prod-ceiling-panel',
        name: 'Ceiling Panel Light',
        category: 'ceiling',
        price: 6800,
        image: '/assets/ceiling-light.jpg',
        description: 'Slim overhead lighting for clean modern rooms',
        featured: true,
        stock: 6,
    },
    {
        id: 'prod-wall-sconce',
        name: 'Wall Sconce Pair',
        category: 'wall',
        price: 4200,
        image: '/assets/wall-light.jpg',
        description: 'Ambient wall lighting for hallways and lounges',
        featured: false,
        stock: 10,
    },
    {
        id: 'prod-outdoor-path',
        name: 'Outdoor Path Light',
        category: 'outdoor',
        price: 7900,
        image: '/assets/outdoor-light.jpg',
        description: 'Weather-ready exterior lighting for entrances and paths',
        featured: false,
        stock: 7,
    },
];

// ===== UTILITY FUNCTIONS =====
function normalizePhone(phone) {
    if (!phone) return '';
    let normalized = String(phone).replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '254' + normalized.slice(1);
    if (normalized.startsWith('7')) normalized = '254' + normalized;
    if (!normalized.startsWith('254')) normalized = '254' + normalized;
    return normalized.slice(0, 12);
}

function formatTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function getAccessToken() {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    if (!key || !secret) throw new Error('Missing MPESA credentials');

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const response = await axios.get(endpoints[MPESA_ENV].oauth, {
        headers: { Authorization: `Basic ${auth}` },
    });
    return response.data.access_token;
}

function buildOrderFromCallback(body) {
    if (!body?.Body?.stkCallback) return null;
    const cb = body.Body.stkCallback;
    if (cb.ResultCode !== 0) return null;

    const metadata = cb.CallbackMetadata?.ItemList || [];
    const getItem = (name) => metadata.find((x) => x.Name === name)?.Value;

    return {
        id: `order-${Date.now()}`,
        source: 'mpesa',
        status: 'successful',
        merchantRequestId: cb.MerchantRequestID,
        checkoutRequestId: cb.CheckoutRequestID,
        receiptNumber: getItem('ReceiptNumber'),
        amount: getItem('Amount'),
        phoneNumber: getItem('PhoneNumber'),
        transactionDate: getItem('TransactionDate'),
        raw: cb,
    };
}

// ===== MIDDLEWARE =====
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 60 * 60 * 1000,
    },
}));

app.use((req, res, next) => {
    if (req.path.startsWith('/backend')) {
        return res.status(404).end();
    }
    return next();
});

// ===== ADMIN LOGIN ENDPOINT =====
app.post('/api/admin/login', async (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '').trim();

    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = crypto.randomBytes(32).toString('hex');
        console.log(`✅ Admin login successful for user: ${username}`);
        return res.json({ ok: true, token: token, user: username });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

// ===== SERVE ADMIN LOGIN PAGE =====
app.get('/admin-login', (req, res) => {
    try {
        const loginHtml = fs.readFileSync(path.join(projectRoot, 'admin-login.html'), 'utf-8');
        return res.type('html').send(loginHtml);
    } catch (e) {
        return res.status(404).json({ error: 'Admin login page not found' });
    }
});

// ===== SERVE ADMIN DASHBOARD PAGE =====
app.get('/admin-dashboard', (req, res) => {
    try {
        const dashboardHtml = fs.readFileSync(path.join(projectRoot, 'admin-dashboard.html'), 'utf-8');
        return res.type('html').send(dashboardHtml);
    } catch (e) {
        return res.status(404).json({ error: 'Admin dashboard page not found' });
    }
});

// ===== STATIC FILES & PUBLIC ROUTES =====
app.use(express.static(projectRoot, { index: false, extensions: ['html'] }));

app.get('/', async (req, res, next) => {
    try {
        return res.sendFile(path.join(projectRoot, 'index.html'));
    } catch (error) {
        return next(error);
    }
});

// ===== PUBLIC API =====
app.get('/api/products', async (req, res, next) => {
    try {
        const products = await Product.find({ publicVisible: true, stock: { $gt: 0 } })
            .sort({ featured: -1, name: 1 })
            .lean();
        return res.json(products);
    } catch (error) {
        return next(error);
    }
});

// ===== ADMIN PRODUCT CRUD ENDPOINTS =====
// Get all products (admin - no filters)
app.get('/api/products/admin/all', async (req, res, next) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }).lean();
        return res.json(products);
    } catch (error) {
        return next(error);
    }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (!product) return res.status(404).json({ error: 'Product not found' });
        return res.json(product);
    } catch (error) {
        return next(error);
    }
});

// Create new product (admin)
app.post('/api/products', async (req, res, next) => {
    try {
        const { name, category, price, stock, description } = req.body;
        
        if (!name || !category || price === undefined || stock === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let imageData = '';
        if (req.body.image && req.body.image.startsWith('data:image')) {
            imageData = req.body.image;
        }

        const product = new Product({
            id: `prod-${Date.now()}`,
            name,
            category,
            price: Number(price),
            stock: Number(stock),
            description: description || '',
            image: imageData || '/assets/decorative-luxury-cluster.jpg',
            featured: false,
            publicVisible: true
        });

        await product.save();
        return res.status(201).json(product);
    } catch (error) {
        return next(error);
    }
});

// Update product
app.put('/api/products/:id', async (req, res, next) => {
    try {
        const { name, category, price, stock, description, image } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ error: 'Product not found' });

        if (name) product.name = name;
        if (category) product.category = category;
        if (price !== undefined) product.price = Number(price);
        if (stock !== undefined) product.stock = Number(stock);
        if (description !== undefined) product.description = description;
        if (image && image.startsWith('data:image')) product.image = image;

        product.updatedAt = new Date();
        await product.save();

        return res.json(product);
    } catch (error) {
        return next(error);
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res, next) => {
    try {
        const result = await Product.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: 'Product not found' });
        return res.json({ deleted: true });
    } catch (error) {
        return next(error);
    }
});

// ===== MPESA PAYMENT =====
app.post('/stkpush', async (req, res) => {
    try {
        const phone = normalizePhone(req.body?.phone);
        const amount = Number(req.body?.amount);

        if (!phone || !Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ error: 'phone and a valid amount are required' });
        }

        const shortcode = process.env.MPESA_SHORTCODE;
        const passkey = process.env.MPESA_PASSKEY;
        const callbackUrl = process.env.MPESA_CALLBACK_URL;

        if (!shortcode || !passkey || !callbackUrl) {
            return res.status(500).json({ error: 'Missing MPESA configuration' });
        }

        const token = await getAccessToken();
        const timestamp = formatTimestamp();
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        const payload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: phone,
            PartyB: shortcode,
            PhoneNumber: phone,
            CallBackURL: callbackUrl,
            AccountReference: 'BrightenLighting',
            TransactionDesc: 'Payment for Brighten Lighting goods',
        };

        const response = await axios.post(endpoints[MPESA_ENV].stk, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return res.json({ ok: true, daraja: response.data });
    } catch (error) {
        const status = error?.response?.status || 500;
        return res.status(status).json({ error: 'Payment initiation failed', detail: error?.response?.data || error.message });
    }
});

app.post('/mpesa/callback', async (req, res) => {
    try {
        const order = buildOrderFromCallback(req.body);
        if (order) {
            await Order.create(order);
        }
        return res.json({ received: true });
    } catch (error) {
        console.error('M-Pesa callback error', error);
        return res.status(500).json({ error: 'Unable to process callback' });
    }
});

app.get('/api/gallery', async (req, res, next) => {
    try {
        const assetsDir = path.join(projectRoot, 'assets');
        const files = await fs.promises.readdir(assetsDir, { withFileTypes: true });

        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const images = files
            .filter((file) => file.isFile() && imageExtensions.includes(path.extname(file.name).toLowerCase()))
            .map((file) => `/assets/${file.name}`)
            .sort();

        return res.json(images);
    } catch (error) {
        console.error('Gallery error:', error);
        return res.json([
            '/assets/decorative-luxury-cluster.jpg',
            '/assets/pendant-light.jpg',
            '/assets/ceiling-light.jpg',
            '/assets/wall-light.jpg',
            '/assets/outdoor-light.jpg',
        ]);
    }
});

// ===== ERROR HANDLER =====
app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) {
        return next(error);
    }
    return res.status(500).json({ error: 'Server error', detail: error.message });
});

// ===== START SERVER =====
const start = async () => {
    try {
        if (MONGODB_URI) {
            try {
                await mongoose.connect(MONGODB_URI);
                console.log('✅ Connected to MongoDB');

                // Initialize products if none exist
                const productCount = await Product.countDocuments();
                if (productCount === 0) {
                    await Product.insertMany(defaultProducts);
                    console.log('✅ Initialized default products');
                }
            } catch (mongoError) {
                console.log('⚠️  MongoDB connection failed:', mongoError.message);
                console.log('📍 Running in demo mode (no data persistence)');
            }
        } else {
            console.log('⚠️  MONGODB_URI not set - running in demo mode (no data persistence)');
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🎉 Brighten Lighting server running on port ${PORT}`);
            console.log(`📍 Access locally: http://localhost:${PORT}`);
            console.log(`📍 Admin login: http://localhost:${PORT}/admin-login`);
            console.log(`📍 Admin Dashboard: http://localhost:${PORT}/admin-dashboard`);
            console.log(`🗄️  Database: ${MONGODB_URI ? 'MongoDB Atlas (or demo)' : 'Demo mode'}\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    process.exit(0);
});

start();
