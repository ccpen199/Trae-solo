require('dotenv').config();
const mongoose = require('mongoose');
const cron = require('node-cron');
const connectDB = require('../config/database');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const EnergyUsage = require('../models/EnergyUsage');
const DormitoryBuilding = require('../models/DormitoryBuilding');
const { generateAlertId } = require('../utils/generateId');

class AnomalyDetector {
  constructor() {
    this.heartbeatTimeout = parseInt(process.env.HEARTBEAT_TIMEOUT) || 180000;
    this.running = false;
  }

  async init() {
    await connectDB();
    console.log('🔍 异常检测器初始化完成');
  }

  async detectOfflineDevices() {
    console.log('🔍 检测离线设备...');
    
    const cutoffTime = new Date(Date.now() - this.heartbeatTimeout);
    
    const offlineDevices = await Device.find({
      status: { $in: ['online', 'offline'] },
      isSleepMode: false,
      $or: [
        { lastHeartbeat: { $lt: cutoffTime } },
        { lastHeartbeat: null }
      ]
    });

    for (const device of offlineDevices) {
      const existingAlert = await Alert.findOne({
        deviceId: device.deviceId,
        alertType: 'device_offline',
        status: { $in: ['new', 'acknowledged', 'processing'] }
      });

      if (!existingAlert) {
        const alertId = generateAlertId();
        const alert = new Alert({
          alertId,
          alertType: 'device_offline',
          severity: 'critical',
          deviceId: device.deviceId,
          buildingId: device.buildingId,
          title: `设备离线告警: ${device.deviceName}`,
          description: `设备 ${device.deviceId} 已超过 ${this.heartbeatTimeout / 1000} 秒未上报心跳`,
          data: {
            deviceName: device.deviceName,
            location: device.location,
            lastHeartbeat: device.lastHeartbeat,
            signalStrength: device.signalStrength
          }
        });

        await alert.save();

        device.status = 'offline';
        device.updatedAt = Date.now();
        await device.save();

        console.log(`🚨 设备离线告警: ${device.deviceId} - ${device.deviceName}`);
      }
    }

    console.log(`✅ 离线设备检测完成，发现 ${offlineDevices.length} 台离线设备`);
  }

