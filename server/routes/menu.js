// ─── Menu API Routes ────────────────────────────────────────────────────────
// GET    /api/menu                  — public, returns all categories + items
// POST   /api/menu/categories       — admin, add a new category
// PUT    /api/menu/categories/:id   — admin, rename a category
// DELETE /api/menu/categories/:id   — admin, delete a category + its items
// POST   /api/menu/items            — admin, add a new item
// PUT    /api/menu/items/:id        — admin, update an item (name, price)
// DELETE /api/menu/items/:id        — admin, delete an item
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

// ── POST /api/menu/categories ──────────────────────────────────────────────
// Body: { cat: "Hot Coffee", ja: "ホットコーヒー" }
router.post('/categories', async (req, res, next) => {
  try {
    const { cat, ja } = req.body;
    if (!cat || typeof cat !== 'string' || cat.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const pool = db.getPool();
    // Get the next sort_order
    const [maxOrder] = await pool.execute('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM menu_categories');
    const sortOrder = maxOrder[0].next_order;

    const [result] = await pool.execute(
      'INSERT INTO menu_categories (cat, ja, sort_order) VALUES (?, ?, ?)',
      [cat.trim(), ja || '', sortOrder]
    );

    res.status(201).json({
      success: true,
      message: 'Category added',
      category: { id: result.insertId, cat: cat.trim(), ja: ja || '' },
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/menu/categories/:id ──────────────────────────────────────────
// Body: { cat: "Hot Coffee", ja: "ホットコーヒー" }
router.put('/categories/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { cat, ja } = req.body;

    if (!cat || typeof cat !== 'string' || cat.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const pool = db.getPool();
    const [result] = await pool.execute(
      'UPDATE menu_categories SET cat = ?, ja = ? WHERE id = ?',
      [cat.trim(), ja || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/menu/categories/:id ────────────────────────────────────────
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pool = db.getPool();

    // Delete all items in this category first
    await pool.execute('DELETE FROM menu_items WHERE category_id = ?', [id]);
    // Then delete the category
    const [result] = await pool.execute('DELETE FROM menu_categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category and its items deleted' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/menu/items ──────────────────────────────────────────────────
// Body: { category_id: 1, name: "Americano", price: 69 }
router.post('/items', async (req, res, next) => {
  try {
    const { category_id, name, price } = req.body;
    const catId = parseInt(category_id, 10);

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Item name is required' });
    }
    if (!Number.isInteger(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive integer' });
    }
    if (isNaN(catId)) {
      return res.status(400).json({ success: false, message: 'Valid category_id is required' });
    }

    const pool = db.getPool();

    // Verify category exists
    const [catCheck] = await pool.execute('SELECT id FROM menu_categories WHERE id = ?', [catId]);
    if (catCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Get next sort_order within category
    const [maxOrder] = await pool.execute(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM menu_items WHERE category_id = ?',
      [catId]
    );

    const [result] = await pool.execute(
      'INSERT INTO menu_items (category_id, name, price, sort_order) VALUES (?, ?, ?, ?)',
      [catId, name.trim(), price, maxOrder[0].next_order]
    );

    res.status(201).json({
      success: true,
      message: 'Item added',
      item: { id: result.insertId, category_id: catId, name: name.trim(), price },
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/menu/items/:id ────────────────────────────────────────────────
// Body: { name: "Americano", price: 69 }  — both optional, at least one required
router.put('/items/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, price } = req.body;

    // Build dynamic UPDATE
    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Item name cannot be empty' });
      }
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (price !== undefined) {
      if (!Number.isInteger(price) || price < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a positive integer' });
      }
      updates.push('price = ?');
      params.push(price);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    params.push(id);
    const pool = db.getPool();
    const [result] = await pool.execute(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, message: 'Item updated' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/menu/items/:id ────────────────────────────────────────────
router.delete('/items/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pool = db.getPool();
    const [result] = await pool.execute('DELETE FROM menu_items WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
