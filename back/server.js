require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const logger = require('./middleware/logger');
const { seedAdmin, seedHosts, seedEVOwners, seedRequests } = require('./seed');

// Route modules
const authRoutes = require('./routes/auth');
const hostRoutes = require('./routes/hosts');
const requestRoutes = require('./routes/requests');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/NearCharge';

// ── Bulletproof CORS (Manual + Package) ──────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: true, // Echoes the request origin
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', authRoutes);     // POST /api/register, POST /api/login
app.use('/api/hosts', hostRoutes);     // GET /api/hosts, PATCH /api/hosts/:id/approve ...
app.use('/api/requests', requestRoutes);
app.use('/api/stats', statsRoutes);    // GET /api/stats
app.use('/api/user', userRoutes);     // GET /api/user/:id

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    status: 'ok',
    database: states[dbState] || 'unknown',
    timestamp: new Date()
  });
});

// ── DB + Server start ─────────────────────────────────────────────────────────
mongoose.set("strictQuery", false);

if (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost')) {
  console.log('⚠️ [WARNING] Using LOCAL database URI. Ensure MONGO_URI is set in Render Environment Variables for production.');
}

console.log('⏳ Connecting to MongoDB...');
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000 // 5 second timeout for DB selection
})
  .then(async () => {
    console.log('✅ MongoDB connected successfully!');

    // Only seed in development — never overwrite production data
    if (process.env.NODE_ENV !== 'production') {
      try {
        await seedAdmin();
        await seedHosts();
        await seedEVOwners();
        await seedRequests();
        console.log('✨ Database Seeding Complete!');
      } catch (seedErr) {
        console.error('❌ Seeding Error:', seedErr);
      }
    }

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('👉 ACTION REQUIRED: Check if your MONGO_URI is correct in the Render dashboard.');
    // Allow the server to start even if DB fails, so /api/health can report it
    app.listen(PORT, () => console.log(`🚀 Server started (DEGRADED MODE - No DB) on port ${PORT}`));
  });
