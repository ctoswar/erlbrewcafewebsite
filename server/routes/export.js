// ─── Export API Routes ─────────────────────────────────────────────────────
// GET /api/export/menu   — Export menu as CSV or JSON
// GET /api/export/hours  — Export business hours as CSV or JSON
// ────────────────────────────────────────────────────────────────────────────

const express = require('express');
const db      = require('../db');
const router  = express.Router();

// ── GET /api/export/menu ───────────────────────────────────────────────────
// Query params: ?format=csv (default) or ?format=json
router.get('/menu', async (req, res, next) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const menu = await db.getFullMenu();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="menu.json"');
      return res.json({ success: true, menu });
    }

    // CSV format
    const rows = [['Category', 'Category (JP)', 'Item', 'Price (PHP)']];
    for (const cat of menu) {
      for (const item of cat.items) {
        rows.push([cat.cat, cat.ja, item.name, item.price]);
      }
    }

    const csv = rows.map(row =>
      row.map(cell => {
        const val = String(cell).replace(/\r?\n/g, ' ').replace(/"/g, '""');
        return `"${/^[=+\-@\t\r]/.test(val) ? "'" : ''}${val}"`;
      }).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="menu.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/export/hours ──────────────────────────────────────────────────
// Query params: ?format=csv (default) or ?format=json
router.get('/hours', async (req, res, next) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const hours = await db.getAllHours();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="hours.json"');
      return res.json({ success: true, hours });
    }

    // CSV format
    const rows = [['Day', 'Hours', 'Highlighted']];
    for (const h of hours) {
      rows.push([h.day_label, h.hours_text, h.is_highlighted ? 'Yes' : 'No']);
    }

    const csv = rows.map(row =>
      row.map(cell => {
        const val = String(cell).replace(/\r?\n/g, ' ').replace(/"/g, '""');
        return `"${/^[=+\-@\t\r]/.test(val) ? "'" : ''}${val}"`;
      }).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hours.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
