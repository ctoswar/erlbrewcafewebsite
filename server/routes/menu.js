// ─── Menu API Routes ────────────────────────────────────────────────────────
// GET  /api/menu          — public, returns all categories + items
// PUT  /api/menu/items/:id — admin, updates a single item's price
// ────────────────────────────────────────────────────────────────────────────

const express = require('express');
const db      = require('../db');
const router  = express.Router();

// ── GET /api/menu ──────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const pool = db.getPool();
    const [categories] = await pool.execute(
      'SELECT id, cat, ja FROM menu_categories ORDER BY sort_order ASC'
    );
    const [items] = await pool.execute(
      'SELECT id, category_id, name, price, sort_order FROM menu_items ORDER BY sort_order ASC'
    );

    // Group items by category_id
    const itemsByCat = {};
    for (const item of items) {
      if (!itemsByCat[item.category_id]) itemsByCat[item.category_id] = [];
      itemsByCat[item.category_id].push({
        id: item.id,
        name: item.name,
        price: item.price,
      });
    }

    const result = categories.map(c => ({
      id: c.id,
      cat: c.cat,
      ja: c.ja,
      items: itemsByCat[c.id] || [],
    }));

    res.json({ success: true, menu: result });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/menu/items/:id ────────────────────────────────────────────────
// Body: { price: 129 }
router.put('/items/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { price } = req.body;

    if (!Number.isInteger(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive integer' });
    }

    const pool = db.getPool();
    const [result] = await pool.execute(
      'UPDATE menu_items SET price = ? WHERE id = ?',
      [price, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, message: 'Price updated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
