const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const FAULT_TYPES = [
  { value: 'battery', label: '电池没电/电量低' },
  { value: 'brake', label: '刹车故障' },
  { value: 'lock', label: '车锁故障' },
  { value: 'light', label: '车灯不亮' },
  { value: 'tire', label: '车胎问题' },
  { value: 'seat', label: '座椅问题' },
  { value: 'handlebar', label: '车把问题' },
  { value: 'other', label: '其他故障' }
];

const REPORT_TYPES = [
  { value: 'parking', label: '乱停乱放' },
  { value: 'private_lock', label: '私占车辆' },
  { value: 'damage', label: '车辆损坏' },
  { value: 'other', label: '其他问题' }
];

router.get('/fault-types', authenticateToken, (req, res) => {
  res.json({
    success: true,
    types: FAULT_TYPES
  });
});

router.post('/fault', authenticateToken, (req, res) => {
  const { bikeCode, faultType, description, photos, locationLat, locationLng } = req.body;

  if (!bikeCode) {
    return res.status(400).json({ error: '请扫码或输入车辆编号' });
  }

  if (!faultType) {
    return res.status(400).json({ error: '请选择故障类型' });
  }

  if (description && description.length > 100) {
    return res.status(400).json({ error: '描述不能超过100字' });
  }

  const bike = db.prepare('SELECT * FROM bikes WHERE bike_code = ? OR plate_number = ?').get(bikeCode.toUpperCase(), bikeCode.toUpperCase());

  if (!bike) {
    return res.status(404).json({ error: '车辆不存在，请检查编号是否正确' });
  }

  const result = db.prepare(`
    INSERT INTO fault_reports (user_id, bike_id, bike_code, fault_type, description, photos, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    req.user.id,
    bike.id,
    bike.bike_code,
    faultType,
    description || '',
    photos ? JSON.stringify(photos) : null
  );

  if (faultType === 'battery' || faultType === 'lock' || faultType === 'brake') {
    db.prepare('UPDATE bikes SET status = ? WHERE id = ?').run('maintenance', bike.id);
  }

  res.json({
    success: true,
    message: '故障上报成功，我们将尽快处理',
    reportId: result.lastInsertRowid,
    bikeCode: bike.bike_code
  });
});

router.get('/report-types', authenticateToken, (req, res) => {
  res.json({
    success: true,
    types: REPORT_TYPES
  });
});

router.post('/report', authenticateToken, (req, res) => {
  const { reportType, bikeCode, description, photos, locationLat, locationLng } = req.body;

  if (!reportType) {
    return res.status(400).json({ error: '请选择举报类型' });
  }

  const result = db.prepare(`
    INSERT INTO reports (user_id, report_type, bike_code, description, photos, location_lat, location_lng, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    req.user.id,
    reportType,
    bikeCode || null,
    description || '',
    photos ? JSON.stringify(photos) : null,
    locationLat || null,
    locationLng || null
  );

  res.json({
    success: true,
    message: '举报已提交，感谢您的反馈',
    reportId: result.lastInsertRowid
  });
});

router.get('/my-reports', authenticateToken, (req, res) => {
  const faultReports = db.prepare(`
    SELECT fr.id, fr.bike_code, fr.fault_type, fr.description, fr.status, fr.created_at,
           b.plate_number
    FROM fault_reports fr
    LEFT JOIN bikes b ON fr.bike_id = b.id
    WHERE fr.user_id = ?
    ORDER BY fr.created_at DESC
    LIMIT 20
  `).all(req.user.id);

  const otherReports = db.prepare(`
    SELECT id, report_type, bike_code, description, status, created_at
    FROM reports
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.user.id);

  res.json({
    success: true,
    faultReports: faultReports.map(r => ({
      ...r,
      typeLabel: FAULT_TYPES.find(t => t.value === r.fault_type)?.label || r.fault_type,
      statusLabel: r.status === 'pending' ? '待处理' : r.status === 'processing' ? '处理中' : '已处理'
    })),
    otherReports: otherReports.map(r => ({
      ...r,
      typeLabel: REPORT_TYPES.find(t => t.value === r.report_type)?.label || r.report_type,
      statusLabel: r.status === 'pending' ? '待处理' : r.status === 'processing' ? '处理中' : '已处理'
    }))
  });
});

router.get('/help-info', authenticateToken, (req, res) => {
  res.json({
    success: true,
    helpSections: [
      {
        title: '常见问题',
        items: [
          { question: '如何开锁骑行？', answer: '打开APP，点击"扫码用车"扫描车锁上的二维码，或手动输入车牌号开锁。' },
          { question: '如何还车？', answer: '将车辆停放在指定还车点，在APP内点击"还车"按钮即可。' },
          { question: '忘关锁怎么办？', answer: '系统会自动检测长时间未移动的车辆并自动锁车，您也可以联系客服协助处理。' },
          { question: '押金如何退还？', answer: '在"我的"页面点击"押金管理"，申请退款后1-7个工作日原路返回。' }
        ]
      },
      {
        title: '联系客服',
        phone: '400-123-4567',
        serviceTime: '7:00 - 23:00',
        email: 'service@jietubike.com'
      }
    ]
  });
});

module.exports = router;
