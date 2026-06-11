import { Request, Response } from 'express';
import db from '../database/connection.js';
import type { Alert } from '../../../shared/types.js';

export async function getAlerts(req: Request & { user?: any }, res: Response) {
  try {
    const { status, level, type } = req.query;
    let query = `
      SELECT a.*, u.name as handler_name
      FROM alerts a
      LEFT JOIN users u ON a.handler_id = u.id
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (status) {
      whereClauses.push('a.status = ?');
      params.push(status);
    }

    if (level) {
      whereClauses.push('a.level = ?');
      params.push(level);
    }

    if (type) {
      whereClauses.push('a.type = ?');
      params.push(type);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY a.occurred_at DESC';

    const alerts = db.prepare(query).all(...params) as (Alert & { handler_name: string })[];

    const stats = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM alerts
      GROUP BY status
    `).all();

    const levelStats = db.prepare(`
      SELECT level, COUNT(*) as count
      FROM alerts
      WHERE status IN ('pending', 'processing')
      GROUP BY level
    `).all();

    res.json({
      success: true,
      data: {
        alerts,
        stats,
        levelStats
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, error: '获取告警列表失败' });
  }
}

export async function getAlertDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const alert = db.prepare(`
      SELECT a.*, u.name as handler_name
      FROM alerts a
      LEFT JOIN users u ON a.handler_id = u.id
      WHERE a.id = ?
    `).get(id) as (Alert & { handler_name: string }) | undefined;

    if (!alert) {
      return res.status(404).json({ success: false, error: '告警不存在' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Get alert detail error:', error);
    res.status(500).json({ success: false, error: '获取告警详情失败' });
  }
}

export async function handleAlert(req: Request & { user?: any }, res: Response) {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: '请提供状态' });
    }

    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as Alert | undefined;

    if (!alert) {
      return res.status(404).json({ success: false, error: '告警不存在' });
    }

    db.prepare(`
      UPDATE alerts 
      SET status = ?, handler_id = ?, handled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, req.user.id, id);

    res.json({ success: true, message: '告警处理成功' });
  } catch (error) {
    console.error('Handle alert error:', error);
    res.status(500).json({ success: false, error: '处理告警失败' });
  }
}

export async function createAlert(req: Request, res: Response) {
  try {
    const { type, level, title, description, location, imageUrl } = req.body;

    if (!type || !level || !title) {
      return res.status(400).json({ success: false, error: '请填写完整的告警信息' });
    }

    const result = db.prepare(`
      INSERT INTO alerts (type, level, title, description, location, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      type,
      level,
      title,
      description || '',
      location || '',
      imageUrl || null
    );

    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: alert, message: '告警创建成功' });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ success: false, error: '创建告警失败' });
  }
}

export async function getAbnormalVisitors(req: Request, res: Response) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const abnormalVisitors = db.prepare(`
      SELECT 
        ar.person_name,
        COUNT(*) as access_count,
        MIN(ar.access_time) as first_access,
        MAX(ar.access_time) as last_access
      FROM access_records ar
      WHERE ar.access_time >= ?
      GROUP BY ar.person_name
      HAVING access_count >= 5
      ORDER BY access_count DESC
    `).all(twentyFourHoursAgo.toISOString());

    res.json({ success: true, data: abnormalVisitors });
  } catch (error) {
    console.error('Get abnormal visitors error:', error);
    res.status(500).json({ success: false, error: '获取异常访客失败' });
  }
}

export default { getAlerts, getAlertDetail, handleAlert, createAlert, getAbnormalVisitors };
