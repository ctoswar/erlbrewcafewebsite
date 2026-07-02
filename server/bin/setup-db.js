// ─── Database Setup Script ─────────────────────────────────────────────────
// Run ONCE with a MySQL user that has CREATE privilege (e.g. root).
// Creates the gallery_photos table if it doesn't exist.
//
// Usage:
//   node bin/setup-db.js
//
// Or with custom credentials:
//   DB_USER=root DB_PASSWORD=yourpass node bin/setup-db.js
// ────────────────────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

async function setup() {
  const host = process.env.DB_HOST || '192.168.75.101';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'erlbrew';
  const password = process.env.DB_PASSWORD || 'erlbrew_prod_2026';
  const database = process.env.DB_NAME || 'erlbrew';

  console.log(`Connecting to ${host}:${port} as ${user}...`);

  const conn = await mysql.createConnection({ host, port, user, password, database });

  try {
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
    console.log('[OK] gallery_photos table is ready.');

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
    console.log('[OK] about_photo table is ready.');

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

    const [existing] = await conn.execute('SELECT COUNT(*) AS cnt FROM business_hours');
    if (existing[0].cnt === 0) {
      await conn.execute(`INSERT INTO business_hours (day_label, hours_text, is_highlighted, sort_order) VALUES
        ('Monday – Friday', '7:00 AM – 8:00 PM', 0, 1),
        ('Saturday',       '7:00 AM – 9:00 PM', 0, 2),
        ('Sunday',         '8:00 AM – 7:00 PM', 0, 3),
        ('Holidays',       'Check our socials',  1, 4)
      `);
    }
    console.log('[OK] business_hours table is ready.');
  } finally {
    await conn.end();
  }

  process.exit(0);
}

setup().catch(err => {
  console.error('[FAILED]', err.message);
  process.exit(1);
});
