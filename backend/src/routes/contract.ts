import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (req.query.status) {
      where += ' AND ct.status = ?';
      params.push(req.query.status);
    }
    if (req.query.shipper_id) {
      where += ' AND ct.shipper_id = ?';
      params.push(req.query.shipper_id);
    }
    if (req.query.carrier_id) {
      where += ' AND ct.carrier_id = ?';
      params.push(req.query.carrier_id);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM contracts ct ${where}`).get(...params) as any).count;
    const items = db.prepare(`
      SELECT ct.*,
        su.real_name as shipper_name, su.company_name as shipper_company,
        cu.real_name as carrier_name, cu.company_name as carrier_company,
        c.cargo_name, v.plate_number
      FROM contracts ct
      LEFT JOIN users su ON ct.shipper_id = su.id
      LEFT JOIN users cu ON ct.carrier_id = cu.id
      LEFT JOIN cargo c ON ct.cargo_id = c.id
      LEFT JOIN vehicles v ON ct.vehicle_id = v.id
      ${where}
      ORDER BY ct.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: '获取合同列表失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { cargo_id, vehicle_id } = req.body;

    if (!cargo_id || !vehicle_id) {
      res.status(400).json({ error: '货源ID和车辆ID为必填项' });
      return;
    }

    const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(cargo_id) as any;
    if (!cargo) {
      res.status(404).json({ error: '货源不存在' });
      return;
    }

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id) as any;
    if (!vehicle) {
      res.status(404).json({ error: '车辆不存在' });
      return;
    }

    const shipper = db.prepare('SELECT * FROM users WHERE id = ?').get(cargo.user_id) as any;
    const carrier = db.prepare('SELECT * FROM users WHERE id = ?').get(vehicle.user_id) as any;

    const contract_number = `CT-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const content = `托运方：${shipper.real_name || shipper.username}（${shipper.company_name}）\n承运方：${carrier.real_name || carrier.username}（${carrier.company_name}）\n货物：${cargo.cargo_name}，重量${cargo.weight}吨，体积${cargo.volume}立方米\n起运地：${cargo.origin_province}${cargo.origin_city}\n目的地：${cargo.dest_province}${cargo.dest_city}\n运输车辆：${vehicle.plate_number}\n预算运费：${cargo.budget}元`;

    const result = db.prepare(`
      INSERT INTO contracts (shipper_id, carrier_id, cargo_id, vehicle_id, contract_number, content, status)
      VALUES (?, ?, ?, ?, ?, ?, 'draft')
    `).run(shipper.id, carrier.id, cargo_id, vehicle_id, contract_number, content);

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ error: '生成合同失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contract = db.prepare(`
      SELECT ct.*,
        su.real_name as shipper_name, su.company_name as shipper_company, su.phone as shipper_phone,
        cu.real_name as carrier_name, cu.company_name as carrier_company, cu.phone as carrier_phone,
        c.cargo_name, c.weight, c.volume, c.origin_city, c.dest_city,
        v.plate_number, v.vehicle_type
      FROM contracts ct
      LEFT JOIN users su ON ct.shipper_id = su.id
      LEFT JOIN users cu ON ct.carrier_id = cu.id
      LEFT JOIN cargo c ON ct.cargo_id = c.id
      LEFT JOIN vehicles v ON ct.vehicle_id = v.id
      WHERE ct.id = ?
    `).get(req.params.id);

    if (!contract) {
      res.status(404).json({ error: '合同不存在' });
      return;
    }
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: '获取合同详情失败' });
  }
});

router.post('/:id/sign', async (req: Request, res: Response) => {
  try {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any;
    if (!contract) {
      res.status(404).json({ error: '合同不存在' });
      return;
    }

    const { signature } = req.body;
    if (!signature) {
      res.status(400).json({ error: '签名为必填项' });
      return;
    }

    const now = new Date().toISOString();

    if (req.user!.userId === contract.shipper_id) {
      db.prepare(`UPDATE contracts SET shipper_signature = ?, shipper_signature_time = ?, status = 'signing', updated_at = datetime('now') WHERE id = ?`).run(signature, now, req.params.id);
    } else if (req.user!.userId === contract.carrier_id) {
      db.prepare(`UPDATE contracts SET carrier_signature = ?, carrier_signature_time = ?, updated_at = datetime('now') WHERE id = ?`).run(signature, now, req.params.id);
    } else {
      res.status(403).json({ error: '无权签署此合同' });
      return;
    }

    const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any;
    if (updated.shipper_signature && updated.carrier_signature) {
      const caSerial = `CA-${new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14)}-${uuidv4().substring(0, 6).toUpperCase()}`;
      db.prepare(`UPDATE contracts SET ca_serial = ?, status = 'signed', updated_at = datetime('now') WHERE id = ?`).run(caSerial, req.params.id);
    }

    const finalContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    res.json(finalContract);
  } catch (err) {
    res.status(500).json({ error: '签署合同失败' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: '状态为必填项' });
      return;
    }

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any;
    if (!contract) {
      res.status(404).json({ error: '合同不存在' });
      return;
    }

    db.prepare("UPDATE contracts SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新合同状态失败' });
  }
});

export default router;
