import { Router } from 'express';

const router = Router();

router.get('/project/:projectId', (req, res) => {
  const sessions = req.db.prepare('SELECT * FROM sessions WHERE project_id = ? ORDER BY scheduled_at ASC').all(req.params.projectId);
  res.json(sessions);
});

router.get('/:id', (req, res) => {
  const session = req.db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.post('/', (req, res) => {
  const { project_id, participant_id, scheduled_at, status, recording_status } = req.body;
  if (!project_id || !participant_id) return res.status(400).json({ error: 'project_id and participant_id are required' });

  const project = req.db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(400).json({ error: 'Project not found' });

  const participant = req.db.prepare('SELECT id FROM participants WHERE id = ?').get(participant_id);
  if (!participant) return res.status(400).json({ error: 'Participant not found' });

  const result = req.db.prepare(
    `INSERT INTO sessions (project_id, participant_id, scheduled_at, status, recording_status)
     VALUES (?, ?, ?, ?, ?)`
  ).run(project_id, participant_id, scheduled_at || '', status || 'scheduled', recording_status || 'off');
  const session = req.db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(session);
});

router.put('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  const { scheduled_at, status, recording_status, started_at, ended_at } = req.body;
  req.db.prepare(
    `UPDATE sessions SET scheduled_at=coalesce(?,scheduled_at), status=coalesce(?,status),
     recording_status=coalesce(?,recording_status), started_at=coalesce(?,started_at),
     ended_at=coalesce(?,ended_at), updated_at=datetime('now','localtime') WHERE id=?`
  ).run(scheduled_at, status, recording_status, started_at || null, ended_at || null, req.params.id);

  const session = req.db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  res.json(session);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  const remove = req.db.transaction((sessionId) => {
    req.db.prepare('DELETE FROM observations WHERE session_id = ?').run(sessionId);
    req.db.prepare('DELETE FROM issues WHERE session_id = ?').run(sessionId);
    req.db.prepare('DELETE FROM task_steps WHERE session_id = ?').run(sessionId);
    req.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  });
  remove(req.params.id);
  res.json({ success: true });
});

export default router;
