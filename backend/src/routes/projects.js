import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const projects = req.db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  res.json(projects);
});

router.get('/:id', (req, res) => {
  const project = req.db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/', (req, res) => {
  const { name, research_goal, target_user, task_script, prototype_link, schedule_start, schedule_end, compensation, status } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  const result = req.db.prepare(
    `INSERT INTO projects (name, research_goal, target_user, task_script, prototype_link, schedule_start, schedule_end, compensation, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    name.trim(),
    research_goal || '',
    target_user || '',
    task_script || '',
    prototype_link || '',
    schedule_start || '',
    schedule_end || '',
    compensation || '',
    status || 'draft'
  );
  const project = req.db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
});

router.put('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const { name, research_goal, target_user, task_script, prototype_link, schedule_start, schedule_end, compensation, status } = req.body;
  req.db.prepare(
    `UPDATE projects SET name=coalesce(?,name), research_goal=coalesce(?,research_goal), target_user=coalesce(?,target_user),
     task_script=coalesce(?,task_script), prototype_link=coalesce(?,prototype_link), schedule_start=coalesce(?,schedule_start),
     schedule_end=coalesce(?,schedule_end), compensation=coalesce(?,compensation), status=coalesce(?,status),
     updated_at=datetime('now','localtime') WHERE id=?`
  ).run(name, research_goal, target_user, task_script, prototype_link, schedule_start, schedule_end, compensation, status, req.params.id);

  const project = req.db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(project);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const projectId = req.params.id;
  req.db.prepare('DELETE FROM reports WHERE project_id = ?').run(projectId);
  req.db.prepare('DELETE FROM issues WHERE project_id = ?').run(projectId);
  req.db.prepare('DELETE FROM observations WHERE project_id = ?').run(projectId);
  req.db.prepare('DELETE FROM task_steps WHERE project_id = ?').run(projectId);
  req.db.prepare('DELETE FROM sessions WHERE project_id = ?').run(projectId);
  req.db.prepare('DELETE FROM participants WHERE project_id = ?').run(projectId);
  req.db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);

  res.json({ success: true });
});

export default router;
