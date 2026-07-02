// ─── About Photo API Routes ────────────────────────────────────────────────
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');
const db      = require('../db');

const router = express.Router();

// ── Multer config ───────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    cb(null, `about-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, AVIF`), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

// ── GET /api/about/photo ────────────────────────────────────────────────────
router.get('/photo', async (req, res, next) => {
  try {
    const photo = await db.getAboutPhoto();
    if (!photo) return res.json({ success: true, photo: null });
    res.json({ success: true, photo });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/about/photo ───────────────────────────────────────────────────
router.post('/photo', (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, message: 'File too large. Max 15 MB.' });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "photo".' });
    }

    try {
      // Delete old photo file
      const old = await db.getAboutPhoto();
      if (old) {
        const oldPath = path.join(UPLOAD_DIR, old.filename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await db.upsertAboutPhoto(
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );

      res.json({
        success: true,
        url: `/uploads/${req.file.filename}`,
      });
    } catch (dbErr) {
      next(dbErr);
    }
  });
});

// ── DELETE /api/about/photo ─────────────────────────────────────────────────
router.delete('/photo', async (req, res, next) => {
  try {
    const old = await db.getAboutPhoto();
    if (old) {
      const filePath = path.join(UPLOAD_DIR, old.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.deleteAboutPhoto();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
