import { Router, Response } from 'express';
import db from '../db/database.ts';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.ts';
import { transitionStatus, getStatusLog } from '../services/stateMachine.ts';
import { canTransitionToSigned } from '../services/riskControl.ts';
import { recordOnTimeDelivery, recordLateDelivery } from '../services/credit.ts';

const router = Router();

function generateOrderNo(): string {
  const now = new Date();
  const dd = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DD${timestamp}${random}`;
}

function serializeWaybill(row: any) {
  if (!row) return row;

  const insuranceLevels: Record<string, string> = {
    basic: '基础保价',
    standard: '标准保价',
    premium: '高额保价'
  };

  return {
    ...row,
    sender: {
      name: row.sender_name,
      phone: row.sender_phone,
      address: row.sender_address,
      lat: row.sender_lat,
      lng: row.sender_lng,
    },
    receiver: {
      name: row.receiver_name,
      phone: row.receiver_phone,
      address: row.receiver_address,
      lat: row.receiver_lat,
      lng: row.receiver_lng,
    },
    merchant: row.merchant_id
      ? {
          id: row.merchant_id,
          name: row.merchant_name,
          company_name: row.merchant_name,
        }
      : null,
    knight: row.knight_id
      ? {
          id: row.knight_id,
          name: row.knight_name,
          phone: row.knight_phone,
          type: row.knight_type,
          status: row.knight_status,
          avg_rating: row.knight_avg_rating,
          credit_score: row.knight_credit_score,
          current_load: row.knight_current_load,
          capacity: row.knight_capacity,
          completion_rate: row.knight_total_orders > 0 
            ? parseFloat(((row.knight_completed_orders / row.knight_total_orders) * 100).toFixed(1))
            : 0,
        }
      : null,
    dispatch: row.dispatch_log_id ? {
      distance: row.dispatch_distance ? parseFloat(row.dispatch_distance.toFixed(2)) : null,
      distance_score: row.dispatch_distance_score ? parseFloat(row.dispatch_distance_score.toFixed(4)) : null,
      load_score: row.dispatch_load_score ? parseFloat(row.dispatch_load_score.toFixed(4)) : null,
      history_score: row.dispatch_history_score ? parseFloat(row.dispatch_history_score.toFixed(4)) : null,
      insurance_score: row.dispatch_insurance_score ? parseFloat(row.dispatch_insurance_score.toFixed(4)) : null,
      final_score: row.dispatch_score ? parseFloat(row.dispatch_score.toFixed(4)) : null,
      insurance_level: row.insurance_level,
      insurance_label: insuranceLevels[row.insurance_level] || row.insurance_level,
      insurance_value: row.insurance_value,
    } : {
      insurance_level: row.insurance_level,
      insurance_label: insuranceLevels[row.insurance_level] || row.insurance_level,
      insurance_value: row.insurance_value,
    },
    sla: {
      response_time: row.accepted_at && row.created_at
        ? Math.round((new Date(row.accepted_at).getTime() - new Date(row.created_at).getTime()) / 1000)
        : null,
      pickup_time: row.actual_pickup_time && row.created_at
        ? Math.round((new Date(row.actual_pickup_time).getTime() - new Date(row.created_at).getTime()) / 1000)
        : null,
      delivery_time: row.actual_deliver_time && row.created_at
        ? Math.round((new Date(row.actual_deliver_time).getTime() - new Date(row.created_at).getTime()) / 1000)
        : null,
      pickup_deadline: row.pickup_deadline,
      deliver_deadline: row.deliver_deadline,
      is_ontime: row.status === 'completed' 
        ? (row.actual_deliver_time && row.deliver_deadline ? row.actual_deliver_time <= row.deliver_deadline : null)
        : null,
    },
    status_flow: row.status_flow ? JSON.parse(row.status_flow) : null,
  };
}

function getSLADeadlines(insuranceLevel: string, createdAt: Date) {
  const pickupDeadline = new Date(createdAt.getTime() + 8 * 60 * 1000);
  let deliverMinutes = 60;
  if (insuranceLevel === 'standard') deliverMinutes = 45;
  if (insuranceLevel === 'premium') deliverMinutes = 30;
  const deliverDeadline = new Date(createdAt.getTime() + deliverMinutes * 60 * 1000);
  return {
    pickup_deadline: pickupDeadline.toISOString(),
    deliver_deadline: deliverDeadline.toISOString(),
  };
}

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;

  const status = req.query.status as string;
  const category = req.query.category as string;
  const merchantId = req.query.merchantId as string;

  let sql = `
    SELECT w.*, m.company_name as merchant_name,
           k.name as knight_name, k.phone as knight_phone,
           k.type as knight_type, k.status as knight_status, k.avg_rating as knight_avg_rating,
           k.credit_score as knight_credit_score, k.current_load as knight_current_load,
           k.capacity as knight_capacity, k.total_orders as knight_total_orders,
           k.completed_orders as knight_completed_orders,
           dl.id as dispatch_log_id, dl.distance as dispatch_distance,
           dl.score as dispatch_score, dl.distance_score as dispatch_distance_score,
           dl.load_score as dispatch_load_score, dl.history_score as dispatch_history_score,
           dl.insurance_score as dispatch_insurance_score,
           (
             SELECT json_group_array(json_object(
               'from_status', from_status,
               'to_status', to_status,
               'note', note,
               'created_at', created_at
             )) FROM (
               SELECT from_status, to_status, note, created_at
               FROM waybill_status_log
               WHERE waybill_id = w.id
               ORDER BY created_at ASC
             )
           ) as status_flow
    FROM waybills w
    LEFT JOIN merchants m ON w.merchant_id = m.id
    LEFT JOIN knights k ON w.knight_id = k.id
    LEFT JOIN dispatch_logs dl ON w.id = dl.waybill_id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (status) {
    conditions.push('w.status = ?');
    params.push(status);
  }
  if (category) {
    conditions.push('w.category = ?');
    params.push(category);
  }
  if (merchantId) {
    conditions.push('w.merchant_id = ?');
    params.push(parseInt(merchantId));
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?';
  params.push(pageSize, offset);

  const waybills = db.prepare(sql).all(...params).map(serializeWaybill);

  let countSql = 'SELECT COUNT(*) as count FROM waybills w';
  if (conditions.length > 0) {
    countSql += ' WHERE ' + conditions.join(' AND ');
  }
  const total = db.prepare(countSql).get(...params.slice(0, -2)) as { count: number };

  res.json({
    code: 0,
    data: {
      list: waybills,
      total: total.count,
      page,
      pageSize,
    },
    message: 'Success',
  });
});

