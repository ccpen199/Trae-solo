import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const bridges = db.prepare('SELECT * FROM ir_bridges WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
    res.json({ success: true, data: bridges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { bridge_id, name, room, ip_address } = req.body;
    if (!bridge_id || !name) {
      return res.status(400).json({ success: false, message: '缺少必填字段bridge_id和name' });
    }

    const result = db.prepare(
      'INSERT INTO ir_bridges (bridge_id, name, status, room, user_id, ip_address, last_heartbeat) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(bridge_id, name, 'online', room || null, req.user!.id, ip_address || null, new Date().toISOString());

    const bridge = db.prepare('SELECT * FROM ir_bridges WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: bridge });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: '网关ID已存在' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/learn', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bridge = db.prepare('SELECT * FROM ir_bridges WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!bridge) {
      return res.status(404).json({ success: false, message: '红外网关不存在' });
    }

    const { device_brand, device_type, code_name, code_data } = req.body;
    if (!device_brand || !device_type || !code_name || !code_data) {
      return res.status(400).json({ success: false, message: '缺少必填字段' });
    }

    const result = db.prepare(
      'INSERT INTO ir_codes (bridge_id, device_brand, device_type, code_name, code_data) VALUES (?, ?, ?, ?, ?)'
    ).run(id, device_brand, device_type, code_name, code_data);

    const code = db.prepare('SELECT * FROM ir_codes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: code });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/send', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bridge = db.prepare('SELECT * FROM ir_bridges WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!bridge) {
      return res.status(404).json({ success: false, message: '红外网关不存在' });
    }

    if (bridge.status === 'offline') {
      return res.status(400).json({ success: false, message: '红外网关离线' });
    }

    const { code_id } = req.body;
    if (!code_id) {
      return res.status(400).json({ success: false, message: '缺少code_id' });
    }

    const code = db.prepare('SELECT * FROM ir_codes WHERE id = ? AND bridge_id = ?').get(code_id, id) as any;
    if (!code) {
      return res.status(404).json({ success: false, message: '红外码不存在' });
    }

    db.prepare('UPDATE ir_bridges SET last_heartbeat = ? WHERE id = ?').run(new Date().toISOString(), id);

    res.json({
      success: true,
      data: {
        bridgeId: id,
        codeId: code_id,
        codeName: code.code_name,
        deviceBrand: code.device_brand,
        deviceType: code.device_type,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/codes', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bridge = db.prepare('SELECT * FROM ir_bridges WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!bridge) {
      return res.status(404).json({ success: false, message: '红外网关不存在' });
    }

    const codes = db.prepare('SELECT * FROM ir_codes WHERE bridge_id = ? ORDER BY created_at DESC').all(id);
    res.json({ success: true, data: codes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
