import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

function normalizeInspectionType(type: unknown): string {
  const value = String(type || '');
  if (value === 'electrical') return 'water_electric';
  if (value === 'final') return 'completion';
  return value || 'water_electric';
}

function parseJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(/[,，;\n]/).map((item) => item.trim()).filter(Boolean);
  }
}

function normalizeReport(report: any) {
  if (!report) return null;
  return {
    id: report.id,
    inspection_id: report.task_id,
    task_id: report.task_id,
    image_urls: parseJsonArray(report.images),
    images: parseJsonArray(report.images),
    defects: parseJsonArray(report.defects),
    suggestions: parseJsonArray(report.suggestions),
    overall_score: Number(report.overall_score || 0),
    ai_analysis: report.ai_analysis || '',
    status: report.status,
    created_at: report.created_at,
  };
}

function listInspectionTasks(req: AuthenticatedRequest, res: any) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.pageSize || req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const projectId = (req.query.projectId || req.query.project_id) as string;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const conditions: string[] = [];
    const params: any[] = [];

    if (projectId) {
      conditions.push('it.project_id = ?');
      params.push(projectId);
    }
    if (status) {
      conditions.push('it.status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('it.type = ?');
      params.push(normalizeInspectionType(type));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (db.prepare(`SELECT COUNT(*) as count FROM inspection_tasks it ${whereClause}`).get(...params) as any).count;
    const tasks = db.prepare(
      `SELECT it.*, u.name as inspector, u.name as inspector_name, p.title as project_title
       FROM inspection_tasks it
       LEFT JOIN users u ON it.inspector_id = u.id
       LEFT JOIN projects p ON it.project_id = p.id
       ${whereClause}
       ORDER BY it.scheduled_date DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: tasks, total, page, limit, pageSize: limit } });
  } catch {
    res.status(500).json({ success: false, error: '获取验收任务列表失败' });
  }
}

router.get('/', listInspectionTasks);

router.post('/', (req: AuthenticatedRequest, res) => {
  try {
    const { project_id, type, inspector_id, scheduled_date, description } = req.body;
    if (!project_id || !type) {
      return res.status(400).json({ success: false, error: '项目ID和验收类型不能为空' });
    }

    const result = db.prepare(
      'INSERT INTO inspection_tasks (project_id, type, inspector_id, scheduled_date, description) VALUES (?, ?, ?, ?, ?)'
    ).run(project_id, normalizeInspectionType(type), inspector_id || req.user!.id, scheduled_date || null, description || null);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch {
    res.status(500).json({ success: false, error: '创建验收任务失败' });
  }
});

router.get('/tasks', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const projectId = req.query.projectId as string;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const conditions: string[] = [];
    const params: any[] = [];

    if (projectId) {
      conditions.push('it.project_id = ?');
      params.push(projectId);
    }
    if (status) {
      conditions.push('it.status = ?');
      params.push(status);
    }
    if (type) {
      conditions.push('it.type = ?');
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM inspection_tasks it ${whereClause}`).get(...params) as any).count;
    const tasks = db.prepare(
      `SELECT it.*, u.name as inspector_name, p.title as project_title
       FROM inspection_tasks it
       LEFT JOIN users u ON it.inspector_id = u.id
       LEFT JOIN projects p ON it.project_id = p.id
       ${whereClause}
       ORDER BY it.scheduled_date DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: tasks, total, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取验收任务列表失败' });
  }
});

router.get('/:id/report', (req: AuthenticatedRequest, res) => {
  try {
    const report = db.prepare('SELECT * FROM inspection_reports WHERE task_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id);
    res.json({ success: true, data: normalizeReport(report) });
  } catch {
    res.status(500).json({ success: false, error: '获取验收报告失败' });
  }
});

function saveReport(req: AuthenticatedRequest, res: any) {
  try {
    const { image_urls, images, defects, suggestions, overall_score, ai_analysis, status } = req.body;
    const task = db.prepare('SELECT * FROM inspection_tasks WHERE id = ?').get(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: '验收任务不存在' });

    const payloadImages = image_urls || images || [];
    const payloadDefects = defects || [];
    const payloadSuggestions = suggestions || [];
    const reportStatus = status || (Number(overall_score || 0) >= 80 ? 'pass' : 'conditional');
    const existing = db.prepare('SELECT * FROM inspection_reports WHERE task_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id) as any;

    let reportId: number;
    if (existing) {
      reportId = Number(existing.id);
      db.prepare(
        "UPDATE inspection_reports SET images = ?, defects = ?, suggestions = ?, overall_score = ?, ai_analysis = ?, status = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(
        JSON.stringify(payloadImages),
        JSON.stringify(payloadDefects),
        JSON.stringify(payloadSuggestions),
        overall_score ?? existing.overall_score,
        ai_analysis ?? existing.ai_analysis,
        reportStatus,
        reportId
      );
    } else {
      reportId = Number(db.prepare(
        'INSERT INTO inspection_reports (task_id, images, defects, suggestions, overall_score, ai_analysis, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        req.params.id,
        JSON.stringify(payloadImages),
        JSON.stringify(payloadDefects),
        JSON.stringify(payloadSuggestions),
        overall_score ?? null,
        ai_analysis || null,
        reportStatus
      ).lastInsertRowid);
    }

    const taskStatus = reportStatus === 'fail' ? 'failed' : 'completed';
    db.prepare("UPDATE inspection_tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(taskStatus, req.params.id);
    const report = db.prepare('SELECT * FROM inspection_reports WHERE id = ?').get(reportId);
    res.json({ success: true, data: normalizeReport(report) });
  } catch {
    res.status(500).json({ success: false, error: '保存验收报告失败' });
  }
}

router.post('/:id/report', saveReport);
router.patch('/:id/report', saveReport);

router.post('/tasks', (req: AuthenticatedRequest, res) => {
  try {
    const { project_id, type, inspector_id, scheduled_date, description } = req.body;
    if (!project_id || !type) {
      return res.status(400).json({ success: false, error: '项目ID和验收类型不能为空' });
    }

    const result = db.prepare(
      `INSERT INTO inspection_tasks (project_id, type, inspector_id, scheduled_date, description)
       VALUES (?, ?, ?, ?, ?)`
    ).run(project_id, type, inspector_id || null, scheduled_date || null, description || null);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建验收任务失败' });
  }
});

router.get('/tasks/:id', (req: AuthenticatedRequest, res) => {
  try {
    const task = db.prepare(
      `SELECT it.*, u.name as inspector_name, p.title as project_title
       FROM inspection_tasks it
       LEFT JOIN users u ON it.inspector_id = u.id
       LEFT JOIN projects p ON it.project_id = p.id
       WHERE it.id = ?`
    ).get(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: '验收任务不存在' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取验收任务失败' });
  }
});

router.put('/tasks/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { type, inspector_id, scheduled_date, status, description } = req.body;

    const task = db.prepare('SELECT * FROM inspection_tasks WHERE id = ?').get(req.params.id) as any;
    if (!task) {
      return res.status(404).json({ success: false, error: '验收任务不存在' });
    }

    db.prepare(
      `UPDATE inspection_tasks SET type = ?, inspector_id = ?, scheduled_date = ?, status = ?, description = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      type ?? task.type,
      inspector_id ?? task.inspector_id,
      scheduled_date ?? task.scheduled_date,
      status ?? task.status,
      description ?? task.description,
      req.params.id
    );

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新验收任务失败' });
  }
});

