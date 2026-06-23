require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Device = require('../models/Device');

const API_BASE_URL = `http://localhost:${process.env.PORT || 3001}/api`;

class DeviceSimulator {
  constructor() {
    this.devices = [];
    this.simulating = false;
    this.interval = null;
  }

  async init() {
    await connectDB();
    this.devices = await Device.find({ status: { $ne: 'sleep' } });
    console.log(`📱 加载 ${this.devices.length} 台设备进行模拟`);
  }

  generateHeartbeatData(device) {
    const now = Date.now();
    const isActive = Math.random() > 0.3;
    
    return {
      signalStrength: Math.floor(Math.random() * 20) + 10,
      temperature: Math.floor(Math.random() * 15) + 35,
      batteryLevel: Math.floor(Math.random() * 30) + 70,
      valveStatus: isActive ? 'open' : 'closed',
      flowRate: isActive ? parseFloat((Math.random() * 5 + 2).toFixed(2)) : 0,
      totalWaterUsage: (device.totalWaterUsage || 0) + Math.floor(Math.random() * 50),
      status: 'normal',
      firmwareVersion: device.firmwareVersion,
      timestamp: now
    };
  }

  async sendHeartbeat(device) {
    try {
      const heartbeatData = this.generateHeartbeatData(device);
      
      await axios.post(
        `${API_BASE_URL}/devices/iot/heartbeat`,
        heartbeatData,
        {
          headers: {
            'X-Device-Id': device.deviceId,
            'X-Device-Token': 'simulator-token'
          }
        }
      );
      
      console.log(`💓 设备 ${device.deviceId} (${device.deviceName}) 心跳上报成功`);
      
      device.totalWaterUsage = heartbeatData.totalWaterUsage;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log(`⚠️  设备 ${device.deviceId} 认证失败，跳过`);
      } else {
        console.error(`❌ 设备 ${device.deviceId} 心跳上报失败:`, error.message);
      }
    }
  }

  async simulateRandomFault() {
    if (Math.random() > 0.95 && this.devices.length > 0) {
      const randomDevice = this.devices[Math.floor(Math.random() * this.devices.length)];
      
      try {
        const faultData = {
          signalStrength: Math.floor(Math.random() * 10),
          temperature: Math.floor(Math.random() * 20) + 70,
          batteryLevel: Math.floor(Math.random() * 10),
          valveStatus: 'fault',
          flowRate: 0,
          totalWaterUsage: randomDevice.totalWaterUsage || 0,
          status: 'error',
          faultCode: 'E' + Math.floor(Math.random() * 999 + 100),
          faultMessage: ['电磁阀故障', '温度传感器异常', '水压过低', '通信模块故障'][Math.floor(Math.random() * 4)],
          firmwareVersion: randomDevice.firmwareVersion,
          timestamp: Date.now()
        };

        await axios.post(
          `${API_BASE_URL}/devices/iot/heartbeat`,
          faultData,
          {
            headers: {
              'X-Device-Id': randomDevice.deviceId,
              'X-Device-Token': 'simulator-token'
            }
          }
        );

        console.log(`⚠️  设备 ${randomDevice.deviceId} 模拟故障: ${faultData.faultMessage}`);
      } catch (error) {
        console.error(`❌ 故障模拟失败:`, error.message);
      }
    }
  }

  async simulateAbnormalUsage() {
    if (Math.random() > 0.97 && this.devices.length > 0) {
      const randomDevice = this.devices[Math.floor(Math.random() * this.devices.length)];
      
      try {
        const abnormalData = {
          signalStrength: 25,
          temperature: 45,
          batteryLevel: 85,
          valveStatus: 'open',
          flowRate: 15,
          totalWaterUsage: (randomDevice.totalWaterUsage || 0) + 1000,
          status: 'normal',
          firmwareVersion: randomDevice.firmwareVersion,
          timestamp: Date.now()
        };

        await axios.post(
          `${API_BASE_URL}/devices/iot/heartbeat`,
          abnormalData,
          {
            headers: {
              'X-Device-Id': randomDevice.deviceId,
              'X-Device-Token': 'simulator-token'
            }
          }
        );

        console.log(`🚰 设备 ${randomDevice.deviceId} 模拟异常用水: 流量 ${abnormalData.flowRate}L/min`);
      } catch (error) {
        console.error(`❌ 异常用水模拟失败:`, error.message);
      }
    }
  }

  start(intervalMs = 60000) {
    if (this.simulating) {
      console.log('⚠️  模拟器已在运行');
      return;
    }

    this.simulating = true;
    console.log(`🚀 设备模拟器启动，间隔 ${intervalMs / 1000} 秒`);

    this.interval = setInterval(async () => {
      console.log(`\n━━━━━━━━━ 心跳周期开始 ━━━━━━━━━`);
      
      for (const device of this.devices) {
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.sendHeartbeat(device);
      }

      await this.simulateRandomFault();
      await this.simulateAbnormalUsage();

      console.log(`━━━━━━━━━ 心跳周期结束 ━━━━━━━━━\n`);
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.simulating = false;
    console.log('⏹️ 设备模拟器已停止');
  }

  async simulateWaterUsage(studentId, deviceId, duration) {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const waterVolume = parseFloat((Math.random() * 30 + 10).toFixed(1));
    const avgTemperature = parseFloat((Math.random() * 10 + 40).toFixed(1));

    try {
      const adminLogin = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
        username: 'admin',
        password: 'admin123'
      });
      const adminToken = adminLogin.data.data.token;

      const studentLogin = await axios.post(`${API_BASE_URL}/auth/student/login`, {
        studentId,
        password: '123456'
      });
      const studentToken = studentLogin.data.data.token;

      const response = await axios.post(
        `${API_BASE_URL}/students/${studentId}/use-water`,
        {
          deviceId,
          duration,
          waterVolume,
          avgTemperature,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${studentToken}`
          }
        }
      );

      console.log(`✅ 用水记录创建成功: ${waterVolume}L, 费用 ¥${response.data.data.cost}`);
      return response.data;
    } catch (error) {
      console.error(`❌ 用水模拟失败:`, error.response?.data?.message || error.message);
      throw error;
    }
  }
}

if (require.main === module) {
  const simulator = new DeviceSimulator();
  
  simulator.init().then(() => {
    simulator.start(30000);
  }).catch(err => {
    console.error('模拟器初始化失败:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    simulator.stop();
    process.exit(0);
  });
}

module.exports = DeviceSimulator;
