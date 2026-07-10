// ─── MySQL Connection Pool ─────────────────────────────────────────────────
const mysql = require('mysql2/promise');

let pool = null;

/**
 * Get the MySQL connection pool (singleton).
 * Creates the pool on first call.
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '192.168.75.101',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'erlbrew',
      password: process.env.DB_PASSWORD || 'erlbrew_prod_2026',
      database: process.env.DB_NAME || 'erlbrew',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
}

/**
 * Test the database connection by running SELECT 1.
 * Throws if the connection fails.
 */
async function testConnection() {
  const conn = await getPool().getConnection();
  try {
    await conn.execute('SELECT 1 AS ok');
  } finally {
    conn.release();
  }
}

/**
 * Ensure the gallery_photos table exists.
 * This requires CREATE privilege — it is called during server start but
 * failures are non-fatal (the table should already exist from init.sql).
 * Logs a warning if the table cannot be created automatically.
 */
async function ensureTable() {
  let conn;
  try {
    conn = await getPool().getConnection();
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS gallery_photos (
        slot INT UNSIGNED NOT NULL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) DEFAULT NULL,
        mime_type VARCHAR(50) DEFAULT NULL,
        file_size INT UNSIGNED DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[DB] gallery_photos table ready');

    // About photo table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS about_photo (
        id INT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) DEFAULT NULL,
        mime_type VARCHAR(50) DEFAULT NULL,
        file_size INT UNSIGNED DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[DB] about_photo table ready');

    // Business hours table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS business_hours (
        id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
        day_label VARCHAR(100) NOT NULL,
        hours_text VARCHAR(100) NOT NULL DEFAULT '',
        is_highlighted TINYINT(1) NOT NULL DEFAULT 0,
        sort_order INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // Seed default hours if table is empty
    const [existing] = await conn.execute('SELECT COUNT(*) AS cnt FROM business_hours');
    if (existing[0].cnt === 0) {
      await conn.execute(`INSERT INTO business_hours (day_label, hours_text, is_highlighted, sort_order) VALUES
        ('Monday – Friday', '7:00 AM – 8:00 PM', 0, 1),
        ('Saturday',       '7:00 AM – 9:00 PM', 0, 2),
        ('Sunday',         '8:00 AM – 7:00 PM', 0, 3),
        ('Holidays',       'Check our socials',  1, 4)
      `);
      console.log('[DB] business_hours seeded with defaults');
    }
    console.log('[DB] business_hours table ready');

    // Event inquiries table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS event_inquiries (
        id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(200) NOT NULL,
        event_type VARCHAR(100) NOT NULL DEFAULT '',
        event_date DATE DEFAULT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[DB] event_inquiries table ready');
  } catch (err) {
    // Non-fatal: the table must already exist from init.sql.
    // The erlbrew user may not have CREATE privilege.
    console.warn('[DB] Could not auto-create table (expected if app user lacks CREATE).');
    console.warn('[DB] Ensure init.sql was run as root. Error:', err.message);
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Get all gallery photos.
 * Returns an object mapping slot -> photo info.
 */
async function getAllPhotos() {
  const [rows] = await getPool().execute(
    'SELECT slot, filename, original_name, mime_type FROM gallery_photos ORDER BY slot ASC'
  );
  const result = {};
  for (const row of rows) {
    result[row.slot] = {
      filename: row.filename,
      url: '/uploads/' + row.filename,
      original_name: row.original_name,
      mime_type: row.mime_type,
    };
  }
  return result;
}

/**
 * Upsert a gallery photo record.
 */
async function upsertPhoto(slot, filename, originalName, mimeType, fileSize) {
  await getPool().execute(
    `INSERT INTO gallery_photos (slot, filename, original_name, mime_type, file_size)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       filename = VALUES(filename),
       original_name = VALUES(original_name),
       mime_type = VALUES(mime_type),
       file_size = VALUES(file_size)`,
    [slot, filename, originalName, mimeType, fileSize]
  );
}

/**
 * Delete a gallery photo record.
 * Returns true if a row was deleted.
 */
async function deletePhoto(slot) {
  const [result] = await getPool().execute(
    'DELETE FROM gallery_photos WHERE slot = ?',
    [slot]
  );
  return result.affectedRows > 0;
}

// ═════════════════════════════════════════════════════════════════════════════
// ABOUT PHOTO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get the about photo.
 * Returns { filename, url, ... } or null.
 */
async function getAboutPhoto() {
  const [rows] = await getPool().execute(
    'SELECT filename, original_name, mime_type, file_size FROM about_photo WHERE id = 1'
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    filename: row.filename,
    url: '/uploads/' + row.filename,
    original_name: row.original_name,
    mime_type: row.mime_type,
    file_size: row.file_size,
  };
}

/**
 * Upsert the about photo (singleton row id=1).
 */
async function upsertAboutPhoto(filename, originalName, mimeType, fileSize) {
  await getPool().execute(
    `INSERT INTO about_photo (id, filename, original_name, mime_type, file_size)
     VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       filename = VALUES(filename),
       original_name = VALUES(original_name),
       mime_type = VALUES(mime_type),
       file_size = VALUES(file_size)`,
    [filename, originalName, mimeType, fileSize]
  );
}

/**
 * Delete the about photo.
 */
async function deleteAboutPhoto() {
  const [result] = await getPool().execute('DELETE FROM about_photo WHERE id = 1');
  return result.affectedRows > 0;
}

// ═════════════════════════════════════════════════════════════════════════════
// BUSINESS HOURS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get all business hours, ordered by sort_order.
 */
async function getAllHours() {
  const [rows] = await getPool().execute(
    'SELECT id, day_label, hours_text, is_highlighted, sort_order FROM business_hours ORDER BY sort_order ASC'
  );
  return rows;
}

/**
 * Update a single business hours entry.
 */
async function updateHour(id, dayLabel, hoursText, isHighlighted) {
  await getPool().execute(
    'UPDATE business_hours SET day_label = ?, hours_text = ?, is_highlighted = ? WHERE id = ?',
    [dayLabel, hoursText, isHighlighted ? 1 : 0, id]
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EVENT INQUIRIES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Create a new event inquiry.
 */
async function createInquiry(name, email, eventType, eventDate, message) {
  const [result] = await getPool().execute(
    `INSERT INTO event_inquiries (name, email, event_type, event_date, message)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, eventType, eventDate || null, message]
  );
  return result.insertId;
}

/**
 * Get all event inquiries, newest first.
 */
async function getAllInquiries() {
  const [rows] = await getPool().execute(
    'SELECT id, name, email, event_type, event_date, message, is_read, created_at FROM event_inquiries ORDER BY created_at DESC'
  );
  return rows;
}

/**
 * Delete an event inquiry.
 */
async function deleteInquiry(id) {
  const [result] = await getPool().execute('DELETE FROM event_inquiries WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Mark an inquiry as read.
 */
async function markInquiryRead(id) {
  await getPool().execute('UPDATE event_inquiries SET is_read = 1 WHERE id = ?', [id]);
}

module.exports = {
  getPool,
  testConnection,
  ensureTable,
  getAllPhotos,
  upsertPhoto,
  deletePhoto,
  getAboutPhoto,
  upsertAboutPhoto,
  deleteAboutPhoto,
  getAllHours,
  updateHour,
  createInquiry,
  getAllInquiries,
  deleteInquiry,
  markInquiryRead,
};
