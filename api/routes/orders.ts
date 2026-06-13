import { Router } from 'express';
import db from '../db';
import { calculateFreight } from '../services/freight';
import type { Waybill, FreightCalculateRequest } from '../../shared/types';

const router = Router();

function generateTrackingNo(): string {
  return 'ZT' + Date.now().toString().slice(-12);
}

function generateWaybillId(): string {
  return 'wb' + Math.random().toString(36).slice(2, 10);
}

router.post('/', (req, res) => {
  const body = req.body;
  const freightResult = calculateFreight({
    originCity: body.originCity || '北京',
    destCity: body.destCity || '上海',
    weight: body.weight,
    serviceLevel: body.serviceLevel,
  });
  const id = generateWaybillId();
  const trackingNo = generateTrackingNo();

  db.prepare(
    `INSERT INTO waybills (id, tracking_no, user_id, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, item_type, weight, volume, is_special, special_desc, service_level, pickup_time, freight, status, outlet_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    trackingNo,
    body.userId || 1,
    body.senderName,
    body.senderPhone,
    body.senderAddress,
    body.receiverName,
    body.receiverPhone,
    body.receiverAddress,
    body.itemType,
    body.weight,
    body.volume || null,
    body.isSpecial ? 1 : 0,
    body.specialDesc || null,
    body.serviceLevel,
    body.pickupTime,
    freightResult.freight,
    'pending',
    body.outletId || 1
  );

  db.prepare(
    `INSERT INTO tracking_events (waybill_id, status, location, description, timestamp) VALUES (?, ?, ?, ?, ?)`
  ).run(id, 'pending', body.senderAddress, '订单已创建，等待取件', new Date().toISOString());

  const row = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id) as any;
  const waybill: Waybill = {
    id: row.id,
    trackingNo: row.tracking_no,
    userId: row.user_id,
    senderName: row.sender_name,
    senderPhone: row.sender_phone,
    senderAddress: row.sender_address,
    receiverName: row.receiver_name,
    receiverPhone: row.receiver_phone,
    receiverAddress: row.receiver_address,
    itemType: row.item_type,
    weight: row.weight,
    volume: row.volume,
    isSpecial: !!row.is_special,
    specialDesc: row.special_desc,
    serviceLevel: row.service_level,
    pickupTime: row.pickup_time,
    freight: row.freight,
    status: row.status,
    outletId: row.outlet_id,
    createdAt: row.created_at,
  };
  res.status(201).json(waybill);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id) as any;
  if (!row) {
    return res.status(404).json({ error: '运单不存在' });
  }
  const waybill: Waybill = {
    id: row.id,
    trackingNo: row.tracking_no,
    userId: row.user_id,
    senderName: row.sender_name,
    senderPhone: row.sender_phone,
    senderAddress: row.sender_address,
    receiverName: row.receiver_name,
    receiverPhone: row.receiver_phone,
    receiverAddress: row.receiver_address,
    itemType: row.item_type,
    weight: row.weight,
    volume: row.volume,
    isSpecial: !!row.is_special,
    specialDesc: row.special_desc,
    serviceLevel: row.service_level,
    pickupTime: row.pickup_time,
    freight: row.freight,
    status: row.status,
    outletId: row.outlet_id,
    createdAt: row.created_at,
  };
  res.json(waybill);
});

router.get('/:id/waybill', (req, res) => {
  const row = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.id) as any;
  if (!row) {
    return res.status(404).json({ error: '运单不存在' });
  }
  const waybill: Waybill = {
    id: row.id,
    trackingNo: row.tracking_no,
    userId: row.user_id,
    senderName: row.sender_name,
    senderPhone: row.sender_phone,
    senderAddress: row.sender_address,
    receiverName: row.receiver_name,
    receiverPhone: row.receiver_phone,
    receiverAddress: row.receiver_address,
    itemType: row.item_type,
    weight: row.weight,
    volume: row.volume,
    isSpecial: !!row.is_special,
    specialDesc: row.special_desc,
    serviceLevel: row.service_level,
    pickupTime: row.pickup_time,
    freight: row.freight,
    status: row.status,
    outletId: row.outlet_id,
    createdAt: row.created_at,
  };
  const outlet = row.outlet_id ? db.prepare('SELECT * FROM outlets WHERE id = ?').get(row.outlet_id) : null;
  res.json({ waybill, outlet });
});

router.post('/freight/calculate', (req, res) => {
  const params = req.body as FreightCalculateRequest;
  if (!params.originCity || !params.destCity || !params.weight || !params.serviceLevel) {
    return res.status(400).json({ error: '参数不完整' });
  }
  const result = calculateFreight(params);
  res.json(result);
});

export default router;
