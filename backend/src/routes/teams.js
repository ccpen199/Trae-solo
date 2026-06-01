const express = require('express');
const { getDb } = require('../database/schema');
const { authenticateToken, requireRole, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const teams = db.prepare(`
    SELECT t.*, u.username as creator_name,
      COUNT(DISTINCT tm.user_id) as member_count,
      COUNT(DISTINCT p.id) as project_count
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    JOIN users u ON t.created_by = u.id
    LEFT JOIN projects p ON t.id = p.team_id
    WHERE tm.user_id = ? OR ? = 'admin'
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `).all(req.user.id, req.user.role);

  res.json({ teams });
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  const team = db.prepare(`
    SELECT t.*, u.username as creator_name
    FROM teams t
    JOIN users u ON t.created_by = u.id
    WHERE t.id = ?
  `).get(id);

  if (!team) {
    return res.status(404).json({ error: '团队不存在' });
  }

  const members = db.prepare(`
    SELECT u.id, u.username, u.email, u.department, tm.role, tm.joined_at
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = ?
  `).all(id);

  const projects = db.prepare(`
    SELECT p.*, u.username as creator_name
    FROM projects p
    JOIN users u ON p.created_by = u.id
    WHERE p.team_id = ?
  `).all(id);

  res.json({ team, members, projects });
});

router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '团队名称不能为空' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO teams (name, description, created_by)
    VALUES (?, ?, ?)
  `).run(name, description, req.user.id);

  const teamId = result.lastInsertRowid;
  
  db.prepare(`
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (?, ?, 'admin')
  `).run(teamId, req.user.id);

  logAction(req, 'create_team', 'team', teamId);
  res.json({ id: teamId, message: '团队创建成功' });
});

router.post('/:id/members', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { user_id, role = 'member' } = req.body;

  const db = getDb();
  const isAdmin = db.prepare(`
    SELECT 1 FROM team_members 
    WHERE team_id = ? AND user_id = ? AND role = 'admin'
  `).get(id, req.user.id);

  if (!isAdmin && req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有团队管理员可以添加成员' });
  }

  try {
    db.prepare(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(id, user_id, role);

    logAction(req, 'add_team_member', 'team', id, { user_id, role });
    res.json({ message: '成员添加成功' });
  } catch (err) {
    res.status(400).json({ error: '成员已存在或添加失败' });
  }
});

router.delete('/:id/members/:user_id', authenticateToken, (req, res) => {
  const { id, user_id } = req.params;

  const db = getDb();
  const isAdmin = db.prepare(`
    SELECT 1 FROM team_members 
    WHERE team_id = ? AND user_id = ? AND role = 'admin'
  `).get(id, req.user.id);

  if (!isAdmin && req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有团队管理员可以移除成员' });
  }

  db.prepare(`
    DELETE FROM team_members WHERE team_id = ? AND user_id = ?
  `).run(id, user_id);

  logAction(req, 'remove_team_member', 'team', id, { user_id });
  res.json({ message: '成员已移除' });
});

router.get('/:id/projects', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  const projects = db.prepare(`
    SELECT p.*, u.username as creator_name,
      COUNT(DISTINCT c.id) as credential_count
    FROM projects p
    JOIN users u ON p.created_by = u.id
    LEFT JOIN credentials c ON p.id = c.project_id
    WHERE p.team_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(id);

  res.json({ projects });
});

router.post('/:id/projects', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '项目名称不能为空' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO projects (name, team_id, description, created_by)
    VALUES (?, ?, ?, ?)
  `).run(name, id, description, req.user.id);

  logAction(req, 'create_project', 'project', result.lastInsertRowid);
  res.json({ id: result.lastInsertRowid, message: '项目创建成功' });
});

module.exports = router;