router.post('/tasks/:taskId/reports', (req: AuthenticatedRequest, res) => {
  try {
    const { images, defects, ai_analysis, suggestions, overall_score, status } = req.body;

    const task = db.prepare('SELECT * FROM inspection_tasks WHERE id = ?').get(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: '验收任务不存在' });
    }

    const result = db.prepare(
      `INSERT INTO inspection_reports (task_id, images, defects, ai_analysis, suggestions, overall_score, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.params.taskId,
      images ? JSON.stringify(images) : '[]',
      defects ? JSON.stringify(defects) : '[]',
      ai_analysis || null,
      suggestions || null,
      overall_score ?? null,
      status || 'pass'
    );

    const reportStatus = status || 'pass';
    let taskStatus = 'completed';
    if (reportStatus === 'fail') {
      taskStatus = 'failed';
    } else if (reportStatus === 'conditional') {
      taskStatus = 'completed';
    }

    db.prepare("UPDATE inspection_tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(taskStatus, req.params.taskId);

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建验收报告失败' });
  }
});

router.get('/tasks/:taskId/reports', (req: AuthenticatedRequest, res) => {
  try {
    const reports = db.prepare('SELECT * FROM inspection_reports WHERE task_id = ? ORDER BY created_at DESC').all(req.params.taskId);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取验收报告失败' });
  }
});

router.put('/reports/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { images, defects, ai_analysis, suggestions, overall_score, status } = req.body;

    const report = db.prepare('SELECT * FROM inspection_reports WHERE id = ?').get(req.params.id) as any;
    if (!report) {
      return res.status(404).json({ success: false, error: '验收报告不存在' });
    }

    db.prepare(
      `UPDATE inspection_reports SET images = ?, defects = ?, ai_analysis = ?, suggestions = ?, overall_score = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      images ? JSON.stringify(images) : report.images,
      defects ? JSON.stringify(defects) : report.defects,
      ai_analysis ?? report.ai_analysis,
      suggestions ?? report.suggestions,
      overall_score ?? report.overall_score,
      status ?? report.status,
      req.params.id
    );

    if (status) {
      let taskStatus = 'completed';
      if (status === 'fail') {
        taskStatus = 'failed';
      }
      db.prepare("UPDATE inspection_tasks SET status = ?, updated_at = datetime('now') WHERE id = ?").run(taskStatus, report.task_id);
    }

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新验收报告失败' });
  }
});

