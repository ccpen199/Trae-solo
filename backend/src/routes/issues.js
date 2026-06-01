import { Router } from 'express';

const router = Router();

router.get('/project/:projectId', (req, res) => {
  const issues = req.db.prepare('SELECT * FROM issues WHERE project_id = ? ORDER BY created_at DESC').all(req.params.projectId);
  res.json(issues);
});

router.get('/project/:projectId/stats', (req, res) => {
  const projectId = req.params.projectId;
  const byCategory = req.db.prepare('SELECT category, COUNT(*) AS count FROM issues WHERE project_id = ? GROUP BY category').all(projectId);
  const bySeverity = req.db.prepare('SELECT severity, COUNT(*) AS count FROM issues WHERE project_id = ? GROUP BY severity').all(projectId);
  const byStatus = req.db.prepare("SELECT status, COUNT(*) AS count FROM issues WHERE project_id = ? GROUP BY status").all(projectId);
  res.json({ byCategory, bySeverity, byStatus });
});

router.get('/:id', (req, res) => {
  const issue = req.db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json(issue);
});

router.post('/', (req, res) => {
  const { project_id, session_id, observation_id, category, severity, description, video_timestamp, video_clip_url, resolution, status } = req.body;
  if (!project_id || !description || !description.trim()) return res.status(400).json({ error: 'project_id and description are required' });

  const result = req.db.prepare(
    `INSERT INTO issues (project_id, session_id, observation_id, category, severity, description, video_timestamp, video_clip_url, resolution, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    project_id,
    session_id || null,
    observation_id || null,
    category || 'other',
    severity || 'medium',
    description.trim(),
    video_timestamp || 0,
    video_clip_url || '',
    resolution || '',
    status || 'open'
  );
  const issue = req.db.prepare('SELECT * FROM issues WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(issue);
});

router.put('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Issue not found' });

  const { category, severity, description, video_timestamp, video_clip_url, resolution, status } = req.body;
  req.db.prepare(
    `UPDATE issues SET category=coalesce(?,category), severity=coalesce(?,severity),
     description=coalesce(?,description), video_timestamp=coalesce(?,video_timestamp),
     video_clip_url=coalesce(?,video_clip_url), resolution=coalesce(?,resolution),
     status=coalesce(?,status), updated_at=datetime('now','localtime') WHERE id=?`
  ).run(category, severity, description, video_timestamp, video_clip_url, resolution, status, req.params.id);

  const issue = req.db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  res.json(issue);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Issue not found' });
  req.db.prepare('DELETE FROM issues WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