  async detectAbnormalUsage() {
    console.log('🔍 检测异常用水...');
    
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const devices = await Device.find({ status: 'online' });

    for (const device of devices) {
      const recentUsage = await EnergyUsage.aggregate([
        {
          $match: {
            deviceId: device.deviceId,
            startTime: { $gte: twoHoursAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalDuration: { $sum: '$duration' },
            totalVolume: { $sum: '$waterVolume' },
            count: { $sum: 1 }
          }
        }
      ]);

      if (recentUsage.length > 0 && recentUsage[0].totalDuration >= 7200) {
        const existingAlert = await Alert.findOne({
          deviceId: device.deviceId,
          alertType: 'abnormal_usage',
          status: { $in: ['new', 'acknowledged', 'processing'] }
        });

        if (!existingAlert) {
          const alertId = generateAlertId();
          const alert = new Alert({
            alertId,
            alertType: 'abnormal_usage',
            severity: 'warning',
            deviceId: device.deviceId,
            buildingId: device.buildingId,
            title: `异常用水检测: ${device.deviceName}`,
            description: `设备连续运行超过2小时，累计用水 ${recentUsage[0].totalVolume.toFixed(1)}L`,
            data: {
              deviceName: device.deviceName,
              location: device.location,
              totalDuration: recentUsage[0].totalDuration,
              totalVolume: recentUsage[0].totalVolume,
              usageCount: recentUsage[0].count
            }
          });

          await alert.save();

          await EnergyUsage.updateMany(
            {
              deviceId: device.deviceId,
              startTime: { $gte: twoHoursAgo },
              isAbnormal: false
            },
            {
              $set: {
                isAbnormal: true,
                abnormalReason: '连续运行超过2小时'
              }
            }
          );

          console.log(`🚨 异常用水告警: ${device.deviceId} - 连续运行 ${recentUsage[0].totalDuration / 60} 分钟`);
        }
      }
    }

    console.log('✅ 异常用水检测完成');
  }

  async detectWaterLeak() {
    console.log('🔍 检测漏水情况...');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const leakDevices = await EnergyUsage.aggregate([
      {
        $match: {
          startTime: { $gte: oneHourAgo },
          avgFlowRate: { $gte: 10 }
        }
      },
      {
        $group: {
          _id: '$deviceId',
          count: { $sum: 1 },
          avgFlow: { $avg: '$avgFlowRate' },
          totalWater: { $sum: '$waterVolume' }
        }
      },
      {
        $match: {
          count: { $gte: 3 },
          avgFlow: { $gte: 8 }
        }
      }
    ]);

    for (const leak of leakDevices) {
      const existingAlert = await Alert.findOne({
        deviceId: leak._id,
        alertType: 'water_leak',
        status: { $in: ['new', 'acknowledged', 'processing'] }
      });

      if (!existingAlert) {
        const device = await Device.findOne({ deviceId: leak._id });
        
        const alertId = generateAlertId();
        const alert = new Alert({
          alertId,
          alertType: 'water_leak',
          severity: 'critical',
          deviceId: leak._id,
          buildingId: device?.buildingId,
          title: `疑似漏水告警: ${device?.deviceName || leak._id}`,
          description: `检测到持续高流量，平均流量 ${leak.avgFlow.toFixed(1)}L/min，累计 ${leak.totalWater.toFixed(1)}L`,
          data: {
            avgFlow: leak.avgFlow,
            totalWater: leak.totalWater,
            count: leak.count
          }
        });

        await alert.save();
        console.log(`🚨 漏水告警: ${leak._id} - 平均流量 ${leak.avgFlow.toFixed(1)}L/min`);
      }
    }

    console.log('✅ 漏水检测完成');
  }

  async detectLowBalance() {
    console.log('🔍 检测低余额账户...');
    
    const StudentAccount = require('../models/StudentAccount');
    
    const lowBalanceStudents = await StudentAccount.find({
      status: 'active',
      balance: { $lte: 5 }
    });

    for (const student of lowBalanceStudents) {
      const existingAlert = await Alert.findOne({
        studentId: student.studentId,
        alertType: 'low_balance',
        status: 'new',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!existingAlert) {
        const alertId = generateAlertId();
        const alert = new Alert({
          alertId,
          alertType: 'low_balance',
          severity: 'info',
          studentId: student.studentId,
          title: `账户余额提醒: ${student.name}`,
          description: `学生账户余额不足 ¥${student.balance.toFixed(2)}，请及时充值`,
          data: {
            studentName: student.name,
            balance: student.balance,
            phone: student.phone
          },
          notifications: [{
            channel: 'sms',
            recipient: student.phone,
            sent: false
          }]
        });

        await alert.save();
        console.log(`ℹ️  低余额提醒: ${student.studentId} ${student.name} - ¥${student.balance.toFixed(2)}`);
      }
    }

    console.log(`✅ 低余额检测完成，发现 ${lowBalanceStudents.length} 个低余额账户`);
  }

  async updateBuildingFaultHeatmap() {
    console.log('🔍 更新楼栋故障率热力图...');
    
    const buildings = await DormitoryBuilding.find();
    
    for (const building of buildings) {
      const floorFaults = await Device.aggregate([
        {
          $match: {
            buildingId: building._id,
            status: 'fault'
          }
        },
        {
          $group: {
            _id: '$floor',
            count: { $sum: 1 },
            lastFault: { $max: '$updatedAt' }
          }
        }
      ]);

      building.faultHeatMap = building.faultHeatMap.map(fh => {
        const fault = floorFaults.find(f => f._id === fh.floor);
        return {
          floor: fh.floor,
          faultCount: fault?.count || 0,
          lastFaultDate: fault?.lastFault || fh.lastFaultDate
        };
      });

      const totalDevices = await Device.countDocuments({ buildingId: building._id });
      const faultDevices = await Device.countDocuments({ buildingId: building._id, status: 'fault' });
      
      building.faultRate = totalDevices > 0 ? parseFloat(((faultDevices / totalDevices) * 100).toFixed(2)) : 0;
      building.updatedAt = Date.now();
      
      await building.save();
    }

    console.log('✅ 故障率热力图更新完成');
  }

  start() {
    if (this.running) return;
    
    this.running = true;
    console.log('🚀 异常检测服务启动');

    cron.schedule('*/5 * * * *', () => {
      this.detectOfflineDevices().catch(err => console.error('离线检测失败:', err));
    });

    cron.schedule('*/30 * * * *', () => {
      this.detectAbnormalUsage().catch(err => console.error('异常用水检测失败:', err));
      this.detectWaterLeak().catch(err => console.error('漏水检测失败:', err));
    });

    cron.schedule('0 9,12,18 * * *', () => {
      this.detectLowBalance().catch(err => console.error('低余额检测失败:', err));
    });

    cron.schedule('0 * * * *', () => {
      this.updateBuildingFaultHeatmap().catch(err => console.error('热力图更新失败:', err));
    });

    this.detectOfflineDevices();
    this.updateBuildingFaultHeatmap();
  }

  stop() {
    this.running = false;
    console.log('⏹️ 异常检测服务已停止');
  }

  async runAllChecks() {
    console.log('🔍 执行全部检测...');
    await Promise.all([
      this.detectOfflineDevices(),
      this.detectAbnormalUsage(),
      this.detectWaterLeak(),
      this.detectLowBalance(),
      this.updateBuildingFaultHeatmap()
    ]);
    console.log('✅ 全部检测完成');
  }
}

if (require.main === module) {
  const detector = new AnomalyDetector();
  
  detector.init().then(() => {
    if (process.argv.includes('--once')) {
      detector.runAllChecks().then(() => process.exit(0));
    } else {
      detector.start();
    }
  }).catch(err => {
    console.error('异常检测器初始化失败:', err);
    process.exit(1);
  });
}

module.exports = AnomalyDetector;
