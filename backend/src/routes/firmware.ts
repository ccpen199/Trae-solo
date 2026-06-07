import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/releases', (req: Request, res: Response) => {
  try {
    const { device_model, status } = req.query;

    let sql = 'SELECT * FROM firmware_releases';
    const params: any[] = [];
    const conditions: string[] = [];

    if (device_model) { conditions.push('device_model = ?'); params.push(device_model); }
    if (status) { conditions.push('status = ?'); params.push(status); }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';
    const releases = db.prepare(sql).all(...params);
    res.json({ success: true, data: releases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/releases', authMiddleware, (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    const { version, device_model, file_url, md5, description, is_gray, gray_percentage, status } = req.body;
    if (!version || !device_model) {
      return res.status(400).json({ success: false, message: '缺少必填字段version和device_model' });
    }

    const result = db.prepare(
      'INSERT INTO firmware_releases (version, device_model, file_url, md5, description, is_gray, gray_percentage, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(version, device_model, file_url || null, md5 || null, description || null, is_gray ?? 0, gray_percentage || 0, status || 'draft');

    const release = db.prepare('SELECT * FROM firmware_releases WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: release });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/releases/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    const { id } = req.params;
    const release = db.prepare('SELECT * FROM firmware_releases WHERE id = ?').get(id) as any;
    if (!release) {
      return res.status(404).json({ success: false, message: '固件版本不存在' });
    }

    const { version, device_model, file_url, md5, description, is_gray, gray_percentage, status } = req.body;
    db.prepare(
      `UPDATE firmware_releases SET version = COALESCE(?, version), device_model = COALESCE(?, device_model),
       file_url = COALESCE(?, file_url), md5 = COALESCE(?, md5), description = COALESCE(?, description),
       is_gray = COALESCE(?, is_gray), gray_percentage = COALESCE(?, gray_percentage), status = COALESCE(?, status) WHERE id = ?`
    ).run(version || null, device_model || null, file_url || null, md5 || null, description || null, is_gray ?? null, gray_percentage ?? null, status || null, id);

    const updated = db.prepare('SELECT * FROM firmware_releases WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/releases/:id/push', authMiddleware, (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    const { id } = req.params;
    const release = db.prepare('SELECT * FROM firmware_releases WHERE id = ?').get(id) as any;
    if (!release) {
      return res.status(404).json({ success: false, message: '固件版本不存在' });
    }

    if (release.status !== 'published') {
      return res.status(400).json({ success: false, message: '固件版本尚未发布' });
    }

    let targetDevices = db.prepare('SELECT id FROM devices WHERE model = ? AND user_id IN (SELECT id FROM users)').all(release.device_model) as any[];

    if (release.is_gray && release.gray_percentage < 100) {
      const grayCount = Math.ceil(targetDevices.length * release.gray_percentage / 100);
      targetDevices = targetDevices.slice(0, grayCount);
    }

    const insertUpdate = db.prepare('INSERT OR IGNORE INTO firmware_updates (device_id, firmware_id, status, started_at) VALUES (?, ?, ?, ?)');
    const batch = db.transaction(() => {
      for (const device of targetDevices) {
        insertUpdate.run(device.id, id, 'pending', new Date().toISOString());
      }
    });
    batch();

    res.json({
      success: true,
      data: {
        firmwareId: id,
        version: release.version,
        device_model: release.device_model,
        targetCount: targetDevices.length,
        isGray: !!release.is_gray,
        grayPercentage: release.gray_percentage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/updates', (req: Request, res: Response) => {
  try {
    const { device_id, status } = req.query;

    let sql = 'SELECT fu.*, fr.version, fr.device_model FROM firmware_updates fu JOIN firmware_releases fr ON fu.firmware_id = fr.id';
    const params: any[] = [];
    const conditions: string[] = [];

    if (device_id) { conditions.push('fu.device_id = ?'); params.push(device_id); }
    if (status) { conditions.push('fu.status = ?'); params.push(status); }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY fu.started_at DESC';
    const updates = db.prepare(sql).all(...params);
    res.json({ success: true, data: updates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
