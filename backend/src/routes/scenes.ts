import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const scenes = db.prepare('SELECT * FROM scenes WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
    const scenesWithParsed = scenes.map((s: any) => ({
      ...s,
      actions: JSON.parse(s.actions),
      trigger_config: s.trigger_config ? JSON.parse(s.trigger_config) : null
    }));
    res.json({ success: true, data: scenesWithParsed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, description, trigger_type, trigger_config, actions, is_geek_mode } = req.body;
    if (!name || !actions) {
      return res.status(400).json({ success: false, message: '缺少必填字段name和actions' });
    }

    const actionsJson = typeof actions === 'string' ? actions : JSON.stringify(actions);
    const triggerConfigJson = trigger_config ? (typeof trigger_config === 'string' ? trigger_config : JSON.stringify(trigger_config)) : null;

    const result = db.prepare(
      'INSERT INTO scenes (name, description, user_id, trigger_type, trigger_config, actions, is_geek_mode) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, description || null, req.user!.id, trigger_type || 'manual', triggerConfigJson, actionsJson, is_geek_mode ?? 0);

    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(result.lastInsertRowid) as any;
    res.status(201).json({
      success: true,
      data: { ...scene, actions: JSON.parse(scene.actions), trigger_config: scene.trigger_config ? JSON.parse(scene.trigger_config) : null }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!scene) {
      return res.status(404).json({ success: false, message: '场景不存在' });
    }

    const { name, description, trigger_type, trigger_config, actions, is_geek_mode } = req.body;
    const actionsJson = actions ? (typeof actions === 'string' ? actions : JSON.stringify(actions)) : null;
    const triggerConfigJson = trigger_config !== undefined ? (trigger_config ? (typeof trigger_config === 'string' ? trigger_config : JSON.stringify(trigger_config)) : null) : null;

    db.prepare(
      `UPDATE scenes SET name = COALESCE(?, name), description = COALESCE(?, description),
       trigger_type = COALESCE(?, trigger_type), trigger_config = COALESCE(?, trigger_config),
       actions = COALESCE(?, actions), is_geek_mode = COALESCE(?, is_geek_mode) WHERE id = ?`
    ).run(name || null, description || null, trigger_type || null, triggerConfigJson, actionsJson, is_geek_mode ?? null, id);

    const updated = db.prepare('SELECT * FROM scenes WHERE id = ?').get(id) as any;
    res.json({
      success: true,
      data: { ...updated, actions: JSON.parse(updated.actions), trigger_config: updated.trigger_config ? JSON.parse(updated.trigger_config) : null }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!scene) {
      return res.status(404).json({ success: false, message: '场景不存在' });
    }

    db.prepare('DELETE FROM scene_logs WHERE scene_id = ?').run(id);
    db.prepare('DELETE FROM scenes WHERE id = ?').run(id);
    res.json({ success: true, message: '场景已删除' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/execute', authMiddleware, (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!scene) {
      return res.status(404).json({ success: false, message: '场景不存在' });
    }

    const actions = JSON.parse(scene.actions);
    const deviceResults: Array<{ device_name: string, action: string, success: number, error?: string }> = [];
    let allSuccess = true;

    for (const action of actions) {
      try {
        if (action.device_id && action.command) {
          const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(action.device_id) as any;
          if (device) {
            if (action.command === 'turn_on' || action.command === 'turn_off') {
              db.prepare('UPDATE devices SET status = ?, last_online = CURRENT_TIMESTAMP WHERE id = ?').run(
                action.command === 'turn_on' ? 'online' : 'offline', action.device_id
              );
            }
            deviceResults.push({
              device_name: device.name,
              action: action.command,
              success: 1
            });
          } else {
            deviceResults.push({
              device_name: `未知设备(${action.device_id})`,
              action: action.command,
              success: 0,
              error: '设备不存在'
            });
            allSuccess = false;
          }
        } else if (action.set_value) {
          deviceResults.push({
            device_name: action.device_id ? `设备${action.device_id}` : '系统',
            action: `设置${JSON.stringify(action.set_value)}`,
            success: 1
          });
        } else {
          deviceResults.push({
            device_name: '系统',
            action: JSON.stringify(action),
            success: 1
          });
        }
      } catch (err: any) {
        deviceResults.push({
          device_name: action.device_id ? `设备${action.device_id}` : '系统',
          action: action.command || JSON.stringify(action),
          success: 0,
          error: err.message
        });
        allSuccess = false;
      }
    }

    const executionDuration = Date.now() - startTime;
    const executedAt = new Date().toISOString();

    const { trigger_source } = req.body;
    db.prepare('INSERT INTO scene_logs (scene_id, trigger_source, success, error_message) VALUES (?, ?, ?, ?)').run(
      id, trigger_source || scene.trigger_type, allSuccess ? 1 : 0, allSuccess ? null : '部分动作执行失败'
    );

    db.prepare('UPDATE scenes SET last_executed_at = ?, execution_count = COALESCE(execution_count, 0) + 1 WHERE id = ?').run(
      executedAt, id
    );

    res.json({
      success: true,
      data: {
        sceneId: id,
        sceneName: scene.name,
        isGeekMode: !!scene.is_geek_mode,
        allSuccess,
        executedAt,
        executionDurationMs: executionDuration,
        device_results: deviceResults
      }
    });
  } catch (error: any) {
    const executionDuration = Date.now() - startTime;
    db.prepare('INSERT INTO scene_logs (scene_id, trigger_source, success, error_message) VALUES (?, ?, ?, ?)').run(
      req.params.id, 'unknown', 0, error.message
    );
    res.status(500).json({
      success: false,
      message: error.message,
      executionDurationMs: executionDuration
    });
  }
});

export default router;
