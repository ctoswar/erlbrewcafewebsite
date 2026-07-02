const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function main() {
  const conn = await mysql.createConnection({
    host: '192.168.75.101',
    port: 3306,
    user: 'erlbrew',
    password: 'erlbrew_prod_2026',
    database: 'erlbrew'
  });

  console.log('[OK] Connected to MySQL');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[OK] admin_users table created');

  const hash = await bcrypt.hash('gameclub11', 12);

  await conn.execute(
    'INSERT INTO admin_users (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
    ['ctos', hash]
  );
  console.log('[OK] Admin user inserted: ctos / gameclub11');

  const [rows] = await conn.execute('SELECT id, username, LEFT(password_hash, 30) AS hash_prefix FROM admin_users');
  console.log('Admin users in DB:', JSON.stringify(rows, null, 2));

  await conn.end();
  console.log('[OK] Done');
}

main().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
