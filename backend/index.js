require('dotenv').config();

const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const projectRoot = path.resolve(__dirname, '..');
const privateAdminFile = path.join(__dirname, 'private', 'admin.html');

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'password123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'brighten-store-secret';
const MPESA_ENV = process.env.MPESA_ENV === 'production' ? 'production' : 'sandbox';
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Schemas
const adminSettingsSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordSalt: { type: String, required: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

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

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
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

let cachedToken = null;
let tokenExpiresAt = 0;

// Utility Functions
const verifyPassword = (password, settings) => {
    if (!settings?.passwordSalt || !settings?.passwordHash) {
        return false;
    }

    const testHash = crypto.scryptSync(String(password), settings.passwordSalt, 64);
    const storedHash = Buffer.from(settings.passwordHash, 'hex');

    return storedHash.length === testHash.length && crypto.timingSafeEqual(storedHash, testHash);
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
    passwordSalt: salt,
    passwordHash: crypto.scryptSync(String(password), salt, 64).toString('hex'),
});

const formatTimestamp = (date = new Date()) => {
    const pad = (value) => String(value).padStart(2, '0');
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds()),
    ].join('');
};

const normalizePhone = (raw) => {
    if (!raw) return null;
    let value = String(raw).replace(/\s|\+|-/g, '');
    if (value.startsWith('0')) {
        value = `254${value.slice(1)}`;
    }
    if (value.startsWith('7') || value.startsWith('1')) {
        value = `254${value}`;
    }
    return /^[0-9]{12}$/.test(value) ? value : null;
};

const normalizeProductPayload = (payload, existingProduct = null) => {
    const name = String(payload.name || '').trim();
    const category = String(payload.category || '').trim().toLowerCase();
    const price = Number(payload.price);
    const stock = Number(payload.stock);

    if (!name || !category || !Number.isFinite(price) || price <= 0) {
        return { error: 'name, category, and a valid price are required' };
    }

    return {
        product: {
            id: existingProduct?.id || `prod-${crypto.randomUUID()}`,
            name,
            category,
            price: Math.round(price),
            image: String(payload.image || existingProduct?.image || '/assets/decorative-luxury-cluster.jpg').trim(),
            description: String(payload.description || existingProduct?.description || '').trim(),
            featured: Boolean(payload.featured),
            publicVisible:
                typeof payload.publicVisible === 'undefined'
                    ? existingProduct?.publicVisible ?? true
                    : Boolean(payload.publicVisible),
            stock: Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : existingProduct?.stock || 0,
        },
    };
};

const buildOrderFromCallback = (callbackBody) => {
    const callback = callbackBody?.Body?.stkCallback;
    if (!callback || callback.ResultCode !== 0) {
        return null;
    }

    const metadataItems = callback.CallbackMetadata?.Item || [];
    const metadata = metadataItems.reduce((accumulator, item) => {
        if (item && item.Name) {
            accumulator[item.Name] = item.Value ?? true;
        }
        return accumulator;
    }, {});

    return {
        id: `order-${crypto.randomUUID()}`,
        source: 'mpesa',
        status: 'successful',
        merchantRequestId: callback.MerchantRequestID || null,
        checkoutRequestId: callback.CheckoutRequestID || null,
        receiptNumber: metadata.MpesaReceiptNumber || metadata.TransactionReceipt || null,
        amount: Number(metadata.Amount || 0),
        phoneNumber: String(metadata.PhoneNumber || metadata.PartyA || ''),
        transactionDate: metadata.TransactionDate || null,
        resultDesc: callback.ResultDesc || 'Success',
        raw: callbackBody,
    };
};

const getAccessToken = async () => {
    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt - 5000) {
        return cachedToken;
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
        throw new Error('Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET');
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const response = await axios.get(endpoints[MPESA_ENV].oauth, {
        headers: { Authorization: `Basic ${auth}` },
    });

    cachedToken = response.data.access_token;
    tokenExpiresAt = now + ((response.data.expires_in || 3599) * 1000);
    return cachedToken;
};

const requireAdmin = (req, res, next) => {
    if (req.session?.isAdmin) {
        return next();
    }

    if (req.accepts('html') && !req.path.startsWith('/api/')) {
        return res.redirect('/login.html');
    }

    return res.status(401).json({ error: 'Unauthorized' });
};

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5500'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            maxAge: 60 * 60 * 1000,
        },
    })
);

app.use((req, res, next) => {
    if (req.path.startsWith('/backend')) {
        return res.status(404).end();
    }
    return next();
});

app.use(express.static(projectRoot, { index: false, extensions: ['html'] }));

// Routes
app.get('/', async (req, res, next) => {
    try {
        return res.sendFile(path.join(projectRoot, 'index.html'));
    } catch (error) {
        return next(error);
    }
});

app.get('/api/session', (req, res) => {
    res.json({ loggedIn: Boolean(req.session?.isAdmin), user: req.session?.adminUser || null });
});

