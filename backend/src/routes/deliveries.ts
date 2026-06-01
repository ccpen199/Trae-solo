import { Router } from 'express';
import { db } from '../data/db.js';

const router = Router();

function calcProgress(d: Record<string, unknown>): number {
  if (d.delivery_confirmed) return 100;
  if (d.download_url) return 85;
  if (d.retouching_stage === '已完成') return 60;
  if (d.retouching_stage === '修图中') return 60;
  if (d.selection_done) return 30;
  if (d.status === '选片中') return 30;
  return 0;
}

router.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT d.*, o.order_no, b.client_name
    FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    JOIN bookings b ON b.id = o.booking_id
    ORDER BY d.created_at DESC
  `).all();
  res.json({ success: true, data: rows });
});

router.get('/:id', (req, res) => {
  const delivery = db.prepare(`
    SELECT d.*, o.order_no, o.amount AS order_amount, o.paid_amount,
      b.client_name, b.shoot_type, b.shoot_date,
      p.name AS photographer_name
    FROM deliveries d
    JOIN orders o ON o.id = d.order_id
    JOIN bookings b ON b.id = o.booking_id
    LEFT JOIN photographers p ON p.id = b.photographer_id
    WHERE d.id = ?
  `).get(req.params.id);
  if (!delivery) {
    return res.status(404).json({ success: false, message: '交付记录不存在' });
  }
  res.json({ success: true, data: delivery });
});

router.post('/', (req, res) => {
  const { order_id, album_name, delivery_date, channel } = req.body ?? {};
  if (!order_id) {
    return res.status(400).json({ success: false, message: 'order_id 不能为空' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  const result = db.prepare(`
    INSERT INTO deliveries (order_id, album_name, delivery_date, channel)
    VALUES (@order_id, @album_name, @delivery_date, @channel)
  `).run({
    order_id: Number(order_id),
    album_name: album_name || null,
    delivery_date: delivery_date || null,
    channel: channel || '网盘',
  });

  const created = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: created });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!delivery) {
    return res.status(404).json({ success: false, message: '交付记录不存在' });
  }

  const { action } = req.body ?? {};

  switch (action) {
    case 'start_selection': {
      db.prepare(`
        UPDATE deliveries SET selection_done = 0, status = '选片中', progress = 30, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      break;
    }
    case 'complete_selection': {
      const { selection_count } = req.body;
      const progress = 30;
      db.prepare(`
        UPDATE deliveries SET selection_done = 1, selection_count = @selection_count, progress = @progress, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({ id, selection_count: selection_count || 0, progress });
      break;
    }
    case 'start_retouching': {
      db.prepare(`
        UPDATE deliveries SET retouching_stage = '修图中', status = '修图中', progress = 60, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      break;
    }
    case 'complete_retouching': {
      const { retouching_count } = req.body;
      db.prepare(`
        UPDATE deliveries SET retouching_stage = '已完成', retouching_count = @retouching_count, progress = 60, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({ id, retouching_count: retouching_count || 0 });
      break;
    }
    case 'set_download_url': {
      const { download_url } = req.body;
      if (!download_url) {
        return res.status(400).json({ success: false, message: '下载链接不能为空' });
      }
      db.prepare(`
        UPDATE deliveries SET download_url = @download_url, status = '待确认', progress = 85, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({ id, download_url });
      break;
    }
    case 'add_extra_retouch': {
      const { count, fee } = req.body;
      const extraCount = Number(count || 1);
      const extraFee = Number(fee || 0);
      db.prepare(`
        UPDATE deliveries SET
          extra_retouch_count = extra_retouch_count + @extraCount,
          extra_retouch_fee = extra_retouch_fee + @extraFee,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({ id, extraCount, extraFee });
      break;
    }
    case 'confirm_delivery': {
      db.prepare(`
        UPDATE deliveries SET
          delivery_confirmed = 1,
          confirmed_at = CURRENT_TIMESTAMP,
          status = '已完成',
          progress = 100,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      break;
    }
    default: {
      const { album_name, delivery_date, channel, status } = req.body ?? {};
      db.prepare(`
        UPDATE deliveries SET
          album_name = COALESCE(@album_name, album_name),
          delivery_date = COALESCE(@delivery_date, delivery_date),
          channel = COALESCE(@channel, channel),
          status = COALESCE(@status, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `).run({
        id,
        album_name: album_name ?? null,
        delivery_date: delivery_date ?? null,
        channel: channel ?? null,
        status: status ?? null,
      });
    }
  }

  const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

export default router;
