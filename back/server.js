require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const logger   = require('./middleware/logger');
const { seedAdmin, seedHosts, seedEVOwners, seedRequests } = require('./seed');

// Route modules
const authRoutes         = require('./routes/auth');
const hostRoutes         = require('./routes/hosts');
const requestRoutes      = require('./routes/requests');
const statsRoutes        = require('./routes/stats');
const userRoutes         = require('./routes/users');

const app      = express();
const PORT     = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/NearCharge';

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173', 'https://nearcharge.vercel.app'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. system health checks, curl)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api',              authRoutes);     // POST /api/register, POST /api/login
app.use('/api/hosts',        hostRoutes);     // GET /api/hosts, PATCH /api/hosts/:id/approve ...
app.use('/api/requests',     requestRoutes);
app.use('/api/stats',        statsRoutes);    // GET /api/stats
app.use('/api/user',         userRoutes);     // GET /api/user/:id

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
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully to:', MONGO_URI);

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
    } else {
      console.log('🚀 Production mode — skipping seed.');
    }

    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
