import express, { type Request, type Response } from 'express';
import { mockLineageData, mockSourceScores, mockSummaryReviews } from '../data/mockData.js';

const router = express.Router();

router.get('/lineage', (_req: Request, res: Response) => {
  res.json({ success: true, data: mockLineageData });
});

router.get('/lineage/:nodeId', (req: Request, res: Response) => {
  const nodeId = req.params.nodeId;
  const node = mockLineageData.nodes.find((n) => n.id === nodeId);
  if (!node) {
    return res.status(404).json({ success: false, error: 'Node not found' });
  }

  const upstream = mockLineageData.edges
    .filter((e) => e.targetId === nodeId)
    .map((e) => ({
      edge: e,
      node: mockLineageData.nodes.find((n) => n.id === e.sourceId),
    }));

  const downstream = mockLineageData.edges
    .filter((e) => e.sourceId === nodeId)
    .map((e) => ({
      edge: e,
      node: mockLineageData.nodes.find((n) => n.id === e.targetId),
    }));

  res.json({ success: true, data: { node, upstream, downstream } });
});

router.get('/sources', (_req: Request, res: Response) => {
  res.json({ success: true, data: mockSourceScores });
});

router.get('/sources/:id', (req: Request, res: Response) => {
  const source = mockSourceScores.find((s) => s.sourceId === req.params.id);
  if (!source) {
    return res.status(404).json({ success: false, error: 'Source not found' });
  }
  res.json({ success: true, data: source });
});

router.get('/summary-reviews', (req: Request, res: Response) => {
  const { status } = req.query;
  let result = [...mockSummaryReviews];
  if (typeof status === 'string' && status !== 'all') {
    result = result.filter((r) => r.status === status);
  }
  res.json({ success: true, data: result });
});

router.get('/summary-reviews/:id', (req: Request, res: Response) => {
  const review = mockSummaryReviews.find((r) => r.id === req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, error: 'Review not found' });
  }
  res.json({ success: true, data: review });
});

router.put('/summary-reviews/:id', (req: Request, res: Response) => {
  const { status, reviewerComment } = req.body;
  const review = mockSummaryReviews.find((r) => r.id === req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, error: 'Review not found' });
  }
  if (status) review.status = status;
  if (reviewerComment !== undefined) review.reviewerComment = reviewerComment;
  res.json({ success: true, data: review });
});

export default router;
