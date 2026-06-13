import { Router } from 'express';
import db from '../db';
import type { AfterSaleClaim } from '../../shared/types';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = Router();

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

function generateClaimId(): string {
  return 'cl' + Math.random().toString(36).slice(2, 10);
}

router.get('/', (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const rows = db
    .prepare('SELECT * FROM after_sale_claims WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as any[];
  const claims: AfterSaleClaim[] = rows.map((r) => ({
    id: r.id,
    waybillId: r.waybill_id,
    userId: r.user_id,
    type: r.type,
    amount: r.amount,
    description: r.description,
    images: r.images ? JSON.parse(r.images) : [],
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(claims);
});

router.post('/', (req, res) => {
  const { waybillId, type, amount, description, userId = 1 } = req.body;
  const id = generateClaimId();
  db.prepare(
    'INSERT INTO after_sale_claims (id, waybill_id, user_id, type, amount, description, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, waybillId, userId, type, amount, description, '[]', 'pending');
  const row = db.prepare('SELECT * FROM after_sale_claims WHERE id = ?').get(id) as any;
  const claim: AfterSaleClaim = {
    id: row.id,
    waybillId: row.waybill_id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    description: row.description,
    images: row.images ? JSON.parse(row.images) : [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  res.status(201).json(claim);
});

router.post('/:id/upload', upload.array('images', 9), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT images FROM after_sale_claims WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: '申诉不存在' });
  const images: string[] = existing.images ? JSON.parse(existing.images) : [];
  if (req.files) {
    (req.files as Express.Multer.File[]).forEach((f) => {
      images.push(`/uploads/${f.filename}`);
    });
  }
  db.prepare('UPDATE after_sale_claims SET images = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
    JSON.stringify(images),
    'reviewing',
    id
  );
  res.json({ images });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM after_sale_claims WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: '申诉不存在' });
  const waybill = db.prepare('SELECT tracking_no, status FROM waybills WHERE id = ?').get(row.waybill_id) as any;
  const timeline = [
    { status: 'pending', label: '已提交', time: row.created_at, done: true },
    { status: 'reviewing', label: '审核中', time: row.updated_at, done: ['reviewing', 'approved', 'paid'].includes(row.status) },
    { status: 'approved', label: '审核通过', time: row.updated_at, done: ['approved', 'paid'].includes(row.status) },
    { status: 'paid', label: '已打款', time: row.updated_at, done: row.status === 'paid' },
  ];
  const claim: AfterSaleClaim = {
    id: row.id,
    waybillId: row.waybill_id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    description: row.description,
    images: row.images ? JSON.parse(row.images) : [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  res.json({ claim, waybill, timeline });
});

export default router;
