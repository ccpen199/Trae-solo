const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/types', (req, res) => {
  res.json({
    types: [
      { id: 'regular', name: '普通包裹', description: '经济实惠，时效3-7天', basePrice: 8, pricePerKg: 3 },
      { id: 'ems', name: 'EMS特快', description: '快速送达，时效1-3天', basePrice: 20, pricePerKg: 10 },
      { id: 'international', name: '国际邮件', description: '跨境物流，时效7-30天', basePrice: 50, pricePerKg: 30 }
    ]
  });
});

router.get('/my', authenticateToken, (req, res) => {
  const db = getDb();
  const packages = db.prepare(`
    SELECT * FROM packages WHERE sender = ? ORDER BY created_at DESC
  `).all(req.user.username);
  
  res.json({ packages });
});

router.post('/track', (req, res) => {
  const { tracking_number } = req.body;
  
  if (!tracking_number || tracking_number.trim() === '') {
    return res.status(400).json({ error: '请输入运单号' });
  }

  const db = getDb();
  
  let pkg = db.prepare('SELECT * FROM packages WHERE tracking_number = ?').get(tracking_number);
  
  if (!pkg) {
    let type = 'regular';
    const tn = tracking_number.toUpperCase();
    if (/^E[A-Z]\d{9}[A-Z]{2}$/.test(tn)) {
      type = 'ems';
    } else if (/^(CP|RA)\d{9}[A-Z]{2}$/.test(tn)) {
      type = 'international';
    } else if (/^(PA|KA)\d{11}$/.test(tn)) {
      type = 'regular';
    }

    const statusFlow = {
      regular: ['已揽收', '运输中', '运输中', '派送中', '已签收'],
      ems: ['已揽收', '运输中', '派送中', '已签收'],
      international: ['已揽收', '运输中', '运输中', '运输中', '派送中', '已签收']
    };
    const flow = statusFlow[type];
    const randomIdx = Math.floor(Math.random() * flow.length);
    const currentStatus = flow[randomIdx];
    
    const locations = {
      regular: ['北京市海淀区营业部', '北京转运中心', '济南转运中心', '济南市历下区营业部', '济南市历下区投递站'],
      ems: ['北京市朝阳区EMS揽收点', '北京EMS分拨中心', '上海EMS分拨中心', '上海浦东新区EMS投递站'],
      international: ['北京国际邮件处理中心', '出境海关查验', '转机中心', '入境海关清关', '目的地国分拨中心', '目的地国投递站']
    };
    const locs = locations[type];
    
    const senderNames = ['王建国', '李明远', '张秀英', '刘德成'];
    const receiverNames = ['陈思雨', '赵文博', '孙丽华', '周志强'];
    const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市'];

    const sender = senderNames[Math.floor(Math.random() * senderNames.length)];
    const receiver = receiverNames[Math.floor(Math.random() * receiverNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    db.prepare(`
      INSERT INTO packages (tracking_number, type, sender, receiver, receiver_address, receiver_phone, status, current_location, weight)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tracking_number,
      type,
      sender,
      receiver,
      city + '某某区某某街道' + Math.floor(Math.random() * 200 + 1) + '号',
      '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
      currentStatus,
      locs[Math.min(randomIdx, locs.length - 1)],
      (Math.random() * 5 + 0.5).toFixed(2)
    );
    
    pkg = db.prepare('SELECT * FROM packages WHERE tracking_number = ?').get(tracking_number);
    
    const typeNames = { regular: '普通包裹', ems: 'EMS特快', international: '国际邮件' };
    for (let i = 0; i <= randomIdx; i++) {
      const desc = i === 0 ? `${sender}已寄出${typeNames[type]}` :
                   i === randomIdx ? `当前状态：${flow[i]}` :
                   `已到达${locs[Math.min(i, locs.length - 1)]}`;
      db.prepare(`
        INSERT INTO package_tracking (package_id, status, location, description)
        VALUES (?, ?, ?, ?)
      `).run(pkg.id, flow[i], locs[Math.min(i, locs.length - 1)], desc);
    }
  }
  
  const trackingHistory = db.prepare(`
    SELECT * FROM package_tracking WHERE package_id = ? ORDER BY created_at DESC
  `).all(pkg.id);
  
  res.json({ package: pkg, trackingHistory });
});

router.post('/', authenticateToken, (req, res) => {
  const { type, receiver, receiver_address, receiver_phone, weight } = req.body;
  const db = getDb();
  
  if (!type) {
    return res.status(400).json({ error: '请选择包裹类型' });
  }
  if (!receiver || receiver.trim() === '') {
    return res.status(400).json({ error: '请输入收件人姓名' });
  }
  if (!receiver_phone || receiver_phone.trim() === '') {
    return res.status(400).json({ error: '请输入收件人电话' });
  }
  if (!receiver_address || receiver_address.trim() === '') {
    return res.status(400).json({ error: '请输入收件地址' });
  }
  
  const weightNum = parseFloat(weight) || 0;
  if (weightNum <= 0) {
    return res.status(400).json({ error: '请输入有效的包裹重量' });
  }
  if (weightNum > 30) {
    return res.status(400).json({ error: '单件包裹重量不能超过30kg' });
  }
  
  const priceConfig = {
    regular: { basePrice: 8, pricePerKg: 3, name: '普通包裹', prefix: 'PA' },
    ems: { basePrice: 20, pricePerKg: 10, name: 'EMS特快', prefix: 'EA' },
    international: { basePrice: 50, pricePerKg: 30, name: '国际邮件', prefix: 'CP' }
  };
  
  const config = priceConfig[type] || priceConfig.regular;
  const estimatedFee = (config.basePrice + weightNum * config.pricePerKg).toFixed(2);
  
  const tracking_number = config.prefix + Date.now().toString().slice(-9) + 'CN';
  
  try {
    const result = db.prepare(`
      INSERT INTO packages (tracking_number, type, sender, receiver, receiver_address, receiver_phone, weight, status, current_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, '待揽收', '等待快递员揽收')
    `).run(tracking_number, type, req.user.username, receiver, receiver_address, receiver_phone, weightNum);
    
    db.prepare(`
      INSERT INTO package_tracking (package_id, status, location, description)
      VALUES (?, ?, ?, ?)
    `).run(result.lastInsertRowid, '待揽收', '系统', `${config.name}运单已创建，等待快递员上门揽收`);
    
    res.json({ 
      id: result.lastInsertRowid, 
      tracking_number,
      type: config.name,
      estimatedFee,
      weight: weightNum,
      message: '包裹创建成功，运单号已生成'
    });
  } catch (err) {
    res.status(500).json({ error: '创建失败：' + err.message });
  }
});

module.exports = router;
