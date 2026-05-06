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

let cachedToken = null;
let tokenExpiresAt = 0;

// Utility Functions
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

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
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

// ===== ADMIN ROUTES (before static middleware) =====
// ===== ADMIN LOGIN ENDPOINT =====
app.post('/api/admin/login', async (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '').trim();

    // Hardcoded credentials for demo (use env vars in production)
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        
        console.log(`✅ Admin login successful for user: ${username}`);
        return res.json({ 
            ok: true, 
            token: token,
            user: username 
        });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

// ===== SERVE ADMIN LOGIN PAGE =====
app.get('/admin-login', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Brighten Lighting</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        body { background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%); }
        .login-container { background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%); border: 1px solid rgba(255, 215, 0, 0.2); }
        .input-field { background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 215, 0, 0.2); color: #e0e0e0; }
        .input-field:focus { background-color: rgba(255, 255, 255, 0.08); border-color: #FFD700; outline: none; box-shadow: 0 0 8px rgba(255, 215, 0, 0.2); }
        .btn-login { background-color: #FFD700; color: #000; font-weight: 600; transition: all 0.3s; }
        .btn-login:hover { background-color: #ffd700cc; transform: translateY(-2px); }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md">
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-yellow-500 mb-2">BRIGHTEN</h1>
            <p class="text-gray-400">Admin Portal</p>
        </div>
        <div class="login-container rounded-lg p-8">
            <h2 class="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>
            <div id="errorMessage" class="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 hidden">Invalid credentials. Please try again.</div>
            <form id="loginForm" onsubmit="handleLogin(event)">
                <div class="mb-4">
                    <label class="block text-gray-300 text-sm font-medium mb-2">Username</label>
                    <input type="text" id="username" placeholder="admin" class="input-field w-full px-4 py-3 rounded-lg" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-300 text-sm font-medium mb-2">Password</label>
                    <input type="password" id="password" placeholder="••••••••" class="input-field w-full px-4 py-3 rounded-lg" required>
                </div>
                <button type="submit" class="btn-login w-full py-3 rounded-lg font-semibold mb-4">Sign In</button>
            </form>
            <div class="text-center text-gray-400 text-sm">
                <p>Demo Credentials:</p>
                <p>Username: <code class="text-yellow-400">admin</code></p>
                <p>Password: <code class="text-yellow-400">admin123</code></p>
            </div>
        </div>
        <div class="text-center mt-8 text-gray-500 text-sm">
            <p>© 2026 Brighten Lighting. All rights reserved.</p>
        </div>
    </div>
    <script>
        const API_BASE = window.location.origin;
        async function handleLogin(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            try {
                const response = await fetch(API_BASE + '/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                if (response.ok && data.token) {
                    window.location.href = API_BASE + '/admin-dashboard#token=' + encodeURIComponent(data.token);
                } else {
                    errorMessage.classList.remove('hidden');
                    console.error('Login failed:', data.error);
                }
            } catch (error) {
                errorMessage.textContent = 'Error: ' + error.message;
                errorMessage.classList.remove('hidden');
                console.error('Login error:', error);
            }
        }
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        });
    <\/script>
</body>
</html>`;
    return res.type('html').send(html);
});

// ===== SERVE ADMIN DASHBOARD PAGE =====
app.get('/admin-dashboard', (req, res) => {
    const token = req.query.token || 'NO_TOKEN';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Brighten Lighting</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body class="bg-gray-900 text-gray-100">
    <div class="flex h-screen">
        <!-- Sidebar -->
        <aside class="w-64 bg-gray-800 border-r border-gray-700">
            <div class="p-6">
                <h1 class="text-2xl font-bold text-yellow-500">BRIGHTEN</h1>
                <p class="text-gray-400 text-sm">Admin Portal</p>
            </div>
            <nav class="mt-8">
                <a href="#" onclick="switchPage('dashboard')" class="nav-link block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-yellow-500 border-l-4 border-transparent active" data-page="dashboard">Dashboard</a>
                <a href="#" onclick="switchPage('products')" class="nav-link block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-yellow-500 border-l-4 border-transparent" data-page="products">Products</a>
                <a href="#" onclick="switchPage('events')" class="nav-link block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-yellow-500 border-l-4 border-transparent" data-page="events">Events</a>
                <a href="#" onclick="switchPage('inquiries')" class="nav-link block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-yellow-500 border-l-4 border-transparent" data-page="inquiries">Inquiries</a>
                <a href="#" onclick="switchPage('settings')" class="nav-link block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-yellow-500 border-l-4 border-transparent" data-page="settings">Settings</a>
            </nav>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
            <!-- Top Navbar -->
            <div class="bg-gray-800 border-b border-gray-700 px-8 py-4 flex justify-between items-center">
                <h2 id="pageTitle" class="text-2xl font-bold">Dashboard</h2>
                <div class="flex items-center gap-4">
                    <button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">Logout</button>
                </div>
            </div>

            <!-- Page Content -->
            <div class="flex-1 overflow-auto p-8">
                <!-- Dashboard Page -->
                <div id="dashboard" class="page-content">
                    <div class="grid grid-cols-4 gap-4 mb-8">
                        <div class="bg-gray-800 p-6 rounded-lg">
                            <p class="text-gray-400">Total Products</p>
                            <p class="text-3xl font-bold text-yellow-500">5</p>
                        </div>
                        <div class="bg-gray-800 p-6 rounded-lg">
                            <p class="text-gray-400">Total Events</p>
                            <p class="text-3xl font-bold text-yellow-500">3</p>
                        </div>
                        <div class="bg-gray-800 p-6 rounded-lg">
                            <p class="text-gray-400">New Inquiries</p>
                            <p class="text-3xl font-bold text-yellow-500">4</p>
                        </div>
                        <div class="bg-gray-800 p-6 rounded-lg">
                            <p class="text-gray-400">Revenue</p>
                            <p class="text-3xl font-bold text-yellow-500">$0</p>
                        </div>
                    </div>
                    <p class="text-gray-400">Welcome to your dashboard! Use the sidebar to manage your business.</p>
                </div>

                <!-- Products Page -->
                <div id="products" class="page-content hidden">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold">Products</h3>
                        <button onclick="showProductForm()" class="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-600">+ Add Product</button>
                    </div>
                    <div class="bg-gray-800 rounded-lg overflow-hidden">
                        <table class="w-full">
                            <thead class="bg-gray-700">
                                <tr>
                                    <th class="px-6 py-3 text-left">Name</th>
                                    <th class="px-6 py-3 text-left">Category</th>
                                    <th class="px-6 py-3 text-left">Price</th>
                                    <th class="px-6 py-3 text-left">Stock</th>
                                    <th class="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="productsList">
                                <tr>
                                    <td class="px-6 py-3" colspan="5" class="text-center text-gray-400">Loading...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Events Page -->
                <div id="events" class="page-content hidden">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold">Events</h3>
                        <button onclick="showEventForm()" class="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-600">+ New Event</button>
                    </div>
                    <div id="eventsList" class="grid grid-cols-3 gap-4">
                        <p class="text-gray-400">No events yet.</p>
                    </div>
                </div>

                <!-- Inquiries Page -->
                <div id="inquiries" class="page-content hidden">
                    <h3 class="text-xl font-bold mb-6">Customer Inquiries</h3>
                    <div class="bg-gray-800 rounded-lg overflow-hidden">
                        <table class="w-full">
                            <thead class="bg-gray-700">
                                <tr>
                                    <th class="px-6 py-3 text-left">From</th>
                                    <th class="px-6 py-3 text-left">Message</th>
                                    <th class="px-6 py-3 text-left">Status</th>
                                    <th class="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="inquiriesList">
                                <tr><td colspan="4" class="px-6 py-3 text-center text-gray-400">No inquiries</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Settings Page -->
                <div id="settings" class="page-content hidden">
                    <h3 class="text-xl font-bold mb-6">Settings</h3>
                    <div class="bg-gray-800 p-6 rounded-lg max-w-md">
                        <button onclick="logout()" class="bg-red-600 hover:bg-red-700 w-full px-4 py-2 rounded text-white font-semibold">Logout</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <style>
        .nav-link {
            position: relative;
        }
        .nav-link.active {
            background-color: rgba(255, 215, 0, 0.1);
            border-left-color: #FFD700;
            color: #FFD700;
        }
        .page-content.hidden {
            display: none;
        }
    </style>

    <script>
        const token = window.location.hash.substring(7) || localStorage.getItem('token');
        
        if (!token) {
            window.location.href = '/admin-login';
        } else {
            localStorage.setItem('token', token);
            history.replaceState(null, '', window.location.pathname);
        }

        function switchPage(pageName) {
            document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(pageName).classList.remove('hidden');
            
            document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
            document.querySelector(\`[data-page="\${pageName}"]\`).classList.add('active');
            
            const titles = { dashboard: 'Dashboard', products: 'Products', events: 'Events', inquiries: 'Inquiries', settings: 'Settings' };
            document.getElementById('pageTitle').textContent = titles[pageName];
        }

        function logout() {
            localStorage.removeItem('token');
            window.location.href = '/admin-login';
        }

        function showProductForm() { alert('Add/Edit Product Form (Demo)'); }
        function showEventForm() { alert('Add/Edit Event Form (Demo)'); }
    <\/script>
</body>
</html>`;
    return res.type('html').send(html);
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





app.get('/api/products', async (req, res, next) => {
    try {
        const products = await Product.find({ publicVisible: true, stock: { $gt: 0 } })
            .sort({ featured: -1, name: 1 })
            .lean();
        return res.json(products);
    } catch (error) {
        return next(error);
    }

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
