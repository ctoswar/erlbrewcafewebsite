// ─── Seasonal Recommendations API ─────────────────────────────────────────
// POST /api/recommendations
// Body: { answers: { flavor: 'sweet', diet: 'vegan', occasion: 'morning' }, limit: 5 }
// Returns: { success:true, recommendations: [ { id, menu_item_id, name, price, description, image_url, match_score, tags } ] }

const express = require('express');
const db = require('../db');
const router = express.Router();

// Simple mapping from questionnaire answers -> tag keywords used in seasonal_items.tags
const ANSWER_TAG_MAP = {
  flavor: { sweet: 'sweet', savory: 'savory' },
  diet: {
    vegan: 'vegan',
    vegetarian: 'vegetarian',
    'gluten-free': 'gluten-free',
    glutenfree: 'gluten-free'
  },
  occasion: { morning: 'morning', afternoon: 'afternoon', evening: 'evening', dessert: 'dessert' }
};

// GET /api/recommendations?limit=3
// Returns currently active seasonal items (no questionnaire) — used for visible seasonal posts on the homepage
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '3', 10) || 3;
    const pool = db.getPool();
    // LIMIT cannot reliably be used as a prepared-statement parameter on some MySQL drivers,
    // so interpolate the validated integer directly (safe because 'limit' is numeric and capped).
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 3, 1), 50);
    const [rows] = await pool.execute(
      `SELECT si.id, si.menu_item_id, si.season_name, si.tags, si.description AS seasonal_description, si.image_filename,
              mi.name, mi.price, mi.sort_order
       FROM seasonal_items si
       JOIN menu_items mi ON mi.id = si.menu_item_id
       WHERE CURDATE() BETWEEN si.start_date AND si.end_date
       ORDER BY mi.sort_order ASC
       LIMIT ${safeLimit}`
    );

    const results = (rows || []).map(r => ({
      id: r.id,
      menu_item_id: r.menu_item_id,
      season_name: r.season_name,
      name: r.name,
      price: r.price,
      description: r.seasonal_description || '',
      image_url: r.image_filename ? '/uploads/' + r.image_filename : null,
      tags: (r.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    }));

    res.json({ success: true, recommendations: results });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { answers = {}, limit = 5 } = req.body || {};

    // Build tag list from answers using mapping
    const requestedTags = [];
    for (const k of Object.keys(answers || {})) {
      const v = (answers[k] || '').toString().toLowerCase().trim();
      if (!v) continue;
      const mapped = ANSWER_TAG_MAP[k] && ANSWER_TAG_MAP[k][v];
      if (mapped) requestedTags.push(mapped);
    }

    const pool = db.getPool();

    // Fetch active seasonal items joined with menu_items (to get name/price/sort_order)
    const [rows] = await pool.execute(
      `SELECT si.id, si.menu_item_id, si.season_name, si.tags, si.description AS seasonal_description, si.image_filename,
              mi.name, mi.price, mi.sort_order
       FROM seasonal_items si
       JOIN menu_items mi ON mi.id = si.menu_item_id
       WHERE CURDATE() BETWEEN si.start_date AND si.end_date`
    );

    // Score items by tag matches
    const items = (rows || []).map(r => {
      const tags = (r.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      let score = 0;
      for (const t of requestedTags) if (tags.includes(t)) score++;
      return Object.assign({}, r, { tags, match_score: score });
    });

    // Sort by match_score desc then by menu sort_order asc
    items.sort((a, b) => {
      if (b.match_score !== a.match_score) return b.match_score - a.match_score;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    const results = items.slice(0, Number(limit || 5)).map(i => ({
      id: i.id,
      menu_item_id: i.menu_item_id,
      name: i.name,
      price: i.price,
      description: i.seasonal_description || '',
      image_url: i.image_filename ? '/uploads/' + i.image_filename : null,
      match_score: i.match_score,
      tags: i.tags,
    }));

    res.json({ success: true, recommendations: results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
