import express, { type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db } from '../db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const router = express.Router();

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未上传文件' });
    }

    const { application_id, doc_type, doc_name, uploaded_by } = req.body;

    const result = db.prepare(`
      INSERT INTO supplementary_docs (application_id, doc_type, doc_name, file_path, file_size, uploaded_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(application_id, doc_type, doc_name, req.file.filename, req.file.size, uploaded_by || 1);

    db.prepare('INSERT INTO audit_logs (application_id, user_id, action, action_details) VALUES (?, ?, ?, ?)')
      .run(application_id, uploaded_by || 1, 'upload_document', JSON.stringify({ doc_name, doc_type }));

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        filename: req.file.filename
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/:applicationId', (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const docs = db.prepare(`
      SELECT sd.*, u.name as uploaded_name, ur.name as reviewed_name
      FROM supplementary_docs sd
      LEFT JOIN users u ON sd.uploaded_by = u.id
      LEFT JOIN users ur ON sd.reviewed_by = ur.id
      WHERE sd.application_id = ?
      ORDER BY sd.uploaded_at DESC
    `).all(applicationId);

    res.json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/:id/review', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, review_notes, reviewed_by } = req.body;

    db.prepare(`
      UPDATE supplementary_docs
      SET status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, review_notes, reviewed_by || 1, id);

    const doc = db.prepare('SELECT application_id, doc_name FROM supplementary_docs WHERE id = ?').get(id) as any;
    db.prepare('INSERT INTO audit_logs (application_id, user_id, action, action_details) VALUES (?, ?, ?, ?)')
      .run(doc.application_id, reviewed_by || 1, 'review_document', JSON.stringify({ doc_name: doc.doc_name, status, review_notes }));

    res.json({ success: true, message: '资料审核完成' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/supplement-request', (req: Request, res: Response) => {
  try {
    const { application_id, requested_by, request_notes, required_docs } = req.body;

    const result = db.prepare(`
      INSERT INTO supplement_requests (application_id, requested_by, request_notes, required_docs, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(application_id, requested_by || 1, request_notes, JSON.stringify(required_docs));

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('supplementary', application_id);

    db.prepare('INSERT INTO audit_logs (application_id, user_id, action, action_details) VALUES (?, ?, ?, ?)')
      .run(application_id, requested_by || 1, 'request_supplement', JSON.stringify({ request_notes, required_docs }));

    res.json({
      success: true,
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/supplement-requests/:applicationId', (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const requests = db.prepare(`
      SELECT sr.*, u.name as requested_name
      FROM supplement_requests sr
      LEFT JOIN users u ON sr.requested_by = u.id
      WHERE sr.application_id = ?
      ORDER BY sr.created_at DESC
    `).all(applicationId);

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/supplement-requests/:id/respond', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    db.prepare(`
      UPDATE supplement_requests
      SET status = 'submitted', responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    const request = db.prepare('SELECT application_id FROM supplement_requests WHERE id = ?').get(id) as any;
    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('underwriting', request.application_id);

    db.prepare('INSERT INTO audit_logs (application_id, user_id, action, action_details) VALUES (?, ?, ?, ?)')
      .run(request.application_id, 1, 'submit_supplement', JSON.stringify({ request_id: id }));

    res.json({ success: true, message: '补充资料已提交' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/download/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
