import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { analyzeQuality, generateATSPlainText } from '../utils/parser';
import { ResumeContent } from '../types';

const router = Router();

router.post('/analyze', authMiddleware, (req: AuthRequest, res) => {
  const { content, industry } = req.body;
  
  if (!content || !content.basicInfo) {
    return res.status(400).json({ error: '请提供完整的简历内容' });
  }
  
  try {
    const report = analyzeQuality(content as ResumeContent, industry || 'tech');
    res.json({ report });
  } catch (err) {
    console.error('Quality analysis error:', err);
    res.status(500).json({ error: '质量分析失败' });
  }
});

router.post('/ats-text', authMiddleware, (req: AuthRequest, res) => {
  const { content } = req.body;
  
  if (!content || !content.basicInfo) {
    return res.status(400).json({ error: '请提供完整的简历内容' });
  }
  
  try {
    const atsText = generateATSPlainText(content as ResumeContent);
    res.json({ atsText });
  } catch (err) {
    console.error('ATS generation error:', err);
    res.status(500).json({ error: 'ATS纯文本生成失败' });
  }
});

export default router;
