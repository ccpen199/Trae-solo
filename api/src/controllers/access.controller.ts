import { Request, Response } from 'express';
import db from '../database/connection.js';
import type { VisitorPass, CreateVisitorRequest, AccessRecord, AccessDevice } from '../../../shared/types.js';

export async function getVisitorPasses(req: Request & { user?: any }, res: Response) {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM visitor_passes WHERE creator_id = ?';
    const params: any[] = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const passes = db.prepare(query).all(...params) as (VisitorPass & { access_areas: string })[];
    const formattedPasses = passes.map(p => ({
      ...p,
      access_areas: JSON.parse(p.access_areas || '[]')
    }));

    res.json({ success: true, data: formattedPasses });
  } catch (error) {
    console.error('Get visitor passes error:', error);
    res.status(500).json({ success: false, error: '获取访客通行证失败' });
  }
}

export async function createVisitorPass(req: Request & { user?: any }, res: Response) {
  try {
    const { visitorName, visitorPhone, visitorIdCard, validFrom, validTo, accessAreas }: CreateVisitorRequest = req.body;

    if (!visitorName || !visitorPhone || !validFrom || !validTo || !accessAreas) {
      return res.status(400).json({ success: false, error: '请填写完整的访客信息' });
    }

    const qrCode = `VP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = db.prepare(`
      INSERT INTO visitor_passes (creator_id, visitor_name, visitor_phone, visitor_id_card, qr_code, access_areas, valid_from, valid_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      visitorName,
      visitorPhone,
      visitorIdCard || null,
      qrCode,
      JSON.stringify(accessAreas),
      validFrom,
      validTo
    );

    const pass = db.prepare('SELECT * FROM visitor_passes WHERE id = ?').get(result.lastInsertRowid) as (VisitorPass & { access_areas: string }) | undefined;

    if (pass) {
      pass.access_areas = JSON.parse(pass.access_areas || '[]');
    }

    res.json({ success: true, data: pass, message: '访客通行证创建成功' });
  } catch (error) {
    console.error('Create visitor pass error:', error);
    res.status(500).json({ success: false, error: '创建访客通行证失败' });
  }
}

export async function getAccessRecords(req: Request & { user?: any }, res: Response) {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const records = db.prepare(`
      SELECT ar.*, vp.visitor_name, ad.name as device_name
      FROM access_records ar
      LEFT JOIN visitor_passes vp ON ar.pass_id = vp.id
      LEFT JOIN access_devices ad ON ar.device_id = ad.id
      ORDER BY ar.access_time DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as AccessRecord[];

    const total = db.prepare('SELECT COUNT(*) as count FROM access_records').get() as { count: number };

    res.json({ success: true, data: { records, total: total.count } });
  } catch (error) {
    console.error('Get access records error:', error);
    res.status(500).json({ success: false, error: '获取通行记录失败' });
  }
}

export async function getAccessDevices(req: Request, res: Response) {
  try {
    const devices = db.prepare('SELECT * FROM access_devices ORDER BY id').all() as AccessDevice[];
    res.json({ success: true, data: devices });
  } catch (error) {
    console.error('Get access devices error:', error);
    res.status(500).json({ success: false, error: '获取门禁设备失败' });
  }
}

export async function verifyPass(req: Request, res: Response) {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ success: false, error: '请提供二维码' });
    }

    const pass = db.prepare('SELECT * FROM visitor_passes WHERE qr_code = ?').get(qrCode) as (VisitorPass & { access_areas: string }) | undefined;

    if (!pass) {
      return res.status(404).json({ success: false, error: '通行证不存在' });
    }

    const now = new Date();
    const validFrom = new Date(pass.valid_from);
    const validTo = new Date(pass.valid_to);

    if (now < validFrom || now > validTo) {
      db.prepare('UPDATE visitor_passes SET status = ? WHERE id = ?').run('expired', pass.id);
      return res.status(403).json({ success: false, error: '通行证已过期' });
    }

    if (pass.status !== 'active') {
      return res.status(403).json({ success: false, error: '通行证状态无效' });
    }

    db.prepare(`
      INSERT INTO access_records (pass_id, access_type, result, person_name)
      VALUES (?, ?, ?, ?)
    `).run(pass.id, 'qr', 'success', pass.visitor_name);

    res.json({ success: true, data: { ...pass, access_areas: JSON.parse(pass.access_areas || '[]') }, message: '验证通过' });
  } catch (error) {
    console.error('Verify pass error:', error);
    res.status(500).json({ success: false, error: '验证失败' });
  }
}

export default { getVisitorPasses, createVisitorPass, getAccessRecords, getAccessDevices, verifyPass };
