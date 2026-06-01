import { Router } from 'express';

const router = Router();

router.get('/project/:projectId', (req, res) => {
  const steps = req.db.prepare('SELECT * FROM task_steps WHERE project_id = ? ORDER BY step_order ASC').all(req.params.projectId);
  res.json(steps);
});

router.get('/session/:sessionId', (req, res) => {
  const steps = req.db.prepare('SELECT * FROM task_steps WHERE session_id = ? ORDER BY step_order ASC').all(req.params.sessionId);
  res.json(steps);
});

router.get('/:id', (req, res) => {
  const step = req.db.prepare('SELECT * FROM task_steps WHERE id = ?').get(req.params.id);
  if (!step) return res.status(404).json({ error: 'Task step not found' });
  res.json(step);
});

router.post('/', (req, res) => {
  const { project_id, session_id, step_order, title, description, expected_action } = req.body;
  if (!project_id || !title || !title.trim()) return res.status(400).json({ error: 'project_id and title are required' });

  const result = req.db.prepare(
    `INSERT INTO task_steps (project_id, session_id, step_order, title, description, expected_action)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(project_id, session_id || null, step_order || 0, title.trim(), description || '', expected_action || '');
  const step = req.db.prepare('SELECT * FROM task_steps WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(step);
});

router.put('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM task_steps WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task step not found' });

  const { step_order, title, description, expected_action, completed, time_spent_seconds } = req.body;
  req.db.prepare(
    `UPDATE task_steps SET step_order=coalesce(?,step_order), title=coalesce(?,title),
     description=coalesce(?,description), expected_action=coalesce(?,expected_action),
     completed=coalesce(?,completed), time_spent_seconds=coalesce(?,time_spent_seconds) WHERE id=?`
  ).run(step_order, title, description, expected_action, completed !== undefined ? (completed ? 1 : 0) : null, time_spent_seconds, req.params.id);

  const step = req.db.prepare('SELECT * FROM task_steps WHERE id = ?').get(req.params.id);
  res.json(step);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM task_steps WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Task step not found' });
  req.db.prepare('DELETE FROM task_steps WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
