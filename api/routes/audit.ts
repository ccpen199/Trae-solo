import { Router, type Request, type Response } from 'express';
import { mockSensitiveWords } from '../data/opinionData.js';
import { generateId, formatDate } from '../data/utils.js';
import type { AuditResult, SensitiveWord } from '../../shared/types.js';

const router = Router();

let sensitiveWords: SensitiveWord[] = [...mockSensitiveWords];

function detectSensitiveWords(text: string): SensitiveWord[] {
  const found: SensitiveWord[] = [];
  for (const word of sensitiveWords) {
    if (text.includes(word.word)) {
      found.push(word);
    }
  }
  return found;
}

function aiAnalyze(text: string): {
  score: number;
  level: 'safe' | 'warning' | 'danger';
  tags: string[];
  description: string;
} {
  let score = 0;
  const tags: string[] = [];

  const sensitiveCount = detectSensitiveWords(text).length;
  if (sensitiveCount > 0) {
    score += sensitiveCount * 20;
    tags.push('包含敏感词');
  }

  if (text.length < 20) {
    score += 5;
    tags.push('内容较短');
  }

  if (text.includes('紧急') || text.includes('重大') || text.includes('突发')) {
    score += 15;
    tags.push('敏感表述');
  }

  score = Math.min(score, 100);

  let level: 'safe' | 'warning' | 'danger' = 'safe';
  if (score >= 70) level = 'danger';
  else if (score >= 30) level = 'warning';

  const descriptions = {
    safe: '内容合规，未检测到风险信息，可正常发布。',
    warning: '内容存在一定风险，建议人工复核后发布。',
    danger: '内容存在较高风险，需立即人工审核，谨慎发布。',
  };

  return {
    score,
    level,
    tags,
    description: descriptions[level],
  };
}

const auditResults: Record<string, AuditResult> = {};

router.get('/:contentId', (req: Request, res: Response): void => {
  const { contentId } = req.params;

  let result = auditResults[contentId];

  if (!result) {
    result = {
      contentId,
      sensitiveWords: [],
      aiAnalysis: {
        score: 0,
        level: 'safe',
        tags: [],
        description: '',
      },
      status: 'pending',
    };
  }

  res.json({ success: true, data: result });
});

router.post('/submit/:contentId', (req: Request, res: Response): void => {
  const { contentId } = req.params;
  const { text } = req.body;

  const detected = detectSensitiveWords(text || '');
  const aiResult = aiAnalyze(text || '');

  const sensitiveWithPosition = detected.map((sw, index) => ({
    word: sw.word,
    position: index * 10,
    category: sw.category,
  }));

  const result: AuditResult = {
    contentId,
    sensitiveWords: sensitiveWithPosition,
    aiAnalysis: aiResult,
    status: aiResult.level === 'safe' ? 'passed' : 'pending',
    auditTime: formatDate(new Date()),
  };

  auditResults[contentId] = result;

  res.json({ success: true, data: result });
});

router.post('/review/:contentId', (req: Request, res: Response): void => {
  const { contentId } = req.params;
  const { status, reason } = req.body;

  if (!auditResults[contentId]) {
    res.status(404).json({ success: false, error: '审核记录不存在' });
    return;
  }

  auditResults[contentId] = {
    ...auditResults[contentId],
    status,
    rejectReason: reason,
    auditor: '审核员',
    auditTime: formatDate(new Date()),
  };

  res.json({ success: true, data: auditResults[contentId] });
});

router.get('/sensitive-words', (req: Request, res: Response): void => {
  const { category, keyword, page = '1', pageSize = '20' } = req.query as {
    category?: string;
    keyword?: string;
    page?: string;
    pageSize?: string;
  };

  let filtered = [...sensitiveWords];

  if (category) {
    filtered = filtered.filter((w) => w.category === category);
  }
  if (keyword) {
    filtered = filtered.filter((w) => w.word.includes(keyword as string));
  }

  const pageNum = parseInt(page, 10);
  const sizeNum = parseInt(pageSize, 10);
  const total = filtered.length;
  const start = (pageNum - 1) * sizeNum;
  const list = filtered.slice(start, start + sizeNum);

  res.json({
    success: true,
    data: {
      list,
      total,
      page: pageNum,
      pageSize: sizeNum,
    },
  });
});

router.post('/sensitive-words', (req: Request, res: Response): void => {
  const { word, category, level } = req.body;

  const newWord: SensitiveWord = {
    id: generateId('sw'),
    word,
    category,
    level,
    createTime: formatDate(new Date()),
  };

  sensitiveWords.unshift(newWord);

  res.json({ success: true, data: newWord });
});

router.put('/sensitive-words/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = sensitiveWords.findIndex((w) => w.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '敏感词不存在' });
    return;
  }

  sensitiveWords[index] = {
    ...sensitiveWords[index],
    ...req.body,
  };

  res.json({ success: true, data: sensitiveWords[index] });
});

router.delete('/sensitive-words/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = sensitiveWords.findIndex((w) => w.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: '敏感词不存在' });
    return;
  }

  sensitiveWords.splice(index, 1);

  res.json({ success: true });
});

export default router;
