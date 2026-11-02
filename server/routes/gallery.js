// ─── Gallery API Routes ────────────────────────────────────────────────────
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');
const sharp   = require('sharp');
const db      = require('../db');

const router = express.Router();

// ── Multer config: store uploaded images in server/uploads/ ────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const slot = req.params.slot;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    cb(null, `slot-${slot}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, AVIF`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── GET /api/gallery ───────────────────────────────────────────────────────
// Returns all gallery photos as { slot: { url, filename, ... }, ... }
router.get('/', async (req, res, next) => {
  try {
    const photos = await db.getAllPhotos();
    res.json({ success: true, photos });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/gallery/:slot ───────────────────────────────────────────────
// Upload a photo for a specific slot (0-4)
router.post('/:slot', (req, res, next) => {
  const slot = parseInt(req.params.slot, 10);
  if (isNaN(slot) || slot < 0 || slot > 4) {
    return res.status(400).json({ success: false, message: 'Slot must be 0-4' });
  }

  upload.single('photo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, message: 'File too large. Max 50 MB.' });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "photo".' });
    }

    try {
      // Delete old photo file if it exists
      const oldPhotos = await db.getAllPhotos();
      if (oldPhotos[slot]) {
        const oldPath = path.join(UPLOAD_DIR, oldPhotos[slot].filename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Resize + convert to WebP using sharp for optimization.
      // Without the resize a phone camera photo arrives at 4000-6000px and is decoded
      // into a ~100MB texture that the compositor has to move on every scroll frame —
      // that is what made scrolling below the gallery drop frames. The largest slot
      // renders ~640px tall, so 1600px on the long edge is ~2.5x retina with headroom.
      const MAX_EDGE = 1600;
      const webpFilename = `slot-${slot}-${crypto.randomBytes(6).toString('hex')}.webp`;
      const webpPath = path.join(UPLOAD_DIR, webpFilename);

      await sharp(req.file.path)
        .rotate()                                   // honour EXIF orientation before resizing
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(webpPath);

      // Remove original file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      await db.upsertPhoto(
        slot,
        webpFilename,
        req.file.originalname,
        'image/webp',
        fs.statSync(webpPath).size
      );

      res.json({
        success: true,
        slot,
        url: `/uploads/${webpFilename}`,
      });
    } catch (dbErr) {
      next(dbErr);
    }
  });
});

// ── DELETE /api/gallery/:slot ─────────────────────────────────────────────
// Remove a photo from a slot
router.delete('/:slot', async (req, res, next) => {
  try {
    const slot = parseInt(req.params.slot, 10);
    if (isNaN(slot) || slot < 0 || slot > 4) {
      return res.status(400).json({ success: false, message: 'Slot must be 0-4' });
    }

    const photos = await db.getAllPhotos();
    if (photos[slot]) {
      const filePath = path.join(UPLOAD_DIR, photos[slot].filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const deleted = await db.deletePhoto(slot);
    res.json({ success: true, deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
