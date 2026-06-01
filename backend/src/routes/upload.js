const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9000 + 1000);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}_${random}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/exception/:inquiryNo', upload.array('photos', 10), (req, res) => {
  const { inquiryNo } = req.params;

  const exception = db.prepare('SELECT * FROM baggage_exceptions WHERE inquiry_no = ?').get(inquiryNo);
  if (!exception) {
    return res.status(404).json({ error: 'Exception not found' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const results = [];
  const stmt = db.prepare(`
    INSERT INTO exception_photos (exception_id, file_path, file_name, file_size)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((files) => {
    for (const file of files) {
      const result = stmt.run(
        exception.id,
        `/uploads/${file.filename}`,
        file.originalname,
        file.size
      );
      results.push({
        id: result.lastInsertRowid,
        file_path: `/uploads/${file.filename}`,
        file_name: file.originalname,
        file_size: file.size
      });
    }
  });

  insertMany(req.files);

  res.status(201).json({
    message: `Successfully uploaded ${results.length} photos`,
    photos: results
  });
});

router.get('/exception/:inquiryNo', (req, res) => {
  const { inquiryNo } = req.params;

  const exception = db.prepare('SELECT * FROM baggage_exceptions WHERE inquiry_no = ?').get(inquiryNo);
  if (!exception) {
    return res.status(404).json({ error: 'Exception not found' });
  }

  const photos = db.prepare(`
    SELECT * FROM exception_photos WHERE exception_id = ? ORDER BY uploaded_at DESC
  `).all(exception.id);

  res.json(photos);
});

router.delete('/:photoId', (req, res) => {
  const { photoId } = req.params;

  const photo = db.prepare('SELECT * FROM exception_photos WHERE id = ?').get(photoId);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const filePath = path.join(__dirname, '..', photo.file_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM exception_photos WHERE id = ?').run(photoId);

  res.json({ message: 'Photo deleted successfully' });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(400).json({ error: err.message });
});

module.exports = router;
