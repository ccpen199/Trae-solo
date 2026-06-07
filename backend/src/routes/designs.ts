import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize || req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const projectId = (req.query.projectId || req.query.project_id) as string;
    const status = req.query.status as string;

    const params: any[] = [];
    const conditions: string[] = [];
    if (projectId) {
      conditions.push('ds.project_id = ?');
      params.push(projectId);
    }
    if (status) {
      conditions.push('ds.status = ?');
      params.push(status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM design_schemes ds ${whereClause}`).get(...params) as any).count;
    const schemes = db.prepare(
      `SELECT ds.*, u.name as designer_name
       FROM design_schemes ds
       JOIN users u ON ds.designer_id = u.id
       ${whereClause}
       ORDER BY ds.updated_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: schemes, total, page, limit, pageSize: limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取设计方案列表失败' });
  }
});

router.post('/', (req: AuthenticatedRequest, res) => {
  try {
    const { project_id, title, description, style, model_url, thumbnail_url } = req.body;
    if (!project_id || !title) {
      return res.status(400).json({ success: false, error: '项目ID和标题不能为空' });
    }

    const result = db.prepare(
      `INSERT INTO design_schemes (project_id, designer_id, title, description, style, model_url, thumbnail_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(project_id, req.user!.id, title, description || null, style || null, model_url || null, thumbnail_url || null);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建设计方案失败' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const scheme = db.prepare(
      `SELECT ds.*, u.name as designer_name
       FROM design_schemes ds
       JOIN users u ON ds.designer_id = u.id WHERE ds.id = ?`
    ).get(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, error: '设计方案不存在' });
    }
    res.json({ success: true, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取设计方案失败' });
  }
});

function updateScheme(req: AuthenticatedRequest, res: any) {
  try {
    const { title, description, style, model_url, thumbnail_url, status } = req.body;

    const scheme = db.prepare('SELECT * FROM design_schemes WHERE id = ?').get(req.params.id) as any;
    if (!scheme) {
      return res.status(404).json({ success: false, error: '设计方案不存在' });
    }

    db.prepare(
      `UPDATE design_schemes SET title = ?, description = ?, style = ?, model_url = ?, thumbnail_url = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      title ?? scheme.title,
      description ?? scheme.description,
      style ?? scheme.style,
      model_url ?? scheme.model_url,
      thumbnail_url ?? scheme.thumbnail_url,
      status ?? scheme.status,
      req.params.id
    );

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新设计方案失败' });
  }
}

router.put('/:id', updateScheme);
router.patch('/:id', updateScheme);

router.put('/:id/status', (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: '无效的状态' });
    }

    const scheme = db.prepare('SELECT * FROM design_schemes WHERE id = ?').get(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, error: '设计方案不存在' });
    }

    db.prepare("UPDATE design_schemes SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
    res.json({ success: true, data: { id: req.params.id, status } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新状态失败' });
  }
});

router.post('/:id/annotations', (req: AuthenticatedRequest, res) => {
  try {
    const { content, position_x, position_y, position_z } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: '批注内容不能为空' });
    }

    const scheme = db.prepare('SELECT * FROM design_schemes WHERE id = ?').get(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, error: '设计方案不存在' });
    }

    const result = db.prepare(
      `INSERT INTO design_annotations (scheme_id, user_id, content, position_x, position_y, position_z)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.params.id, req.user!.id, content, position_x ?? null, position_y ?? null, position_z ?? null);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建批注失败' });
  }
});

router.get('/:id/annotations', (req: AuthenticatedRequest, res) => {
  try {
    const annotations = db.prepare(
      `SELECT da.*, u.name as user_name FROM design_annotations da
       JOIN users u ON da.user_id = u.id
       WHERE da.scheme_id = ? ORDER BY da.created_at ASC`
    ).all(req.params.id);
    res.json({ success: true, data: annotations });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取批注列表失败' });
  }
});

router.put('/:id/annotations/:annotationId/resolve', (req: AuthenticatedRequest, res) => {
  try {
    const annotation = db.prepare('SELECT * FROM design_annotations WHERE id = ? AND scheme_id = ?').get(req.params.annotationId, req.params.id);
    if (!annotation) {
      return res.status(404).json({ success: false, error: '批注不存在' });
    }

    db.prepare('UPDATE design_annotations SET resolved = 1 WHERE id = ?').run(req.params.annotationId);
    res.json({ success: true, data: { id: req.params.annotationId, resolved: 1 } });
  } catch (error) {
    res.status(500).json({ success: false, error: '解决批注失败' });
  }
});

router.post('/:id/versions', (req: AuthenticatedRequest, res) => {
  try {
    const { model_url, changes_description } = req.body;

    const scheme = db.prepare('SELECT * FROM design_schemes WHERE id = ?').get(req.params.id) as any;
    if (!scheme) {
      return res.status(404).json({ success: false, error: '设计方案不存在' });
    }

    const lastVersion = db.prepare('SELECT MAX(version_number) as max_ver FROM design_versions WHERE scheme_id = ?').get(req.params.id) as any;
    const nextVersion = (lastVersion?.max_ver || 0) + 1;

    const result = db.prepare(
      `INSERT INTO design_versions (scheme_id, version_number, model_url, changes_description)
       VALUES (?, ?, ?, ?)`
    ).run(req.params.id, nextVersion, model_url || null, changes_description || null);

    db.prepare("UPDATE design_schemes SET version = ?, model_url = ?, updated_at = datetime('now') WHERE id = ?").run(
      nextVersion,
      model_url || scheme.model_url,
      req.params.id
    );

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid, version_number: nextVersion } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建版本失败' });
  }
});

router.get('/:id/versions', (req: AuthenticatedRequest, res) => {
  try {
    const versions = db.prepare(
      'SELECT * FROM design_versions WHERE scheme_id = ? ORDER BY version_number DESC'
    ).all(req.params.id);
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取版本列表失败' });
  }
});

router.get('/:id/export', (req: AuthenticatedRequest, res) => {
  try {
    const scheme = db.prepare('SELECT * FROM design_schemes WHERE id = ?').get(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, error: '设计方案不存在' });
    }

    const annotations = db.prepare('SELECT * FROM design_annotations WHERE scheme_id = ? ORDER BY created_at ASC').all(req.params.id);
    const versions = db.prepare('SELECT * FROM design_versions WHERE scheme_id = ? ORDER BY version_number ASC').all(req.params.id);

    res.json({ success: true, data: { scheme, annotations, versions } });
  } catch (error) {
    res.status(500).json({ success: false, error: '导出设计方案失败' });
  }
});

router.post('/:id/export', (req: AuthenticatedRequest, res) => {
  try {
    const scheme = db.prepare('SELECT * FROM design_schemes WHERE id = ?').get(req.params.id);
    if (!scheme) {
      return res.status(404).json({ success: false, error: '设计方案不存在' });
    }

    const annotations = db.prepare('SELECT * FROM design_annotations WHERE scheme_id = ? ORDER BY created_at ASC').all(req.params.id);
    const versions = db.prepare('SELECT * FROM design_versions WHERE scheme_id = ? ORDER BY version_number ASC').all(req.params.id);

    res.json({ success: true, data: { scheme, annotations, versions } });
  } catch (error) {
    res.status(500).json({ success: false, error: '导出设计方案失败' });
  }
});

export default router;
