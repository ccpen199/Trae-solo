import { Router } from 'express';

const router = Router();

router.get('/project/:projectId', (req, res) => {
  const reports = req.db.prepare('SELECT * FROM reports WHERE project_id = ? ORDER BY created_at DESC').all(req.params.projectId);
  res.json(reports);
});

router.get('/:id', (req, res) => {
  const report = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

router.post('/', (req, res) => {
  const { project_id, title, task_completion_rate, avg_time_seconds, top_issues, improvement_suggestions, follow_up_plan } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  const result = req.db.prepare(
    `INSERT INTO reports (project_id, title, task_completion_rate, avg_time_seconds, top_issues, improvement_suggestions, follow_up_plan)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    project_id,
    title || '',
    task_completion_rate || 0,
    avg_time_seconds || 0,
    JSON.stringify(top_issues || []),
    JSON.stringify(improvement_suggestions || []),
    follow_up_plan || ''
  );
  const report = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(report);
});

router.put('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Report not found' });

  const { title, task_completion_rate, avg_time_seconds, top_issues, improvement_suggestions, follow_up_plan } = req.body;
  req.db.prepare(
    `UPDATE reports SET title=coalesce(?,title), task_completion_rate=coalesce(?,task_completion_rate),
     avg_time_seconds=coalesce(?,avg_time_seconds), top_issues=coalesce(?,top_issues),
     improvement_suggestions=coalesce(?,improvement_suggestions), follow_up_plan=coalesce(?,follow_up_plan),
     updated_at=datetime('now','localtime') WHERE id=?`
  ).run(
    title,
    task_completion_rate,
    avg_time_seconds,
    top_issues ? JSON.stringify(top_issues) : null,
    improvement_suggestions ? JSON.stringify(improvement_suggestions) : null,
    follow_up_plan,
    req.params.id
  );

  const report = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  res.json(report);
});

router.post('/project/:projectId/generate', (req, res) => {
  const projectId = req.params.projectId;
  const project = req.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const sessions = req.db.prepare('SELECT * FROM sessions WHERE project_id = ?').all(projectId);
  const tasks = req.db.prepare('SELECT * FROM task_steps WHERE project_id = ?').all(projectId);
  const issues = req.db.prepare('SELECT * FROM issues WHERE project_id = ?').all(projectId);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const avgTimeSeconds = totalTasks > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.time_spent_seconds, 0) / totalTasks) : 0;

  const categoryCount = {};
  issues.forEach(issue => {
    categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
  });
  const topIssues = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, count]) => `${cat} (${count}次)`);

  const highSeverity = issues.filter(i => i.severity === 'high');
  const suggestions = [...new Set(highSeverity.map(i => i.resolution).filter(r => r && r.trim()))];

  const completedSessionCount = sessions.filter(s => s.status === 'completed').length;
  const followUpPlan = completedSessionCount < 3
    ? `当前仅完成 ${completedSessionCount} 场测试，建议继续招募至 5 场以上。`
    : `已完成 ${completedSessionCount} 场测试，建议针对高频问题迭代原型后复测。`;

  const result = req.db.prepare(
    `INSERT INTO reports (project_id, title, task_completion_rate, avg_time_seconds, top_issues, improvement_suggestions, follow_up_plan)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    projectId,
    `${project.name} - 可用性测试报告`,
    taskCompletionRate,
    avgTimeSeconds,
    JSON.stringify(topIssues),
    JSON.stringify(suggestions),
    followUpPlan
  );

  const report = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(report);
});

router.delete('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Report not found' });
  req.db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