router.post('/', authMiddleware, roleMiddleware('admin', 'merchant'), (req: AuthRequest, res: Response) => {
  const {
    merchant_id,
    sender_name,
    sender_phone,
    sender_address,
    sender_lat,
    sender_lng,
    receiver_name,
    receiver_phone,
    receiver_address,
    receiver_lat,
    receiver_lng,
    category,
    insurance_value,
    insurance_level,
    estimated_distance,
    fee,
  } = req.body;

  const orderNo = generateOrderNo();
  const createdAt = new Date();
  const { pickup_deadline, deliver_deadline } = getSLADeadlines(insurance_level || 'basic', createdAt);

  const result = db.prepare(`
    INSERT INTO waybills (
      order_no, merchant_id, sender_name, sender_phone, sender_address, sender_lat, sender_lng,
      receiver_name, receiver_phone, receiver_address, receiver_lat, receiver_lng,
      category, insurance_value, insurance_level,
      pickup_deadline, deliver_deadline, estimated_distance, fee,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNo,
    merchant_id,
    sender_name,
    sender_phone,
    sender_address,
    sender_lat,
    sender_lng,
    receiver_name,
    receiver_phone,
    receiver_address,
    receiver_lat,
    receiver_lng,
    category,
    insurance_value || 0,
    insurance_level || 'basic',
    pickup_deadline,
    deliver_deadline,
    estimated_distance,
    fee || 0,
    createdAt.toISOString(),
    createdAt.toISOString()
  );

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(result.lastInsertRowid);

  db.prepare(`
    INSERT INTO waybill_status_log (waybill_id, from_status, to_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(result.lastInsertRowid, null, 'pending', req.user?.id || null, 'Order created');

  res.json({
    code: 0,
    data: serializeWaybill(waybill),
    message: 'Waybill created successfully',
  });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  const waybill = db.prepare(`
    SELECT w.*, m.company_name as merchant_name,
           k.name as knight_name, k.phone as knight_phone, k.type as knight_type,
           k.status as knight_status, k.avg_rating as knight_avg_rating
    FROM waybills w
    LEFT JOIN merchants m ON w.merchant_id = m.id
    LEFT JOIN knights k ON w.knight_id = k.id
    WHERE w.id = ?
  `).get(id);

  if (!waybill) {
    return res.json({ code: -1, message: 'Waybill not found' });
  }

  const statusLog = getStatusLog(id);

  res.json({
    code: 0,
    data: { ...serializeWaybill(waybill), status_log: statusLog },
    message: 'Success',
  });
});

router.put('/:id/status', authMiddleware, (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const operatorId = req.user?.id || null;

  if (status === 'signed') {
    const check = canTransitionToSigned(id);
    if (!check.allowed) {
      return res.json({ code: -1, message: check.reason || 'Cannot transition to signed' });
    }
  }

  const result = transitionStatus(id, status, operatorId);

  if (!result.success) {
    return res.json({ code: -1, message: result.message });
  }

  if (status === 'completed' && result.waybill) {
    const waybill = result.waybill;
    const actualDeliver = waybill.actual_deliver_time;
    const deadline = waybill.deliver_deadline;
    if (actualDeliver && deadline) {
      if (new Date(actualDeliver) <= new Date(deadline)) {
        recordOnTimeDelivery(waybill.knight_id, id);
      } else {
        recordLateDelivery(waybill.knight_id, id);
      }
    }
  }

  res.json({
    code: 0,
    data: serializeWaybill(result.waybill),
    message: result.message,
  });
});

router.post('/:id/cancel', authMiddleware, roleMiddleware('admin', 'merchant'), (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  const operatorId = req.user?.id || null;

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id) as any;

  if (!waybill) {
    return res.json({ code: -1, message: 'Waybill not found' });
  }

  if (waybill.status !== 'pending') {
    return res.json({ code: -1, message: 'Only pending waybills can be cancelled' });
  }

  db.prepare('UPDATE waybills SET status = ?, cancel_reason = ?, updated_at = ? WHERE id = ?').run(
    'cancelled',
    reason || '',
    new Date().toISOString(),
    id
  );

  db.prepare(`
    INSERT INTO waybill_status_log (waybill_id, from_status, to_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, 'pending', 'cancelled', operatorId, reason || 'Cancelled by merchant');

  const updated = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id);

  res.json({
    code: 0,
    data: serializeWaybill(updated),
    message: 'Waybill cancelled successfully',
  });
});

export default router;