router.post('/ai-analyze', (req: AuthenticatedRequest, res) => {
  try {
    const { type, inspection_id } = req.body;
    let analysisType = normalizeInspectionType(type);
    if (!type && inspection_id) {
      const task = db.prepare('SELECT type FROM inspection_tasks WHERE id = ?').get(inspection_id) as { type: string } | undefined;
      analysisType = normalizeInspectionType(task?.type);
    }
    if (!analysisType) {
      return res.status(400).json({ success: false, error: '验收类型不能为空' });
    }

    const templates: Record<string, any> = {
      water_electric: {
        defects: [
          { name: '线管未固定', severity: 'medium', location: '客厅区域', description: '线管间距过大，未按要求固定' },
          { name: '水管压力不足', severity: 'high', location: '卫生间', description: '水压测试未达标，存在渗漏风险' }
        ],
        ai_analysis: '水电验收检测结果：共检测12项，发现2项不合格。线管固定不规范可能导致安全隐患，建议重新固定。水管压力不足需排查渗漏点，修复后重新测试。',
        suggestions: ['对线管进行加固处理，间距不超过800mm', '对水管系统进行全面打压测试，排查渗漏点', '整改后重新验收'],
        overall_score: 72
      },
      masonry: {
        defects: [
          { name: '墙面空鼓', severity: 'high', location: '主卧南墙', description: '空鼓面积超过400cm²，需返工处理' },
          { name: '砖缝不均', severity: 'low', location: '厨房区域', description: '砖缝宽度不一致，影响美观' }
        ],
        ai_analysis: '泥瓦验收检测结果：共检测15项，发现2项不合格。墙面空鼓面积较大，存在脱落风险，必须返工。砖缝不均属于美观问题，建议修补。',
        suggestions: ['对空鼓区域进行切割返工处理', '对砖缝不均处进行勾缝修补', '返工后重新验收'],
        overall_score: 68
      },
      completion: {
        defects: [
          { name: '乳胶漆色差', severity: 'medium', location: '客厅天花板', description: '局部区域存在明显色差' },
          { name: '地板翘起', severity: 'high', location: '次卧', description: '地板局部翘起，可能因受潮引起' },
          { name: '门缝不均', severity: 'low', location: '主卧门', description: '门缝上下宽度不一致' }
        ],
        ai_analysis: '竣工验收检测结果：共检测20项，发现3项不合格。地板翘起需排查受潮原因并更换受损地板。乳胶漆色差需重新涂刷。门缝不均属于细节问题，建议调整。',
        suggestions: ['排查地板受潮原因，更换翘起地板', '对色差区域重新涂刷乳胶漆', '调整门合页使门缝均匀', '整改后重新验收'],
        overall_score: 75
      }
    };

    const template = templates[analysisType];
    if (!template) {
      return res.status(400).json({ success: false, error: '无效的验收类型' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: 'AI分析失败' });
  }
});

export default router;
