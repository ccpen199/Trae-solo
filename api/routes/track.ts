import { Router } from 'express';
import db from '../db';
import type { TrackingEvent, Waybill } from '../../shared/types';

const router = Router();

router.get('/:trackingNo', (req, res) => {
  const waybill = db.prepare('SELECT * FROM waybills WHERE tracking_no = ?').get(req.params.trackingNo) as any;
  if (!waybill) {
    return res.status(404).json({ error: '运单不存在' });
  }
  const events = db
    .prepare('SELECT * FROM tracking_events WHERE waybill_id = ? ORDER BY timestamp DESC')
    .all(waybill.id) as any[];
  const trackingEvents: TrackingEvent[] = events.map((e) => ({
    id: e.id,
    waybillId: e.waybill_id,
    status: e.status,
    location: e.location,
    description: e.description,
    timestamp: e.timestamp,
  }));
  const waybillData: Waybill = {
    id: waybill.id,
    trackingNo: waybill.tracking_no,
    userId: waybill.user_id,
    senderName: waybill.sender_name,
    senderPhone: waybill.sender_phone,
    senderAddress: waybill.sender_address,
    receiverName: waybill.receiver_name,
    receiverPhone: waybill.receiver_phone,
    receiverAddress: waybill.receiver_address,
    itemType: waybill.item_type,
    weight: waybill.weight,
    volume: waybill.volume,
    isSpecial: !!waybill.is_special,
    specialDesc: waybill.special_desc,
    serviceLevel: waybill.service_level,
    pickupTime: waybill.pickup_time,
    freight: waybill.freight,
    status: waybill.status,
    outletId: waybill.outlet_id,
    createdAt: waybill.created_at,
  };
  res.json({ waybill: waybillData, events: trackingEvents });
});

router.post('/batch', (req, res) => {
  const { trackingNos } = req.body as { trackingNos: string[] };
  if (!trackingNos || !Array.isArray(trackingNos)) {
    return res.status(400).json({ error: '参数错误' });
  }
  const results = trackingNos.map((no) => {
    const waybill = db.prepare('SELECT * FROM waybills WHERE tracking_no = ?').get(no) as any;
    if (!waybill) return { trackingNo: no, found: false };
    const events = db
      .prepare('SELECT * FROM tracking_events WHERE waybill_id = ? ORDER BY timestamp DESC')
      .all(waybill.id) as any[];
    return {
      trackingNo: no,
      found: true,
      status: waybill.status,
      latestEvent: events[0]
        ? {
            description: events[0].description,
            timestamp: events[0].timestamp,
            location: events[0].location,
          }
        : null,
    };
  });
  res.json(results);
});

router.get('/history/list', (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 3600 * 1000).toISOString();
  const waybills = db
    .prepare(
      `SELECT w.*, (SELECT description FROM tracking_events WHERE waybill_id = w.id ORDER BY timestamp DESC LIMIT 1) as latest_desc, (SELECT timestamp FROM tracking_events WHERE waybill_id = w.id ORDER BY timestamp DESC LIMIT 1) as latest_time FROM waybills w WHERE w.user_id = ? AND w.created_at >= ? ORDER BY w.created_at DESC`
    )
    .all(userId, sixMonthsAgo) as any[];
  res.json(
    waybills.map((w) => ({
      id: w.id,
      trackingNo: w.tracking_no,
      status: w.status,
      receiverName: w.receiver_name,
      receiverAddress: w.receiver_address,
      freight: w.freight,
      createdAt: w.created_at,
      latestDesc: w.latest_desc,
      latestTime: w.latest_time,
    }))
  );
});

export default router;
