// ─── Seasonal admin routes ─────────────────────────────────────────────────
// GET    /api/seasonal           — list all seasonal items (joined with menu_items)
// POST   /api/seasonal           — create new seasonal item (admin)
// PUT    /api/seasonal/:id       — update seasonal item (admin)
// DELETE /api/seasonal/:id       — delete seasonal item (admin)
// POST   /api/seasonal/:id/image — upload image for seasonal item (admin)

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');
const db      = require('../db');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer for seasonal images
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = req.params.id || 'new';
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = crypto.randomBytes(6).toString('hex');
    cb(null, `seasonal-${id}-${unique}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, AVIF`), false);
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// GET all seasonal items (admin list)
router.get('/', async (req, res, next) => {
  try {
    const pool = db.getPool();
    const [rows] = await pool.execute(
      `SELECT si.id, si.menu_item_id, si.season_name, si.start_date, si.end_date, si.tags, si.description, si.image_filename,
              mi.name, mi.price
       FROM seasonal_items si
       LEFT JOIN menu_items mi ON mi.id = si.menu_item_id
       ORDER BY si.start_date DESC, si.id DESC`
    );
    const results = (rows || []).map(r => ({
      id: r.id,
      menu_item_id: r.menu_item_id,
      season_name: r.season_name,
      start_date: r.start_date,
      end_date: r.end_date,
      tags: (r.tags || '').split(',').map(t => t.trim()).filter(Boolean),
      description: r.description || '',
      image_url: r.image_filename ? '/uploads/' + r.image_filename : null,
      name: r.name || '',
      price: r.price || null,
    }));
    res.json({ success: true, seasonal: results });
  } catch (err) { next(err); }
});

// POST create
router.post('/', async (req, res, next) => {
  try {
    const { menu_item_id, season_name, start_date, end_date, tags, description } = req.body || {};
    if (!menu_item_id || !season_name || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'menu_item_id, season_name, start_date and end_date are required' });
    }
    const pool = db.getPool();
    const [result] = await pool.execute(
      `INSERT INTO seasonal_items (menu_item_id, season_name, start_date, end_date, tags, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [menu_item_id, season_name, start_date, end_date, (tags || '').toString(), description || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
});

// PUT update
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { menu_item_id, season_name, start_date, end_date, tags, description } = req.body || {};
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const pool = db.getPool();

    // Validate menu_item_id exists
    const [itemCheck] = await pool.execute('SELECT id FROM menu_items WHERE id = ?', [menu_item_id]);
    if (itemCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const [result] = await pool.execute(
      `UPDATE seasonal_items SET menu_item_id = ?, season_name = ?, start_date = ?, end_date = ?, tags = ?, description = ? WHERE id = ?`,
      [menu_item_id, season_name, start_date, end_date, (tags || '').toString(), description || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    // Delete image file if exists
    const pool = db.getPool();
    const [rows] = await pool.execute('SELECT image_filename FROM seasonal_items WHERE id = ?', [id]);
    if (rows && rows[0] && rows[0].image_filename) {
      const f = path.join(UPLOAD_DIR, rows[0].image_filename);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    const [result] = await pool.execute('DELETE FROM seasonal_items WHERE id = ?', [id]);
    res.json({ success: true, deleted: result.affectedRows > 0 });
  } catch (err) { next(err); }
});

// POST image upload
router.post('/:id/image', (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    try {
      const id = parseInt(req.params.id, 10);
      const pool = db.getPool();
      // Delete old file if present
      const [rows] = await pool.execute('SELECT image_filename FROM seasonal_items WHERE id = ?', [id]);
      if (rows && rows[0] && rows[0].image_filename) {
        const old = path.join(UPLOAD_DIR, rows[0].image_filename);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      await pool.execute('UPDATE seasonal_items SET image_filename = ? WHERE id = ?', [req.file.filename, id]);
      res.json({ success: true, url: '/uploads/' + req.file.filename });
    } catch (e) { next(e); }
  });
});

module.exports = router;
