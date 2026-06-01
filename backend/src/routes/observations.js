import { Router } from 'express';

const router = Router();

router.get('/project/:projectId', (req, res) => {
  const observations = req.db.prepare('SELECT * FROM observations WHERE project_id = ? ORDER BY timestamp_seconds ASC').all(req.params.projectId);
  res.json(observations);
});

router.get('/session/:sessionId', (req, res) => {
  const observations = req.db.prepare('SELECT * FROM observations WHERE session_id = ? ORDER BY timestamp_seconds ASC').all(req.params.sessionId);
  res.json(observations);
});

router.get('/:id', (req, res) => {
  const obs = req.db.prepare('SELECT * FROM observations WHERE id = ?').get(req.params.id);
  if (!obs) return res.status(404).json({ error: 'Observation not found' });
  res.json(obs);
});

router.post('/', (req, res) => {
  const { session_id, project_id, timestamp_seconds, note_type, content, is_stuck_point } = req.body;
  if (!session_id || !project_id || !content || !content.trim()) return res.status(400).json({ error: 'session_id, project_id and content are required' });

  const result = req.db.prepare(
    `INSERT INTO observations (session_id, project_id, timestamp_seconds, note_type, content, is_stuck_point)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(session_id, project_id, timestamp_seconds || 0, note_type || 'general', content.trim(), is_stuck_point ? 1 : 0);
  const obs = req.db.prepare('SELECT * FROM observations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(obs);
});

router.put('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM observations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Observation not found' });

  const { timestamp_seconds, note_type, content, is_stuck_point } = req.body;
  req.db.prepare(
    `UPDATE observations SET timestamp_seconds=coalesce(?,timestamp_seconds), note_type=coalesce(?,note_type),
     content=coalesce(?,content), is_stuck_point=coalesce(?,is_stuck_point) WHERE id=?`
  ).run(timestamp_seconds, note_type, content, is_stuck_point !== undefined ? (is_stuck_point ? 1 : 0) : null, req.params.id);

  const obs = req.db.prepare('SELECT * FROM observations WHERE id = ?').get(req.params.id);
  res.json(obs);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM observations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Observation not found' });
  req.db.prepare('DELETE FROM observations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