app.get('/api/admin/settings', requireAdmin, async (req, res, next) => {
    try {
        const settings = await AdminSettings.findOne({});
        return res.json({ username: settings?.username || ADMIN_USER });
    } catch (error) {
        return next(error);
    }
});

app.post('/api/admin/login', async (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '').trim();

    try {
        let settings = await AdminSettings.findOne({});

        if (!settings) {
            // Initialize with defaults if not exists
            const { passwordSalt, passwordHash } = hashPassword(ADMIN_PASS);
            settings = await AdminSettings.create({
                username: ADMIN_USER,
                passwordSalt,
                passwordHash,
            });
        }

        if (username !== settings.username || !verifyPassword(password, settings)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        return req.session.regenerate((error) => {
            if (error) {
                return res.status(500).json({ error: 'Unable to create admin session' });
            }

            req.session.isAdmin = true;
            req.session.adminUser = username;
            return res.json({ ok: true });
        });
    } catch (error) {
        return res.status(500).json({ error: 'Unable to read admin settings', detail: error.message });
    }
});

app.put('/api/admin/settings', requireAdmin, async (req, res, next) => {
    try {
        const currentPassword = String(req.body?.currentPassword || '');
        const nextUsername = String(req.body?.username || '').trim();
        const nextPassword = String(req.body?.newPassword || '').trim();
        const confirmPassword = String(req.body?.confirmPassword || '').trim();

        let settings = await AdminSettings.findOne({});

        if (!settings) {
            return res.status(500).json({ error: 'Admin settings not found' });
        }

        if (!verifyPassword(currentPassword, settings)) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        if (!nextUsername) {
            return res.status(400).json({ error: 'Username is required' });
        }

        if (nextPassword && nextPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        if (nextPassword && nextPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const passwordUpdate = nextPassword
            ? hashPassword(nextPassword)
            : {
                passwordSalt: settings.passwordSalt,
                passwordHash: settings.passwordHash,
            };

        settings.username = nextUsername;
        settings.passwordSalt = passwordUpdate.passwordSalt;
        settings.passwordHash = passwordUpdate.passwordHash;
        settings.updatedAt = new Date();
        await settings.save();

        req.session.adminUser = nextUsername;

        return res.json({ ok: true, username: nextUsername, passwordChanged: Boolean(nextPassword) });
    } catch (error) {
        return next(error);
    }
});

app.post('/api/admin/logout', (req, res) => {
    return req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ error: 'Unable to end session' });
        }

        res.clearCookie('connect.sid');
        return res.json({ ok: true });
    });
});

app.get(['/admin', '/admin/'], requireAdmin, (req, res) => {
    return res.sendFile(privateAdminFile);
});

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

app.get('/api/admin/products', requireAdmin, async (req, res, next) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }).lean();
        return res.json(products);
    } catch (error) {
        return next(error);
    }
});

app.post('/api/admin/products', requireAdmin, async (req, res, next) => {
    try {
        const normalized = normalizeProductPayload(req.body);

        if (normalized.error) {
            return res.status(400).json({ error: normalized.error });
        }

        const product = await Product.create(normalized.product);
        return res.status(201).json(product);
    } catch (error) {
        return next(error);
    }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
    try {
        const product = await Product.findOne({ id: req.params.id });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const normalized = normalizeProductPayload(req.body, product);
        if (normalized.error) {
            return res.status(400).json({ error: normalized.error });
        }

        Object.assign(product, normalized.product);
        product.updatedAt = new Date();
        await product.save();

        return res.json(product);
    } catch (error) {
        return next(error);
    }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
    try {
        const result = await Product.deleteOne({ id: req.params.id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        return res.json({ ok: true });
    } catch (error) {
        return next(error);
    }
});

app.get('/api/admin/orders', requireAdmin, async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ receivedAt: -1 }).lean();
        return res.json(orders);
    } catch (error) {
        return next(error);
    }
});

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
        const fs = require('fs').promises;
        const files = await fs.readdir(assetsDir, { withFileTypes: true });

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

// Error handler
app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) {
        return next(error);
    }
    return res.status(500).json({ error: 'Server error', detail: error.message });
});

// Initialize database and start server
const start = async () => {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is required');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Initialize products if none exist
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            await Product.insertMany(defaultProducts);
            console.log('✅ Initialized default products');
        }

        // Initialize admin settings if not exists
        const adminExists = await AdminSettings.findOne({});
        if (!adminExists) {
            const { passwordSalt, passwordHash } = hashPassword(ADMIN_PASS);
            await AdminSettings.create({
                username: ADMIN_USER,
                passwordSalt,
                passwordHash,
            });
            console.log('✅ Initialized admin settings');
        }

        app.listen(PORT, () => {
            console.log(`\n🎉 Brighten Lighting server running on port ${PORT}`);
            console.log(`📍 Frontend: ${FRONTEND_URL}`);
            console.log(`🗄️  Database: MongoDB Atlas\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle shutdown
process.on('SIGINT', async () => {
    await mongoose.disconnect();
    process.exit(0);
});

start();
