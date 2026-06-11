import express, { type Request, type Response } from 'express';
import { mockReports, mockAnnotations } from '../data/mockData.js';

const router = express.Router();

router.get('/reports', (req: Request, res: Response) => {
  const { industry, search } = req.query;
  let result = [...mockReports];

  if (typeof industry === 'string' && industry !== 'all') {
    result = result.filter((r) => r.industry === industry);
  }
  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (r) => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, data: result });
});

router.get('/reports/:id', (req: Request, res: Response) => {
  const report = mockReports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  res.json({ success: true, data: report });
});

router.get('/reports/:id/annotations', (req: Request, res: Response) => {
  const { page } = req.query;
  let result = mockAnnotations.filter((a) => a.reportId === req.params.id);

  if (typeof page === 'string') {
    result = result.filter((a) => a.pageNumber === parseInt(page));
  }

  res.json({ success: true, data: result });
});

router.post('/reports/:id/annotations', (req: Request, res: Response) => {
  const report = mockReports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }

  const { pageNumber, type, color, text, comment, annotatorId, annotatorName, position } = req.body;
  if (!type || !annotatorId || !annotatorName || !position) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const newAnn = {
    id: `ann-${Date.now()}`,
    reportId: req.params.id,
    pageNumber: pageNumber || 1,
    type,
    color,
    text,
    comment,
    annotatorId,
    annotatorName,
    position,
    createdAt: new Date().toISOString(),
  };
  mockAnnotations.push(newAnn);
  res.status(201).json({ success: true, data: newAnn });
});

router.post('/reports/:id/generate-summary', (req: Request, res: Response) => {
  const report = mockReports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' });
  }
  report.summaryStatus = 'generating';
  setTimeout(() => {
    report.summary = `【自动生成摘要】${report.title}：该研报由${report.author}于${report.publishDate}发布，共${report.pageCount}页，覆盖${report.industry || '相关'}行业核心观点。`;
    report.summaryStatus = 'reviewing';
    res.json({ success: true, data: { summary: report.summary, status: report.summaryStatus } });
  }, 1500);
});

export default router;
