// ─── Event Inquiry Routes ────────────────────────────────────────────────────
// POST  /api/events/inquiries       — public, submit an inquiry
// GET   /api/events/inquiries       — admin, list all inquiries
// PUT   /api/events/inquiries/:id/read — admin, mark as read
// DELETE /api/events/inquiries/:id  — admin, delete an inquiry
// ────────────────────────────────────────────────────────────────────────────

const express = require('express');
const db      = require('../db');
const router  = express.Router();

// ── POST /api/events/inquiries ──────────────────────────────────────────────
// Public — no auth required. Body: { name, email, event_type, event_date, message }
router.post('/inquiries', async (req, res, next) => {
  try {
    const { name, email, event_type, event_date, message } = req.body;

    // Validate
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const id = await db.createInquiry(
      name.trim(),
      email.trim(),
      (event_type || '').trim(),
      event_date || null,
      message.trim()
    );

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted! We\'ll get back to you soon.',
      id,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/events/inquiries ───────────────────────────────────────────────
// Admin — returns all inquiries newest-first
router.get('/inquiries', async (req, res, next) => {
  try {
    const inquiries = await db.getAllInquiries();
    res.json({ success: true, inquiries });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/events/inquiries/:id/read ──────────────────────────────────────
// Admin — mark as read
router.put('/inquiries/:id/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.markInquiryRead(id);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/events/inquiries/:id ────────────────────────────────────────
// Admin — delete an inquiry
router.delete('/inquiries/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await db.deleteInquiry(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, message: 'Inquiry deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
