const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const deviceStates = {};
const targetTemperatures = {};
const ledStates = {};
const videoStates = {};

const MOCK_DEVICES = [
  { deviceId: 'GW-001', deviceName: '客厅网关', deviceType: 'gateway' },
  { deviceId: 'LED-001', deviceName: '客厅主灯', deviceType: 'led' },
  { deviceId: 'LED-002', deviceName: '卧室灯', deviceType: 'led' },
  { deviceId: 'TEMP-001', deviceName: '温度传感器-客厅', deviceType: 'temperature' },
  { deviceId: 'TEMP-002', deviceName: '温度传感器-卧室', deviceType: 'temperature' },
  { deviceId: 'CAM-001', deviceName: '客厅摄像头', deviceType: 'camera' },
  { deviceId: 'CAM-002', deviceName: '门口摄像头', deviceType: 'camera' }
];

function initMockDevices() {
  MOCK_DEVICES.forEach(device => {
    const existing = db.get('SELECT * FROM devices WHERE device_id = ?', [device.deviceId]);
    
    if (!existing) {
      db.run(
        'INSERT INTO devices (device_id, device_name, device_type, status) VALUES (?, ?, ?, ?)',
        [device.deviceId, device.deviceName, device.deviceType, 'online']
      );
    } else {
      db.run(
        'UPDATE devices SET status = ?, last_online = CURRENT_TIMESTAMP WHERE device_id = ?',
        ['online', device.deviceId]
      );
    }
    
    deviceStates[device.deviceId] = {
      ...device,
      status: 'online',
      lastOnline: new Date()
    };
    
    if (device.deviceType === 'led') {
      ledStates[device.deviceId] = {
        status: 'off',
        brightness: 100,
        color: '#ffffff'
      };
    }
    
    if (device.deviceType === 'temperature') {
      targetTemperatures[device.deviceId] = 25;
    }
    
    if (device.deviceType === 'camera') {
      videoStates[device.deviceId] = {
        isStreaming: false,
        lastSnapshot: null
      };
    }
  });
  
  console.log('模拟设备初始化完成:', MOCK_DEVICES.length, '个设备');
}

function getAllDevices() {
  const devices = db.all('SELECT * FROM devices ORDER BY device_type, device_id');
  
  return devices.map(device => {
    const latestData = getLatestDeviceData(device.device_id);
    return {
      ...device,
      latestData
    };
  });
}

