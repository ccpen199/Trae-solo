import { Router } from 'express';
import qrcode from 'qrcode';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DEL-${timestamp}-${random}`.toUpperCase();
}

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { resume_id, company, position } = req.body;
  
  if (!resume_id || !company || !position) {
    return res.status(400).json({ error: '请提供完整的投递信息' });
  }
  
  const resume: any = db.prepare(
    'SELECT id FROM resumes WHERE id = ? AND user_id = ?'
  ).get(resume_id, req.user!.id);
  
  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  const trackingCode = generateTrackingCode();
  const deliveryUrl = `${process.env.VITE_APP_URL || 'http://127.0.0.1:49067'}/delivery/${trackingCode}`;
  
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(deliveryUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#1a365d', light: '#ffffff' }
    });
    
    const result = db.prepare(
      'INSERT INTO delivery_records (resume_id, user_id, company, position, tracking_code, qr_code) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(resume_id, req.user!.id, company, position, trackingCode, qrCodeDataUrl);
    
    res.json({
      id: result.lastInsertRowid,
      tracking_code: trackingCode,
      qr_code: qrCodeDataUrl,
      delivery_url: deliveryUrl
    });
  } catch (err) {
    console.error('QR code generation error:', err);
    res.status(500).json({ error: '生成二维码失败' });
  }
});

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const records = db.prepare(`
    SELECT dr.*, r.title as resume_title 
    FROM delivery_records dr 
    LEFT JOIN resumes r ON dr.resume_id = r.id 
    WHERE dr.user_id = ? 
    ORDER BY dr.created_at DESC
  `).all(req.user!.id);
  
  res.json({ records });
});

router.get('/track/:trackingCode', (req, res) => {
  const { trackingCode } = req.params;
  
  const record: any = db.prepare(`
    SELECT dr.*, r.title as resume_title, r.content as resume_content, u.name as user_name
    FROM delivery_records dr 
    LEFT JOIN resumes r ON dr.resume_id = r.id 
    LEFT JOIN users u ON dr.user_id = u.id
    WHERE dr.tracking_code = ?
  `).get(trackingCode);
  
  if (!record) {
    return res.status(404).json({ error: '投递记录不存在' });
  }
  
  db.prepare('UPDATE delivery_records SET status = ? WHERE tracking_code = ?').run('viewed', trackingCode);
  
  const content = JSON.parse(record.resume_content);
  
  res.json({
    tracking_code: record.tracking_code,
    company: record.company,
    position: record.position,
    user_name: record.user_name,
    resume_title: record.resume_title,
    resume_content: content,
    created_at: record.created_at,
    status: record.status
  });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const record: any = db.prepare(`
    SELECT dr.*, r.title as resume_title 
    FROM delivery_records dr 
    LEFT JOIN resumes r ON dr.resume_id = r.id 
    WHERE dr.id = ? AND dr.user_id = ?
  `).get(req.params.id, req.user!.id);
  
  if (!record) {
    return res.status(404).json({ error: '投递记录不存在' });
  }
  
  res.json({ record });
});

export default router;
