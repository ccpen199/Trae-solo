const express = require('express');
const db = require('../database/db');
const { success, error, wrapAsync } = require('../utils/response');

const router = express.Router();

const commandMapping = {
  '打开灯': { action: 'powerOn', deviceType: 'light' },
  '开灯': { action: 'powerOn', deviceType: 'light' },
  '关灯': { action: 'powerOff', deviceType: 'light' },
  '关闭灯': { action: 'powerOff', deviceType: 'light' },
  '打开空调': { action: 'powerOn', deviceType: 'ac' },
  '开空调': { action: 'powerOn', deviceType: 'ac' },
  '关空调': { action: 'powerOff', deviceType: 'ac' },
  '关闭空调': { action: 'powerOff', deviceType: 'ac' },
  '打开电视': { action: 'powerOn', deviceType: 'tv' },
  '关闭电视': { action: 'powerOff', deviceType: 'tv' },
};

const recommendedCommands = [
  '打开客厅灯',
  '关闭空调',
  '打开电视',
  '所有灯打开',
  '关闭所有设备',
  '温度调到25度',
];

router.get('/recommended/commands', wrapAsync(async (req, res) => {
  res.json(success(recommendedCommands));
}));

router.post('/execute', wrapAsync(async (req, res) => {
  const { homeId, command } = req.body;
  
  if (!homeId || !command?.trim()) {
    return res.status(400).json(error('参数不完整'));
  }
  
  const now = Date.now();
  const id = `voice-${Date.now()}`;
  
  let matched = false;
  let resultMessage = '';
  let controlledDevices = [];
  
  const commandLower = command.toLowerCase();
  const turnOn = commandLower.includes('打开') || commandLower.includes('开') || commandLower.includes('开启');
  
  if (commandLower.includes('所有灯') || commandLower.includes('全部灯')) {
    const devices = db.prepare(
      'SELECT * FROM devices WHERE homeId = ? AND type = ? AND status = ?'
    ).all(homeId, 'light', 'online');
    
    for (const device of devices) {
      const state = device.state ? JSON.parse(device.state) : {};
      state.power = turnOn;
      
      db.prepare('UPDATE devices SET state = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(state), now, device.id
      );
      
      controlledDevices.push(device.name);
    }
    
    matched = true;
    resultMessage = controlledDevices.length > 0 
      ? `已${turnOn ? '打开' : '关闭'}${controlledDevices.join('、')}` 
      : '没有找到可控制的灯设备';
      
  } else if (commandLower.includes('所有设备') || commandLower.includes('全部设备')) {
    const devices = db.prepare(
      'SELECT * FROM devices WHERE homeId = ? AND status = ?'
    ).all(homeId, 'online');
    
    for (const device of devices) {
      const state = device.state ? JSON.parse(device.state) : {};
      state.power = turnOn;
      
      db.prepare('UPDATE devices SET state = ?, updatedAt = ? WHERE id = ?').run(
        JSON.stringify(state), now, device.id
      );
      
      controlledDevices.push(device.name);
    }
    
    matched = true;
    resultMessage = controlledDevices.length > 0 
      ? `已${turnOn ? '打开' : '关闭'}${controlledDevices.join('、')}` 
      : '没有找到可控制的设备';
      
  } else {
    let targetDeviceType = null;
    let targetDeviceName = null;
    
    if (commandLower.includes('灯') || commandLower.includes('照明')) {
      targetDeviceType = 'light';
    } else if (commandLower.includes('空调') || commandLower.includes('冷气')) {
      targetDeviceType = 'ac';
    } else if (commandLower.includes('电视')) {
      targetDeviceType = 'tv';
    } else if (commandLower.includes('插座') || commandLower.includes('插排')) {
      targetDeviceType = 'outlet';
    }
    
    if (targetDeviceType) {
      const devices = db.prepare(
        'SELECT * FROM devices WHERE homeId = ? AND type = ? AND status = ?'
      ).all(homeId, targetDeviceType, 'online');
      
      for (const device of devices) {
        const state = device.state ? JSON.parse(device.state) : {};
        state.power = turnOn;
        
        db.prepare('UPDATE devices SET state = ?, updatedAt = ? WHERE id = ?').run(
          JSON.stringify(state), now, device.id
        );
        
        controlledDevices.push(device.name);
      }
      
      matched = true;
      resultMessage = controlledDevices.length > 0 
        ? `已${turnOn ? '打开' : '关闭'}${controlledDevices.join('、')}` 
        : `没有找到可控制的${targetDeviceType}设备`;
    }
  }
  
  if (!matched) {
    resultMessage = '未识别到有效指令，请重试';
  }
  
  db.prepare(`
    INSERT INTO voice_commands (id, homeId, command, result, success, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, homeId, command, resultMessage, matched ? 1 : 0, now);
  
  res.json(success({
    success: matched,
    message: resultMessage,
    controlledDevices,
  }));
}));

router.get('/history/home/:homeId', wrapAsync(async (req, res) => {
  const { homeId } = req.params;
  const { limit = 20 } = req.query;
  
  const history = db.prepare(
    'SELECT * FROM voice_commands WHERE homeId = ? ORDER BY createdAt DESC LIMIT ?'
  ).all(homeId, limit);
  
  res.json(success(history));
}));

module.exports = router;
