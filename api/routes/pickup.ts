import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();
const CURRENT_USER_ID = 'u1';

function mapPickupRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    senderName: row.sender_name,
    senderPhone: row.sender_phone,
    senderAddress: row.sender_address,
    receiverName: row.receiver_name,
    receiverPhone: row.receiver_phone,
    receiverAddress: row.receiver_address,
    pickupDate: row.pickup_date,
    pickupTimeSlot: row.pickup_time_slot,
    itemType: row.item_type,
    weight: row.weight,
    estimatedFee: row.estimated_fee,
    status: row.status,
    createdAt: row.created_at,
  };
}

router.get('/', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const { status } = req.query;
    let query = 'SELECT * FROM pickup_appointments WHERE user_id = ?';
    const params: unknown[] = [CURRENT_USER_ID];
    if (status) {
      query += ' AND status = ?';
      params.push(status as string);
    }
    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params) as any[];
    res.json(rows.map(mapPickupRow));
  } catch (error) {
    console.error('Failed to fetch pickup appointments:', error);
    res.status(500).json({ error: 'Failed to fetch pickup appointments' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const row = db.prepare('SELECT * FROM pickup_appointments WHERE id = ? AND user_id = ?').get(req.params.id, CURRENT_USER_ID) as any;
    if (!row) {
      res.status(404).json({ error: 'Pickup appointment not found' });
      return;
    }
    res.json(mapPickupRow(row));
  } catch (error) {
    console.error('Failed to fetch pickup appointment:', error);
    res.status(500).json({ error: 'Failed to fetch pickup appointment' });
  }
});

router.post('/', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const id = `p${Date.now()}`;
    const {
      senderName, senderPhone, senderAddress,
      receiverName, receiverPhone, receiverAddress,
      pickupDate, pickupTimeSlot, itemType = 'general',
      weight = 1.0, estimatedFee = 0,
    } = req.body;

    db.prepare(
      `INSERT INTO pickup_appointments (id, user_id, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, pickup_date, pickup_time_slot, item_type, weight, estimated_fee, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run(id, CURRENT_USER_ID, senderName, senderPhone, senderAddress, receiverName, receiverPhone, receiverAddress, pickupDate, pickupTimeSlot, itemType, weight, estimatedFee);

    const row = db.prepare('SELECT * FROM pickup_appointments WHERE id = ?').get(id) as any;
    res.status(201).json(mapPickupRow(row));
  } catch (error) {
    console.error('Failed to create pickup appointment:', error);
    res.status(500).json({ error: 'Failed to create pickup appointment' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const existing = db.prepare('SELECT * FROM pickup_appointments WHERE id = ? AND user_id = ?').get(req.params.id, CURRENT_USER_ID) as any;
    if (!existing) {
      res.status(404).json({ error: 'Pickup appointment not found' });
      return;
    }

    const {
      senderName, senderPhone, senderAddress,
      receiverName, receiverPhone, receiverAddress,
      pickupDate, pickupTimeSlot, itemType, weight, estimatedFee, status,
    } = req.body;

    db.prepare(
      `UPDATE pickup_appointments SET
        sender_name = COALESCE(?, sender_name),
        sender_phone = COALESCE(?, sender_phone),
        sender_address = COALESCE(?, sender_address),
        receiver_name = COALESCE(?, receiver_name),
        receiver_phone = COALESCE(?, receiver_phone),
        receiver_address = COALESCE(?, receiver_address),
        pickup_date = COALESCE(?, pickup_date),
        pickup_time_slot = COALESCE(?, pickup_time_slot),
        item_type = COALESCE(?, item_type),
        weight = COALESCE(?, weight),
        estimated_fee = COALESCE(?, estimated_fee),
        status = COALESCE(?, status)
       WHERE id = ?`
    ).run(senderName ?? null, senderPhone ?? null, senderAddress ?? null,
      receiverName ?? null, receiverPhone ?? null, receiverAddress ?? null,
      pickupDate ?? null, pickupTimeSlot ?? null, itemType ?? null,
      weight ?? null, estimatedFee ?? null, status ?? null, req.params.id);

    const row = db.prepare('SELECT * FROM pickup_appointments WHERE id = ?').get(req.params.id) as any;
    res.json(mapPickupRow(row));
  } catch (error) {
    console.error('Failed to update pickup appointment:', error);
    res.status(500).json({ error: 'Failed to update pickup appointment' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const existing = db.prepare('SELECT * FROM pickup_appointments WHERE id = ? AND user_id = ?').get(req.params.id, CURRENT_USER_ID) as any;
    if (!existing) {
      res.status(404).json({ error: 'Pickup appointment not found' });
      return;
    }
    db.prepare("UPDATE pickup_appointments SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    const row = db.prepare('SELECT * FROM pickup_appointments WHERE id = ?').get(req.params.id) as any;
    res.json(mapPickupRow(row));
  } catch (error) {
    console.error('Failed to cancel pickup appointment:', error);
    res.status(500).json({ error: 'Failed to cancel pickup appointment' });
  }
});

export default router;
