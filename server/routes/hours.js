// ─── Business Hours API Routes ──────────────────────────────────────────────
const express = require('express');
const db      = require('../db');

const router = express.Router();

// ── GET /api/hours ──────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const hours = await db.getAllHours();
    res.json({ success: true, hours });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/hours/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const { day_label, hours_text, is_highlighted } = req.body;
    if (!day_label || day_label.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'day_label is required' });
    }
    await db.updateHour(id, day_label.trim(), (hours_text || '').trim(), !!is_highlighted);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
