import { Router } from 'express';

const router = Router();

router.get('/project/:projectId', (req, res) => {
  const participants = req.db.prepare('SELECT * FROM participants WHERE project_id = ? ORDER BY created_at DESC').all(req.params.projectId);
  res.json(participants);
});

router.get('/:id', (req, res) => {
  const participant = req.db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
  if (!participant) return res.status(404).json({ error: 'Participant not found' });
  res.json(participant);
});

router.post('/', (req, res) => {
  const { project_id, name, email, phone, screening_answers, appointment_status, consent_given, participation_history } = req.body;
  if (!project_id || !name || !name.trim()) return res.status(400).json({ error: 'project_id and name are required' });

  const project = req.db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(400).json({ error: 'Project not found' });

  const result = req.db.prepare(
    `INSERT INTO participants (project_id, name, email, phone, screening_answers, appointment_status, consent_given, participation_history)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    project_id,
    name.trim(),
    email || '',
    phone || '',
    JSON.stringify(screening_answers || []),
    appointment_status || 'pending',
    consent_given ? 1 : 0,
    JSON.stringify(participation_history || [])
  );
  const participant = req.db.prepare('SELECT * FROM participants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(participant);
});

router.put('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Participant not found' });

  const { name, email, phone, screening_answers, appointment_status, consent_given, participation_history } = req.body;
  req.db.prepare(
    `UPDATE participants SET name=coalesce(?,name), email=coalesce(?,email), phone=coalesce(?,phone),
     screening_answers=coalesce(?,screening_answers), appointment_status=coalesce(?,appointment_status),
     consent_given=coalesce(?,consent_given), participation_history=coalesce(?,participation_history),
     updated_at=datetime('now','localtime') WHERE id=?`
  ).run(
    name,
    email,
    phone,
    screening_answers ? JSON.stringify(screening_answers) : null,
    appointment_status,
    consent_given !== undefined ? (consent_given ? 1 : 0) : null,
    participation_history ? JSON.stringify(participation_history) : null,
    req.params.id
  );
  const participant = req.db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
  res.json(participant);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM participants WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Participant not found' });

  const participantId = req.params.id;
  req.db.prepare('DELETE FROM sessions WHERE participant_id = ?').run(participantId);
  req.db.prepare('DELETE FROM participants WHERE id = ?').run(participantId);
  res.json({ success: true });
});

export default router;
