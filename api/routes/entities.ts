import express, { type Request, type Response } from 'express';
import {
  mockEntities,
  mockRelations,
  mockTriples,
  mockTimelineEvents,
  mockConcepts,
} from '../data/mockData.js';

const router = express.Router();

router.get('/entities', (req: Request, res: Response) => {
  const { q, type, limit } = req.query;
  let result = [...mockEntities];

  if (typeof q === 'string' && q.trim()) {
    const query = q.toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        (e.description && e.description.toLowerCase().includes(query))
    );
  }

  if (typeof type === 'string' && type !== 'all') {
    result = result.filter((e) => e.type === type);
  }

  if (typeof limit === 'string') {
    result = result.slice(0, parseInt(limit));
  }

  res.json({ success: true, data: result });
});

router.get('/entities/:id', (req: Request, res: Response) => {
  const entity = mockEntities.find((e) => e.id === req.params.id);
  if (!entity) {
    return res.status(404).json({ success: false, error: 'Entity not found' });
  }
  res.json({ success: true, data: entity });
});

router.get('/entities/:id/relations', (req: Request, res: Response) => {
  const depth = parseInt((req.query.depth as string) || '2');
  const entityId = req.params.id;

  const nodeIds = new Set<string>([entityId]);
  const collectedLinks = [];

  let currentLayer = [entityId];
  for (let d = 0; d < depth; d++) {
    const nextLayer = new Set<string>();
    for (const id of currentLayer) {
      for (const rel of mockRelations) {
        if (rel.sourceId === id && !nodeIds.has(rel.targetId)) {
          collectedLinks.push(rel);
          nextLayer.add(rel.targetId);
        }
        if (rel.targetId === id && !nodeIds.has(rel.sourceId)) {
          collectedLinks.push(rel);
          nextLayer.add(rel.sourceId);
        }
      }
    }
    nextLayer.forEach((id) => nodeIds.add(id));
    currentLayer = Array.from(nextLayer);
    if (currentLayer.length === 0) break;
  }

  const collectedNodes = mockEntities.filter((e) => nodeIds.has(e.id));
  res.json({ success: true, data: { nodes: collectedNodes, links: collectedLinks } });
});

router.get('/entities/:id/timeline', (req: Request, res: Response) => {
  const events = mockTimelineEvents
    .filter((e) => e.entityId === req.params.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json({ success: true, data: events });
});

router.get('/graph', (req: Request, res: Response) => {
  res.json({ success: true, data: { nodes: mockEntities, links: mockRelations } });
});

router.get('/triples', (req: Request, res: Response) => {
  const { verified, minConfidence } = req.query;
  let result = [...mockTriples];

  if (verified === 'true') result = result.filter((t) => t.verified);
  if (verified === 'false') result = result.filter((t) => !t.verified);
  if (typeof minConfidence === 'string') {
    const mc = parseFloat(minConfidence);
    result = result.filter((t) => t.confidence >= mc);
  }

  res.json({ success: true, data: result });
});

router.put('/triples/:id/verify', (req: Request, res: Response) => {
  const { verified } = req.body;
  const triple = mockTriples.find((t) => t.id === req.params.id);
  if (!triple) {
    return res.status(404).json({ success: false, error: 'Triple not found' });
  }
  triple.verified = !!verified;
  res.json({ success: true, data: triple });
});

router.post('/extraction', (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'Text is required' });
  }
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        taskId: `task-${Date.now()}`,
        triples: mockTriples.slice(0, 3),
      },
    });
  }, 800);
});

router.get('/concepts', (_req: Request, res: Response) => {
  res.json({ success: true, data: mockConcepts });
});

router.get('/concepts/:id', (req: Request, res: Response) => {
  const concept = mockConcepts.find((c) => c.id === req.params.id);
  if (!concept) {
    return res.status(404).json({ success: false, error: 'Concept not found' });
  }
  res.json({ success: true, data: concept });
});

export default router;
