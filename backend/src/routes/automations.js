const express = require('express');
const db = require('../database/db');
const { success, error, wrapAsync } = require('../utils/response');

const router = express.Router();

router.get('/home/:homeId', wrapAsync(async (req, res) => {
  const { homeId } = req.params;
  const automations = db.prepare('SELECT * FROM automations WHERE homeId = ? ORDER BY createdAt DESC').all(homeId);
  
  const result = automations.map(a => ({
    ...a,
    conditions: a.conditions ? JSON.parse(a.conditions) : [],
    actions: a.actions ? JSON.parse(a.actions) : [],
  }));
  
  res.json(success(result));
}));

router.get('/logs/home/:homeId', wrapAsync(async (req, res) => {
  const { homeId } = req.params;
  const { limit = 50 } = req.query;
  
  const logs = db.prepare(`
    SELECT al.*, a.name as automationName, d.name as deviceName
    FROM automation_logs al
    LEFT JOIN automations a ON al.automationId = a.id
    LEFT JOIN devices d ON al.deviceId = d.id
    WHERE a.homeId = ? OR d.homeId = ?
    ORDER BY al.createdAt DESC
    LIMIT ?
  `).all(homeId, homeId, limit);
  
  res.json(success(logs));
}));

router.post('/', wrapAsync(async (req, res) => {
  const { homeId, name, conditions = [], actions = [] } = req.body;
  
  if (!homeId || !name?.trim()) {
    return res.status(400).json(error('参数不完整'));
  }
  
  const id = `auto-${Date.now()}`;
  const now = Date.now();
  
  db.prepare(`
    INSERT INTO automations (id, homeId, name, enabled, conditions, actions, createdAt, updatedAt)
    VALUES (?, ?, ?, 1, ?, ?, ?, ?)
  `).run(id, homeId, name.trim(), JSON.stringify(conditions), JSON.stringify(actions), now, now);
  
  const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(id);
  res.json(success({
    ...automation,
    conditions: automation.conditions ? JSON.parse(automation.conditions) : [],
    actions: automation.actions ? JSON.parse(automation.actions) : [],
  }, '自动化创建成功'));
}));

router.put('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { name, enabled, conditions, actions } = req.body;
  
  const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(id);
  if (!automation) {
    return res.status(404).json(error('自动化不存在'));
  }
  
  const now = Date.now();
  const conditionsStr = conditions ? JSON.stringify(conditions) : automation.conditions;
  const actionsStr = actions ? JSON.stringify(actions) : automation.actions;
  
  db.prepare(`
    UPDATE automations 
    SET name = COALESCE(?, name),
        enabled = COALESCE(?, enabled),
        conditions = ?,
        actions = ?,
        updatedAt = ?
    WHERE id = ?
  `).run(name, enabled, conditionsStr, actionsStr, now, id);
  
  const updatedAutomation = db.prepare('SELECT * FROM automations WHERE id = ?').get(id);
  res.json(success({
    ...updatedAutomation,
    conditions: updatedAutomation.conditions ? JSON.parse(updatedAutomation.conditions) : [],
    actions: updatedAutomation.actions ? JSON.parse(updatedAutomation.actions) : [],
  }, '自动化更新成功'));
}));

router.delete('/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  
  const result = db.prepare('DELETE FROM automations WHERE id = ?').run(id);
  
  if (result.changes === 0) {
    return res.status(404).json(error('自动化不存在'));
  }
  
  res.json(success(null, '自动化删除成功'));
}));

const recommendedAutomations = [
  {
    name: '回家模式',
    description: '18:00 自动打开所有设备',
    conditions: [{ type: 'manual' }],
    actions: [{ type: 'device', action: 'powerOn' }],
  },
  {
    name: '离家模式',
    description: '关闭所有设备',
    conditions: [{ type: 'manual' }],
    actions: [{ type: 'device', action: 'powerOff' }],
  },
  {
    name: '睡眠模式',
    description: '关闭所有灯',
    conditions: [{ type: 'manual' }],
    actions: [{ type: 'device', action: 'powerOff' }],
  },
];

router.post('/:id/execute', wrapAsync(async (req, res) => {
  const { id } = req.params;
  
  const automation = db.prepare('SELECT * FROM automations WHERE id = ?').get(id);
  if (!automation) {
    return res.status(404).json(error('自动化不存在'));
  }
  
  if (!automation.enabled) {
    return res.status(400).json(error('自动化已禁用'));
  }
  
  const actions = automation.actions ? JSON.parse(automation.actions) : [];
  const now = Date.now();
  const executedDevices = [];
  
  const devices = db.prepare('SELECT * FROM devices WHERE homeId = ? AND status = ?').all(automation.homeId, 'online');
  
  for (const device of devices) {
    const state = device.state ? JSON.parse(device.state) : {};
    
    for (const action of actions) {
      if (action.type === 'device') {
        if (action.action === 'powerOn') {
          state.power = true;
        } else if (action.action === 'powerOff') {
          state.power = false;
        }
      }
    }
    
    db.prepare('UPDATE devices SET state = ?, updatedAt = ? WHERE id = ?').run(
      JSON.stringify(state), now, device.id
    );
    
    executedDevices.push(device.name);
    
    db.prepare(`
      INSERT INTO automation_logs (id, automationId, deviceId, type, message, success, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}-${device.id}`, 
      id, 
      device.id, 
      'automation', 
      `${automation.name}: ${state.power ? '开启' : '关闭'}`, 
      1, 
      now
    );
  }
  
  res.json(success({
    automationName: automation.name,
    executedDevices,
    message: `已执行自动化: 控制${executedDevices.length}个设备`
  }, '自动化执行成功'));
}));

router.get('/recommended/list', wrapAsync(async (req, res) => {
  res.json(success(recommendedAutomations));
}));

module.exports = router;
