// ─── Menu DB Setup & Seed ──────────────────────────────────────────────────
// Run: node bin/setup-menu-db.js
// Creates menu_categories + menu_items tables and seeds from hardcoded data.
// ────────────────────────────────────────────────────────────────────────────

const mysql = require('mysql2/promise');

const MENU = [
  {
    cat:'Hot Coffee', ja:'ホットコーヒー',
    items:[
      {name:'Americano 8oz',              p:69},
      {name:'Americano 12oz',             p:89},
      {name:'Dark Mocha 8oz',             p:109},
      {name:'Dark Mocha 12oz',            p:129},
      {name:'Café Latte 8oz',             p:109},
      {name:'Café Latte 12oz',            p:129},
      {name:'Cappuccino 8oz',             p:109},
      {name:'Cappuccino 12oz',            p:129},
      {name:'Hot Mocha 8oz',              p:109},
      {name:'Hot Mocha 12oz',             p:129},
      {name:'Chocolate 8oz',              p:109},
      {name:'Chocolate 12oz',             p:129},
      {name:'White Chocolate Mocha 8oz',  p:109},
      {name:'White Chocolate Mocha 12oz', p:129},
      {name:'Matcha Latte 8oz',           p:119},
      {name:'Matcha Latte 12oz',          p:139},
      {name:'Spanish Latte 8oz',          p:109},
      {name:'Spanish Latte 12oz',         p:129},
      {name:'Hazelnut Flavored Latte 8oz',p:109},
      {name:'Hazelnut Flavored Latte 12oz',p:139},
      {name:'Vanilla Flavored Latte 8oz', p:109},
      {name:'Vanilla Flavored Latte 12oz',p:139},
      {name:'Caramel Flavored Latte 8oz', p:109},
      {name:'Caramel Flavored Latte 12oz',p:139},
    ]
  },
  {
    cat:'Iced Coffee', ja:'アイスコーヒー',
    items:[
      {name:'Iced Americano',           p:99},
      {name:'Iced Latte',               p:119},
      {name:'Iced Flavored Latte',      p:149},
      {name:'Iced Salted Caramel Latte',p:149},
      {name:'Iced White Chocolate Mocha',p:149},
      {name:'Iced Dark Chocolate Mocha', p:149},
      {name:'Iced Spanish Latte',       p:149},
      {name:'Iced Caramel Macchiato',   p:149},
      {name:'Iced Dirty Matcha Latte',  p:149},
      {name:'Iced Coconut Americano',   p:149},
    ]
  },
  {
    cat:'Non-Coffee', ja:'ノンコーヒー',
    items:[
      {name:'Dark Choco 16oz',        p:169},
      {name:'Matcha Latte 16oz',      p:149},
      {name:'Matcha Strawberry 16oz', p:159},
      {name:'Matcha Blueberry 16oz',  p:159},
      {name:'Iced Blueberry Cream 16oz',p:149},
      {name:'Iced Strawberry Cream 16oz',p:149},
    ]
  },
  {
    cat:'Ice Blended', ja:'アイスブレンド',
    items:[
      {name:'Chocolate 16oz',      p:159},
      {name:'Chocolate 22oz',      p:179},
      {name:'Mocha 16oz',          p:159},
      {name:'Mocha 22oz',          p:179},
      {name:'Matcha 16oz',         p:159},
      {name:'Matcha 22oz',         p:179},
      {name:'Caramel 16oz',        p:159},
      {name:'Caramel 22oz',        p:179},
      {name:'Java Chip 16oz',      p:159},
      {name:'Java Chip 22oz',      p:179},
      {name:'Strawberry Cream 16oz',p:159},
      {name:'Strawberry cream 22oz',p:179},
      {name:'Blueberry Cream 16oz', p:159},
      {name:'Blueberry Cream 22oz', p:179},
    ]
  },
  {
    cat:'Fruit Soda', ja:'フルーツソーダ',
    items:[
      {name:'FS Strawberry', p:129},
      {name:'FS Lychee',     p:129},
      {name:'FS Blueberry',  p:129},
      {name:'FS Lemon',      p:129},
    ]
  },
  {
    cat:'Pastries & Food', ja:'ペストリー',
    items:[
      {name:'Cookies',                        p:35},
      {name:'Ensaymada Small',               p:45},
      {name:'Ensaymada',                     p:90},
      {name:'Chicken Sandwich',              p:45},
      {name:'Croissant',                     p:110},
      {name:'Choco Banana',                  p:129},
      {name:'Banana Caramel Croffles',       p:139},
      {name:'Strawberry Cream Croffles',     p:119},
      {name:'S\'mores Croffles',             p:139},
      {name:'Choco Oreo Croffles',           p:139},
      {name:'Chocolate Strawberry Cream Croffles', p:129},
      {name:'Biscoff Croffles',              p:149},
    ]
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: '192.168.75.101',
    port: 3306,
    user: 'erlbrew',
    password: 'erlbrew_prod_2026',
    database: 'erlbrew'
  });

  console.log('[OK] Connected');

  // Create menu_categories table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
      cat VARCHAR(100) NOT NULL,
      ja VARCHAR(100) NOT NULL DEFAULT '',
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[OK] menu_categories table ready');

  // Create menu_items table (no FK — app handles integrity)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
      category_id INT UNSIGNED NOT NULL,
      name VARCHAR(255) NOT NULL,
      price INT UNSIGNED NOT NULL DEFAULT 0,
      sort_order INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[OK] menu_items table ready');

  // Seed categories + items
  for (let ci = 0; ci < MENU.length; ci++) {
    const cat = MENU[ci];
    // Insert or get category
    const [catResult] = await conn.execute(
      'INSERT INTO menu_categories (cat, ja, sort_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ja = VALUES(ja)',
      [cat.cat, cat.ja, ci]
    );
    const catId = catResult.insertId;

    // Get the actual category id
    const [catRows] = await conn.execute('SELECT id FROM menu_categories WHERE cat = ?', [cat.cat]);
    const cId = catRows[0].id;

    // Delete existing items for this category and re-insert
    await conn.execute('DELETE FROM menu_items WHERE category_id = ?', [cId]);

    for (let ii = 0; ii < cat.items.length; ii++) {
      const item = cat.items[ii];
      await conn.execute(
        'INSERT INTO menu_items (category_id, name, price, sort_order) VALUES (?, ?, ?, ?)',
        [cId, item.name, item.p, ii]
      );
    }
    console.log(`  Seeded: ${cat.cat} (${cat.items.length} items)`);
  }

  // Verify
  const [cats] = await conn.execute('SELECT id, cat, ja FROM menu_categories ORDER BY sort_order');
  for (const c of cats) {
    const [items] = await conn.execute('SELECT COUNT(*) AS cnt FROM menu_items WHERE category_id = ?', [c.id]);
    console.log(`  ${c.cat} (${c.ja}): ${items[0].cnt} items`);
  }

  await conn.end();
  console.log('[OK] Done');
}

main().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
