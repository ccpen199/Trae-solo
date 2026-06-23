import { Router } from 'express';
import multer from 'multer';
import { pdfService } from '../services/PdfService';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传PDF文件'));
    }
  }
});

const linkSchema = z.object({
  itemIds: z.array(z.string())
});

router.get('/', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { cityId } = req.query;
  
  if (!cityId) {
    res.status(400).json({ error: '缺少 cityId 参数' });
    return;
  }

  const docs = pdfService.getPdfList(String(cityId));
  res.json({ docs });
});

router.get('/:id', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const doc = pdfService.getPdfById(id);
  
  if (!doc) {
    res.status(404).json({ error: 'PDF文档不存在' });
    return;
  }

  res.json({ doc });
});

router.post('/upload', authMiddleware, requireRole(['district_admin', 'municipal_admin']), upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: '请上传PDF文件' });
    return;
  }

  const { cityId, version } = req.body;
  
  if (!cityId || !req.admin) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  try {
    const doc = await pdfService.uploadPdf(
      req.file,
      String(cityId),
      req.admin.id,
      version || '1.0'
    );
    res.json({ success: true, doc });
  } catch (err) {
    console.error('PDF upload error:', err);
    res.status(500).json({ error: 'PDF上传失败' });
  }
});

router.post('/link/:pdfId', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { pdfId } = req.params;
  const parseResult = linkSchema.safeParse(req.body);
  
  if (!parseResult.success) {
    res.status(400).json({ error: '参数错误', details: parseResult.error.errors });
    return;
  }

  const success = pdfService.linkItems(pdfId, parseResult.data.itemIds);
  res.json({ success });
});

router.post('/unlink/:pdfId', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { pdfId } = req.params;
  const { itemId } = req.body;
  
  if (!itemId) {
    res.status(400).json({ error: '缺少 itemId 参数' });
    return;
  }

  const success = pdfService.unlinkItem(pdfId, String(itemId));
  res.json({ success });
});

router.delete('/:id', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const success = pdfService.deletePdf(id);
  res.json({ success });
});

router.get('/search/:id', authMiddleware, requireRole(['district_admin', 'municipal_admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { keyword } = req.query;
  
  if (!keyword) {
    res.status(400).json({ error: '缺少 keyword 参数' });
    return;
  }

  const results = pdfService.searchInPdf(id, String(keyword));
  res.json({ results });
});

export default router;
