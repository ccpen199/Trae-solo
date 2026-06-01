import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import db from '../database';
import { authenticate } from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  },
});

const PHOTO_CATEGORIES = [
  'accident_overview',
  'vehicle_damage',
  'vin_number',
  'id_card',
  'driver_license',
  'vehicle_license',
  'other',
];

const REQUIRED_CATEGORIES = ['accident_overview', 'vehicle_damage', 'vin_number'];

router.get('/:taskId', authenticate, (req, res) => {
  const photos = db.prepare(`
    SELECT p.*, u.name as uploader_name
    FROM photos p
    LEFT JOIN users u ON p.uploaded_by = u.id
    WHERE p.task_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.taskId);

  res.json(photos);
});

router.post('/:taskId', authenticate, upload.array('photos', 20), (req, res) => {
  const taskId = req.params.taskId;
  const { category, latitude, longitude, location_address, watermark_info, shoot_time } = req.body;

  if (!PHOTO_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: '无效的照片分类' });
  }

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: '请选择要上传的照片' });
  }

  const results = [];

  for (const file of req.files) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO photos (
        id, task_id, category, file_path, file_name, file_size,
        latitude, longitude, location_address, watermark_info, shoot_time, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      taskId,
      category,
      `/uploads/${file.filename}`,
      file.originalname,
      file.size,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      location_address || null,
      watermark_info || null,
      shoot_time || new Date().toISOString(),
      req.user!.id
    );

    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
    results.push(photo);
  }

  res.status(201).json(results);
});

router.post('/:taskId/retake/:photoId', authenticate, upload.single('photo'), (req, res) => {
  const taskId = req.params.taskId;
  const photoId = req.params.photoId;
  const { retake_reason } = req.body;

  const originalPhoto = db.prepare('SELECT * FROM photos WHERE id = ? AND task_id = ?').get(photoId, taskId);
  if (!originalPhoto) {
    return res.status(404).json({ error: '原始照片不存在' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的照片' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO photos (
      id, task_id, category, file_path, file_name, file_size,
      latitude, longitude, location_address, watermark_info, shoot_time,
      is_retake, original_photo_id, retake_reason, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    taskId,
    (originalPhoto as any).category,
    `/uploads/${req.file.filename}`,
    req.file.originalname,
    req.file.size,
    req.body.latitude ? parseFloat(req.body.latitude) : null,
    req.body.longitude ? parseFloat(req.body.longitude) : null,
    req.body.location_address || null,
    req.body.watermark_info || null,
    req.body.shoot_time || new Date().toISOString(),
    1,
    photoId,
    retake_reason || '补拍',
    req.user!.id
  );

  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
  res.status(201).json(photo);
});

router.get('/:taskId/required-check', authenticate, (req, res) => {
  const taskId = req.params.taskId;
  const photos = db.prepare('SELECT DISTINCT category FROM photos WHERE task_id = ?').all(taskId) as { category: string }[];
  const existingCategories = photos.map(p => p.category);

  const missingCategories = REQUIRED_CATEGORIES.filter(cat => !existingCategories.includes(cat));

  res.json({
    has_all_required: missingCategories.length === 0,
    missing_categories: missingCategories,
    required_categories: REQUIRED_CATEGORIES,
  });
});

router.delete('/:photoId', authenticate, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.photoId);
  if (!photo) {
    return res.status(404).json({ error: '照片不存在' });
  }

  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.photoId);
  res.json({ success: true });
});

export default router;
