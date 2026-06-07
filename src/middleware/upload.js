const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const url = String(req.originalUrl || '');
    let sub = 'requests';
    if (url.includes('/chats/')) sub = 'chats';
    else if (url.includes('/meters')) sub = 'meters';
    const dir = path.join(UPLOAD_DIR, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  ['image/jpeg','image/png','image/webp'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPEG/PNG/WEBP images allowed'), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }
});