function getLatestDeviceData(deviceId) {
  const dataTypes = ['led_status', 'temperature', 'video_snapshot', 'package_info', 'transfer_status'];
  const result = {};
  
  dataTypes.forEach(dataType => {
    const data = db.get(`
      SELECT * FROM device_data 
      WHERE device_id = ? AND data_type = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [deviceId, dataType]);
    
    if (data) {
      result[dataType] = {
        value: data.value,
        metadata: data.metadata ? JSON.parse(data.metadata) : null,
        timestamp: data.created_at
      };
    }
  });
  
  if (ledStates[deviceId]) {
    result['led_status'] = {
      value: ledStates[deviceId].status,
      metadata: {
        brightness: ledStates[deviceId].brightness,
        color: ledStates[deviceId].color
      },
      timestamp: new Date().toISOString()
    };
  }
  
  return result;
}

function getCurrentTemperature(deviceId) {
  const record = db.get(`
    SELECT * FROM temperature_records 
    WHERE device_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `, [deviceId]);
  
  return record ? record.temperature : null;
}

function getTargetTemperature(deviceId) {
  return targetTemperatures[deviceId] || 25;
}

function getTemperatureHistory(deviceId, limit = 100, hours = 24) {
  return db.all(`
    SELECT * FROM temperature_records 
    WHERE device_id = ? 
    AND created_at >= datetime('now', '-' || ? || ' hours')
    ORDER BY created_at DESC 
    LIMIT ?
  `, [deviceId, hours, limit]);
}

function controlLed(deviceId, params) {
  const { status, brightness, color } = params;
  
  if (!ledStates[deviceId]) {
    ledStates[deviceId] = {};
  }
  
  ledStates[deviceId].status = status || 'off';
  if (brightness !== undefined) {
    ledStates[deviceId].brightness = brightness;
  }
  if (color) {
    ledStates[deviceId].color = color;
  }
  
  db.run(
    'INSERT INTO device_data (device_id, data_type, value, metadata) VALUES (?, ?, ?, ?)',
    [
      deviceId,
      'led_status',
      ledStates[deviceId].status,
      JSON.stringify({
        brightness: ledStates[deviceId].brightness,
        color: ledStates[deviceId].color
      })
    ]
  );
  
  console.log(`LED控制 [${deviceId}]: status=${status}, brightness=${brightness}, color=${color}`);
  
  return {
    deviceId,
    ...ledStates[deviceId],
    timestamp: new Date().toISOString()
  };
}

function setTemperature(deviceId, params) {
  const { targetTemperature, mode } = params;
  
  targetTemperatures[deviceId] = targetTemperature;
  
  db.run(
    'INSERT INTO device_data (device_id, data_type, value, metadata) VALUES (?, ?, ?, ?)',
    [
      deviceId,
      'temperature_target',
      targetTemperature.toString(),
      JSON.stringify({ mode })
    ]
  );
  
  console.log(`温度控制 [${deviceId}]: target=${targetTemperature}°C, mode=${mode}`);
  
  return {
    deviceId,
    targetTemperature,
    mode: mode || 'auto',
    timestamp: new Date().toISOString()
  };
}

function controlVideo(deviceId, action) {
  if (!videoStates[deviceId]) {
    videoStates[deviceId] = {};
  }
  
  switch (action) {
    case 'start_stream':
      videoStates[deviceId].isStreaming = true;
      break;
    case 'stop_stream':
      videoStates[deviceId].isStreaming = false;
      break;
    case 'snapshot':
      return generateSnapshot(deviceId);
  }
  
  console.log(`视频控制 [${deviceId}]: action=${action}`);
  
  return {
    deviceId,
    action,
    isStreaming: videoStates[deviceId].isStreaming,
    timestamp: new Date().toISOString()
  };
}

function getLatestSnapshot(deviceId) {
  return db.get(`
    SELECT * FROM video_snapshots 
    WHERE device_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `, [deviceId]);
}

function generateSnapshot(deviceId) {
  const uploadPath = path.join(__dirname, '..', '..', process.env.VIDEO_PATH || './videos');
  
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  const timestamp = Date.now();
  const fileName = `${deviceId}_${timestamp}.jpg`;
  const filePath = path.join(uploadPath, fileName);
  
  const placeholderImage = Buffer.from(
    'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    'base64'
  );
  
  fs.writeFileSync(filePath, placeholderImage);
  
  const fileSize = fs.statSync(filePath).size;
  
  db.run(
    'INSERT INTO video_snapshots (device_id, file_path, file_name, file_size) VALUES (?, ?, ?, ?)',
    [deviceId, filePath, fileName, fileSize]
  );
  
  console.log(`快照已生成 [${deviceId}]: ${fileName}`);
  
  return {
    deviceId,
    fileName,
    filePath: `/videos/${fileName}`,
    fileSize,
    timestamp: new Date().toISOString()
  };
}

function startTemperatureCollection() {
  const interval = parseInt(process.env.TEMP_COLLECT_INTERVAL) || 3000;
  const precision = parseInt(process.env.TEMP_CONTROL_PRECISION) || 2;
  
  console.log(`温度采集已启动，间隔: ${interval}ms, 精度: ±${precision}°C`);
  
  setInterval(() => {
    Object.keys(targetTemperatures).forEach(deviceId => {
      const target = targetTemperatures[deviceId] || 25;
      
      const existingRecords = db.all(`
        SELECT temperature FROM temperature_records 
        WHERE device_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [deviceId]);
      
      let currentTemp;
      if (existingRecords.length > 0) {
        currentTemp = existingRecords[0].temperature;
        const diff = target - currentTemp;
        if (Math.abs(diff) > 0.5) {
          currentTemp += (diff > 0 ? 0.5 : -0.5);
          currentTemp = Math.round(currentTemp * 10) / 10;
        }
      } else {
        currentTemp = 22 + (Math.random() * 6 - 3);
        currentTemp = Math.round(currentTemp * 10) / 10;
      }
      
      db.run(
        'INSERT INTO temperature_records (device_id, temperature, target_temperature) VALUES (?, ?, ?)',
        [deviceId, currentTemp, target]
      );
      
      db.run(
        'INSERT INTO device_data (device_id, data_type, value, metadata) VALUES (?, ?, ?, ?)',
        [deviceId, 'temperature', currentTemp.toString(), JSON.stringify({ target: target })]
      );
    });
  }, interval);
}

function createAlert(alertType, deviceId, message, severity = 'info') {
  db.run(
    'INSERT INTO alerts (alert_type, device_id, message, severity) VALUES (?, ?, ?, ?)',
    [alertType, deviceId, message, severity]
  );
  
  console.log(`告警 [${severity}]: ${message} (设备: ${deviceId || '系统'})`);
  
  return {
    alertType,
    deviceId,
    message,
    severity,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  initMockDevices,
  getAllDevices,
  getLatestDeviceData,
  getCurrentTemperature,
  getTargetTemperature,
  getTemperatureHistory,
  controlLed,
  setTemperature,
  controlVideo,
  getLatestSnapshot,
  generateSnapshot,
  startTemperatureCollection,
  createAlert
};
