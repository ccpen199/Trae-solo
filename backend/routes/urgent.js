import { Router } from 'express';
import db from '../db.js';

const router = Router();

function generateUrgentOrderNo() {
  const prefix = 'UGT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

router.post('/order', (req, res) => {
  try {
    const { user_id, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, item_type, weight, urgency } = req.body;

    if (!sender_address || !receiver_address) {
      return res.status(400).json({ error: '地址不能为空' });
    }

    const orderNo = generateUrgentOrderNo();
    const urgencyLevel = urgency || 'normal';
    const slaMinutes = urgencyLevel === 'immediate' ? 20 : urgencyLevel === 'urgent' ? 40 : 60;
    const baseFee = urgencyLevel === 'immediate' ? 38 : urgencyLevel === 'urgent' ? 28 : 18;
    const weightNum = parseFloat(weight) || 1;
    const fee = baseFee + Math.max(0, weightNum - 5) * 3;
    const estimatedPickup = new Date(Date.now() + 10 * 60 * 1000);
    const estimatedDelivery = new Date(Date.now() + slaMinutes * 60 * 1000);

    const availableCouriers = [
      { id: 1, name: '张配送', phone: '13900139000', rating: 4.8, vehicle_type: '电动车', distance_km: 1.2, estimated_arrival_min: 8 },
      { id: 2, name: '李骑手', phone: '13800138888', rating: 4.6, vehicle_type: '摩托车', distance_km: 2.1, estimated_arrival_min: 12 },
      { id: 3, name: '王速递', phone: '13700137000', rating: 4.9, vehicle_type: '电动车', distance_km: 0.8, estimated_arrival_min: 5 }
    ];
    const assignedCourier = availableCouriers[0];

    res.json({
      id: Date.now(),
      order_no: orderNo,
      status: 'pending',
      urgency: urgencyLevel,
      sender_name: sender_name || '张三',
      sender_phone: sender_phone || '13800138000',
      sender_address,
      receiver_name: receiver_name || '收件人',
      receiver_phone: receiver_phone || '',
      receiver_address,
      item_type: item_type || '文件',
      weight: weightNum,
      courier_id: assignedCourier.id,
      courier_name: assignedCourier.name,
      sla_minutes: slaMinutes,
      fee: fee,
      estimated_pickup: estimatedPickup.toISOString(),
      estimated_delivery: estimatedDelivery.toISOString(),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/fee/estimate', (req, res) => {
  try {
    const { weight, urgency } = req.body;
    const urgencyLevel = urgency || 'normal';
    const baseFee = urgencyLevel === 'immediate' ? 38 : urgencyLevel === 'urgent' ? 28 : 18;
    const weightNum = parseFloat(weight) || 1;
    const total = baseFee + Math.max(0, weightNum - 5) * 3;
    res.json({
      base_fee: baseFee,
      per_kg: 3,
      total: total,
      urgency: urgencyLevel,
      weight: weightNum,
      description: urgencyLevel === 'immediate' ? '即时送：首5kg ¥38，超出部分 ¥3/kg' : urgencyLevel === 'urgent' ? '快速送：首5kg ¥28，超出部分 ¥3/kg' : '普通送：首5kg ¥18，超出部分 ¥3/kg'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/couriers/available', (req, res) => {
  try {
    const mockCouriers = [
      { id: 1, name: '张配送', phone: '13900139000', rating: 4.8, vehicle_type: '电动车', current_location: '朝阳区望京', distance_km: 1.2, estimated_arrival_min: 8, status: 'available' },
      { id: 2, name: '李骑手', phone: '13800138888', rating: 4.6, vehicle_type: '摩托车', current_location: '朝阳区三里屯', distance_km: 2.1, estimated_arrival_min: 12, status: 'available' },
      { id: 3, name: '王速递', phone: '13700137000', rating: 4.9, vehicle_type: '电动车', current_location: '朝阳区国贸', distance_km: 0.8, estimated_arrival_min: 5, status: 'available' }
    ];
    res.json(mockCouriers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/order/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const statuses = ['pending', 'assigned', 'picking_up', 'in_transit', 'delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    res.json({
      order_id: id,
      status: randomStatus,
      courier: {
        name: '张配送',
        phone: '13900139000',
        location: { lat: 39.9042 + (Math.random() - 0.5) * 0.1, lng: 116.4074 + (Math.random() - 0.5) * 0.1 }
      },
      current_location: '朝阳区某街道',
      remaining_minutes: Math.floor(Math.random() * 30) + 5,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/order/:id/courier/dispatch', (req, res) => {
  try {
    const { id } = req.params;
    const { courier_id } = req.body;
    if (!courier_id) {
      return res.status(400).json({ error: '快递员ID不能为空' });
    }
    const courier = db.prepare('SELECT * FROM courier WHERE id = ?').get(courier_id);
    res.json({
      order_id: id,
      courier_id,
      courier: courier || { id: courier_id, name: '李骑手', phone: '13800138888', status: 'busy', current_location: { lat: 39.9142, lng: 116.4174 } },
      dispatched_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
