import { Router } from 'express';
import type { DbInstance } from '../db-type';

const router = Router();

const mockPlatforms = [
  { orderId: 'TB20250601001', platform: '淘宝', waybillNo: 'SF2025060100001', product: '无线蓝牙耳机', status: 'shipped' },
  { orderId: 'TB20250602002', platform: '淘宝', waybillNo: 'SF2025060200002', product: '纯棉T恤', status: 'delivered' },
  { orderId: 'JD20250603003', platform: '京东', waybillNo: 'SF2025060300003', product: '机械键盘', status: 'pending' },
  { orderId: 'PDD20250604004', platform: '拼多多', waybillNo: 'SF2025060400004', product: '手机壳', status: 'shipped' },
  { orderId: 'DY20250605005', platform: '抖音', waybillNo: 'SF2025060500005', product: '护肤品套装', status: 'pending' },
];

router.get('/:waybillNo', (req, res) => {
  try {
    const db: DbInstance = req.app.get('db');
    const waybill = db.prepare('SELECT * FROM waybills WHERE waybill_no = ?').get(req.params.waybillNo) as any;
    if (!waybill) {
      res.status(404).json({ error: 'Waybill not found' });
      return;
    }

    const nodes = db.prepare('SELECT * FROM tracking_nodes WHERE waybill_id = ? ORDER BY time ASC').all(waybill.id) as any[];

    res.json({
      waybillNo: waybill.waybill_no,
      currentStatus: waybill.status,
      nodes: nodes.map(n => ({
        id: n.id,
        waybillId: n.waybill_id,
        time: n.time,
        location: n.location,
        status: n.status,
        description: n.description,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch tracking info:', error);
    res.status(500).json({ error: 'Failed to fetch tracking info' });
  }
});

router.post('/proxy', (req, res) => {
  try {
    const { waybillNo, platform } = req.body;
    if (!waybillNo) {
      res.status(400).json({ error: 'waybillNo is required' });
      return;
    }

    const proxyUrl = `https://track.example.com/proxy/${waybillNo}?platform=${platform || 'default'}`;
    res.json({
      success: true,
      proxyUrl,
      waybillNo,
      platform: platform || 'default',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
  } catch (error) {
    console.error('Failed to create proxy link:', error);
    res.status(500).json({ error: 'Failed to create proxy link' });
  }
});

router.get('/platforms/list', (req, res) => {
  try {
    res.json(mockPlatforms);
  } catch (error) {
    console.error('Failed to fetch platform orders:', error);
    res.status(500).json({ error: 'Failed to fetch platform orders' });
  }
});

export default router;
