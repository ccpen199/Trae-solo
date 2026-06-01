const express = require('express');
const db = require('../database/db');
const { success, error, wrapAsync } = require('../utils/response');

const router = express.Router();

router.get('/home/:homeId', wrapAsync(async (req, res) => {
  const { homeId } = req.params;
  const devices = db.prepare('SELECT * FROM devices WHERE homeId = ? ORDER BY createdAt DESC').all(homeId);
  
  const devicesWithState = devices.map(d => ({
    ...d,
    capabilities: d.capabilities ? JSON.parse(d.capabilities) : {},
    state: d.state ? JSON.parse(d.state) : {},
  }));
  
  res.json(success(devicesWithState));
}));

router.get('/room/:roomId', wrapAsync(async (req, res) => {
  const { roomId } = req.params;
  const devices = db.prepare('SELECT * FROM devices WHERE roomId = ? ORDER BY createdAt DESC').all(roomId);
  
  const devicesWithState = devices.map(d => ({
    ...d,
    capabilities: d.capabilities ? JSON.parse(d.capabilities) : {},
    state: d.state ? JSON.parse(d.state) : {},
  }));
  
  res.json(success(devicesWithState));
}));

router.get('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  
  if (!device) {
    return res.status(404).json(error('设备不存在'));
  }
  
  res.json(success({
    ...device,
    capabilities: device.capabilities ? JSON.parse(device.capabilities) : {},
    state: device.state ? JSON.parse(device.state) : {},
  }));
}));

router.post('/', wrapAsync(async (req, res) => {
  const { homeId, roomId, name, type, icon = '', capabilities = {} } = req.body;
  
  if (!homeId || !name?.trim() || !type) {
    return res.status(400).json(error('参数不完整'));
  }
  
  const id = `dev-${Date.now()}`;
  const now = Date.now();
  const status = 'online';
  const state = JSON.stringify({ power: false });
  
  db.prepare(`
    INSERT INTO devices (id, homeId, roomId, name, type, icon, status, capabilities, state, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, homeId, roomId || null, name.trim(), type, icon, status, JSON.stringify(capabilities), state, now, now);
  
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  res.json(success({
    ...device,
    capabilities: device.capabilities ? JSON.parse(device.capabilities) : {},
    state: device.state ? JSON.parse(device.state) : {},
  }, '设备添加成功'));
}));

router.put('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { name, roomId } = req.body;
  
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  if (!device) {
    return res.status(404).json(error('设备不存在'));
  }
  
  const now = Date.now();
  db.prepare(`
    UPDATE devices 
    SET name = COALESCE(?, name),
        roomId = ?,
        updatedAt = ?
    WHERE id = ?
  `).run(name, roomId || null, now, id);
  
  const updatedDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  res.json(success({
    ...updatedDevice,
    capabilities: updatedDevice.capabilities ? JSON.parse(updatedDevice.capabilities) : {},
    state: updatedDevice.state ? JSON.parse(updatedDevice.state) : {},
  }, '设备信息更新成功'));
}));

router.post('/:id/control', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { action, params = {} } = req.body;
  
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  if (!device) {
    return res.status(404).json(error('设备不存在'));
  }
  
  if (device.status === 'offline') {
    return res.status(400).json(error('设备离线，无法控制'));
  }
  
  const state = device.state ? JSON.parse(device.state) : {};
  
  switch (action) {
    case 'powerOn':
      state.power = true;
      break;
    case 'powerOff':
      state.power = false;
      break;
    case 'toggle':
      state.power = !state.power;
      break;
    case 'setParams':
      Object.assign(state, params);
      break;
    default:
      return res.status(400).json(error('不支持的操作'));
  }
  
  const now = Date.now();
  db.prepare('UPDATE devices SET state = ?, updatedAt = ? WHERE id = ?').run(JSON.stringify(state), now, id);
  
  const actionText = action === 'toggle' 
    ? (state.power ? '开启' : '关闭')
    : (action === 'powerOn' ? '开启' : '关闭');
  
  const insertLog = db.prepare(`
    INSERT INTO automation_logs (id, deviceId, type, message, success, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertLog.run(`log-${Date.now()}`, id, 'device_control', `${actionText}设备`, 1, now);
  
  res.json(success({
    ...device,
    state,
  }, '控制成功'));
}));

router.delete('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  
  const result = db.prepare('DELETE FROM devices WHERE id = ?').run(id);
  
  if (result.changes === 0) {
    return res.status(404).json(error('设备不存在'));
  }
  
  res.json(success(null, '设备删除成功'));
}));

router.get('/search/nearby', wrapAsync(async (req, res) => {
  const mockDevices = [
    { id: 'mock-1', name: '智能灯 Pro', type: 'light', icon: 'lightbulb', signal: 85 },
    { id: 'mock-2', name: '空调伴侣', type: 'ac', icon: 'fan', signal: 72 },
    { id: 'mock-3', name: '智能插座', type: 'outlet', icon: 'plug', signal: 90 },
  ];
  res.json(success(mockDevices));
}));

const deviceCategories = [
  { type: 'light', name: '照明', icon: 'lightbulb', devices: ['吸顶灯', '台灯', '灯带', '氛围灯'] },
  { type: 'ac', name: '空调', icon: 'fan', devices: ['壁挂空调', '柜式空调', '中央空调'] },
  { type: 'outlet', name: '插座', icon: 'plug', devices: ['智能插座', '插排', '墙插'] },
  { type: 'tv', name: '电视', icon: 'tv', devices: ['智能电视', '电视盒子', '投影仪'] },
  { type: 'sensor', name: '传感器', icon: 'thermometer', devices: ['温湿度传感器', '人体传感器', '门磁'] },
  { type: 'curtain', name: '窗帘', icon: 'blinds', devices: ['智能窗帘', '卷帘电机'] },
  { type: 'cleaner', name: '清洁', icon: 'vacuum', devices: ['扫地机器人', '擦窗机器人'] },
];

router.get('/categories/list', wrapAsync(async (req, res) => {
  res.json(success(deviceCategories));
}));

module.exports = router;
