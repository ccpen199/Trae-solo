import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { parseResumeFile, parseResumeText } from '../utils/parser';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/file', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }
  
  try {
    const parsed = await parseResumeFile(req.file);
    res.json({ data: parsed });
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ error: '文件解析失败，请确保文件格式正确' });
  }
});

router.post('/text', authMiddleware, (req: AuthRequest, res) => {
  const { text } = req.body;
  
  if (!text || typeof text !== 'string' || text.length < 50) {
    return res.status(400).json({ error: '请输入足够的简历文本内容' });
  }
  
  try {
    const parsed = parseResumeText(text);
    res.json({ data: parsed });
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ error: '文本解析失败' });
  }
});

export default router;
