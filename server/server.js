// ─── Erlbrew Café Backend Server ──────────────────────────────────────────
// Express server serving:
//   • /api/gallery — REST API for gallery photo CRUD
//   • /uploads/   — static serving of uploaded images
//   • /*          — frontend static files (erlbrew-cafe-website.html, erlbrew-admin.html)
// ────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const compression  = require('compression');
const path         = require('path');
const db           = require('./db');
const { requireSession, requireSessionAPI, loginUser, logoutUser } = require('./middleware/auth');
const galleryRoutes = require('./routes/gallery');
const aboutRoutes   = require('./routes/about');
const hoursRoutes   = require('./routes/hours');
const menuRoutes    = require('./routes/menu');
const recommendationsRoutes = require('./routes/recommendations');
const seasonalRoutes = require('./routes/seasonal');
const eventRoutes   = require('./routes/events');
const exportRoutes  = require('./routes/export');

const app = express();

// Trust Cloudflare's proxy headers (for correct IP detection in rate limiting)
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// ── Security ───────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", 'https://www.google.com'],
    },
  },
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || '*';
if (allowedOrigins === '*' && isProd) {
  console.warn('[Security] ALLOWED_ORIGINS not set — CORS is wide open in production');
}
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  exposedHeaders: [],
}));

app.use(compression());

// Body parsing for non-file routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Static files ───────────────────────────────────────────────────────────
// Serve built assets (compiled Tailwind CSS, etc.)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
  lastModified: true,
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
  lastModified: true,
}));

// ── Homepage routes ────────────────────────────────────────────────────────
const rootDir = path.join(__dirname, '..');
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'erlbrew-cafe-website.html')));
app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/erlbrew-cafe-website.html', (req, res) => res.redirect(301, '/'));

// ── Admin login (no auth required) ─────────────────────────────────────────
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.post('/api/admin/login', loginUser);

// ── Admin page routes (session required, redirects to /admin/login) ────────
app.get('/admin', requireSession, (req, res) => res.sendFile(path.join(rootDir, 'erlbrew-admin.html')));
app.get('/erlbrew-admin.html', requireSession, (req, res) => res.redirect(301, '/admin'));

// Admin logout
app.post('/api/admin/logout', requireSessionAPI, logoutUser);

// Protect all non-GET API requests with session auth
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET') return requireSessionAPI(req, res, next);
  next();
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/gallery', galleryRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/hours', hoursRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/seasonal', seasonalRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/export', exportRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Analytics (admin) ─────────────────────────────────────────────────────
app.get('/api/analytics', requireSessionAPI, async (req, res) => {
  try {
    const [galleryCount, menuCatsCount, menuItemsCount, inquiriesCount, unreadCount, seasonalCount] = await Promise.all([
      db.getGalleryCount(),
      db.getMenuCategoriesCount(),
      db.getMenuItemsCount(),
      db.getInquiriesCount(),
      db.getUnreadInquiriesCount(),
      db.getSeasonalCount(),
    ]);

    res.json({
      success: true,
      analytics: {
        gallery: { used: galleryCount, total: 5 },
        menu: { categories: menuCatsCount, items: menuItemsCount },
        inquiries: { total: inquiriesCount, unread: unreadCount },
        seasonal: seasonalCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err);
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  res.status(statusCode >= 100 && statusCode < 600 ? statusCode : 500).json({
    success: false,
    message: isProd ? 'Internal server error' : err.message,
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Verify DB connection
    await db.testConnection();
    console.log('[DB] Connected to MySQL');

    // Attempt to ensure table exists (non-fatal if app user lacks CREATE)
    await db.ensureTable();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Erlbrew backend running on http://0.0.0.0:${PORT}`);
      console.log(`[Server] Environment: ${isProd ? 'production' : 'development'}`);
    });
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err.message);
    process.exit(1);
  }
}

// ── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  try {
    const pool = db.getPool();
    if (pool) await pool.end();
    console.log('[Server] Connections closed.');
  } catch (e) {
    // ignore
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] SIGTERM received, shutting down...');
  try {
    const pool = db.getPool();
    if (pool) await pool.end();
  } catch (e) {
    // ignore
  }
  process.exit(0);
});

start();
