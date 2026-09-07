// ─── Session-based Auth Middleware ──────────────────────────────────────────
// Login page at {ADMIN_SECRET_PATH}/login → POST /api/admin/login → session cookie.
// Protects admin pages (redirect to login) and write API endpoints (401).
// Admin path is hidden via ADMIN_SECRET_PATH env var (default: /x7k9m2p).
// ────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const bcrypt = require('bcrypt');

// ── Config ─────────────────────────────────────────────────────────────────
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOKIE_NAME = 'erlbrew_session';

// ── In-memory session store ────────────────────────────────────────────────
// token -> { username, createdAt }
const sessions = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(username) {
  // Evict old sessions for this user (keep it lean)
  for (const [token, session] of sessions) {
    if (session.username === username) {
      sessions.delete(token);
    }
  }

  const token = generateToken();
  sessions.set(token, { username, createdAt: Date.now() });
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function getSession(token) {
  const session = sessions.get(token);
  if (!session) return null;
  // Check expiry
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return null;
  }
  return session;
}

// Periodic cleanup of expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(token);
    }
  }
}, 5 * 60 * 1000).unref();

// ── Cookie helpers ─────────────────────────────────────────────────────────

function parseCookies(req) {
  const cookie = req.headers.cookie;
  if (!cookie) return {};
  const result = {};
  for (const pair of cookie.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

function setSessionCookie(res, token) {
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure' : '';
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (secureFlag) parts.push(secureFlag);
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ].join('; '));
}

// ── Rate limiter (for login endpoint) ──────────────────────────────────────
const rateLimitMap = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || (now - entry.windowStart) > WINDOW_MS) {
    entry = { count: 0, windowStart: now, blockedUntil: null };
    rateLimitMap.set(ip, entry);
  }
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { limited: true, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  return { limited: false };
}

function recordLoginAttempt(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || (now - entry.windowStart) > WINDOW_MS) {
    entry = { count: 0, windowStart: now, blockedUntil: null };
    rateLimitMap.set(ip, entry);
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    return { blocked: true, retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000) };
  }
  return { blocked: false, remaining: MAX_ATTEMPTS - entry.count };
}

function clearRateLimit(ip) {
  rateLimitMap.delete(ip);
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (!entry.blockedUntil && (now - entry.windowStart) > WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

// ── Credential verification (reads from DB) ────────────────────────────────
const db = require('../db');

async function verifyCredentials(username, password) {
  try {
    const pool = db.getPool();
    const [rows] = await pool.execute(
      'SELECT password_hash FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );
    if (rows.length === 0) {
      console.warn('[Auth] No user found:', username);
      return false;
    }
    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) console.warn('[Auth] Password mismatch for:', username);
    return match;
  } catch (err) {
    console.error('[Auth] DB error:', err.message);
    return false;
  }
}

// ── Exported middleware ─────────────────────────────────────────────────────

/**
 * requireSession — protects admin page routes.
 * Redirects to {ADMIN_SECRET_PATH}/login if no valid session cookie.
 */
function requireSession(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const session = token ? getSession(token) : null;

  if (!session) {
    // AJAX / API requests get a 401 JSON response
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    // Page requests get redirected to hidden admin login
    const adminPath = process.env.ADMIN_SECRET_PATH || '/x7k9m2p';
    return res.redirect(`${adminPath}/login`);
  }

  req.session = session; // attach for downstream use
  next();
}

/**
 * requireSessionAPI — protects write API endpoints.
 * Returns 401 JSON if no valid session cookie.
 */
function requireSessionAPI(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const session = token ? getSession(token) : null;

  if (!session) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  req.session = session;
  next();
}

/**
 * loginUser — validates credentials, creates session, returns token.
 * Handles rate limiting internally.
 */
async function loginUser(req, res) {
  const ip = getClientIP(req);

  // Rate limit check
  const rateCheck = isRateLimited(ip);
  if (rateCheck.limited) {
    res.set('Retry-After', String(rateCheck.retryAfter));
    return res.status(429).json({
      success: false,
      message: `Too many attempts. Try again in ${rateCheck.retryAfter}s.`,
    });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    recordLoginAttempt(ip);
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  const valid = await verifyCredentials(username, password);

  if (valid) {
    clearRateLimit(ip);
    const token = createSession(username);
    setSessionCookie(res, token);
    return res.json({ success: true, message: 'Login successful' });
  }

  const attempt = recordLoginAttempt(ip);
  const msg = attempt.blocked
    ? `Too many attempts. Try again in ${attempt.retryAfter}s.`
    : 'Invalid username or password';
  const status = attempt.blocked ? 429 : 401;
  return res.status(status).json({ success: false, message: msg });
}

/**
 * logoutUser — destroys session and clears cookie.
 */
function logoutUser(req, res) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (token) destroySession(token);
  clearSessionCookie(res);
  return res.json({ success: true, message: 'Logged out' });
}

module.exports = { requireSession, requireSessionAPI, loginUser, logoutUser };
