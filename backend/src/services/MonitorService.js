const { Op } = require('sequelize');
const {
  MonitorPoint,
  MonitorData,
  Enterprise,
  ViolationEvent,
  Notification,
} = require('../models');
const pollutionTrajectoryEngine = require('../engines/PollutionTrajectoryEngine');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class MonitorService {
  constructor() {
    this.indicatorThresholds = {
      air: {
        PM25: 35,
        PM10: 70,
        SO2: 150,
        NO2: 80,
        CO: 10,
        O3: 160,
      },
      water: {
        PH: 6.5,
        PH_MAX: 8.5,
        COD: 20,
        BOD: 4,
        NH3N: 1.0,
        TP: 0.2,
      },
      noise: {
        dB: 55,
      },
      soil: {
        Cd: 0.3,
        Hg: 0.3,
        As: 40,
        Pb: 80,
        Cr: 150,
      },
    };
  }

  async ingestMonitorData(monitorPointId, rawData, dataTime) {
    const monitorPoint = await MonitorPoint.findByPk(monitorPointId, {
      include: [{ model: Enterprise, as: 'enterprise' }],
    });

    if (!monitorPoint) {
      throw new Error('监测点不存在');
    }

    const isAnomaly = this.detectAnomaly(rawData, monitorPoint.type);

    const monitorData = await MonitorData.create({
      id: uuidv4(),
      monitorPointId,
      rawData,
      dataTime: dataTime || moment().toDate(),
      isAnomaly,
      anomalyReason: isAnomaly ? this.getAnomalyReason(rawData, monitorPoint.type) : null,
      sensorId: rawData.sensorId,
      signalStrength: rawData.signalStrength,
      batteryLevel: rawData.batteryLevel,
    });

    await monitorPoint.update({ lastDataTime: moment().toDate() });

    if (!isAnomaly) {
      const exceedIndicators = this.checkThresholds(rawData, monitorPoint);

      if (exceedIndicators.length > 0) {
        await this.handleViolation(monitorPoint, exceedIndicators, monitorData);
      }
    }

    return monitorData;
  }

  detectAnomaly(rawData, type) {
    if (!rawData || typeof rawData !== 'object') {
      return true;
    }

    const thresholds = this.indicatorThresholds[type] || {};

    for (const key of Object.keys(rawData)) {
      if (key === 'sensorId' || key === 'signalStrength' || key === 'batteryLevel') {
        continue;
      }

      const value = rawData[key];
      
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'number') {
        if (value < 0 || value > 10000) {
          return true;
        }
      }
    }

    return false;
  }

  getAnomalyReason(rawData, type) {
    const reasons = [];

    if (!rawData || typeof rawData !== 'object') {
      reasons.push('数据格式异常');
    } else {
      for (const key of Object.keys(rawData)) {
        const value = rawData[key];
        if (typeof value === 'number' && (value < 0 || value > 10000)) {
          reasons.push(`${key} 数值异常: ${value}`);
        }
      }
    }

    return reasons.length > 0 ? reasons.join(', ') : '未知异常';
  }

  checkThresholds(rawData, monitorPoint) {
    const exceedIndicators = [];
    const thresholds = monitorPoint.thresholds || {};
    const defaultThresholds = this.indicatorThresholds[monitorPoint.type] || {};

    for (const key of Object.keys(rawData)) {
      if (key === 'sensorId' || key === 'signalStrength' || key === 'batteryLevel') {
        continue;
      }

      const value = rawData[key];
      if (value === null || value === undefined) {
        continue;
      }

      const threshold = thresholds[key] || defaultThresholds[key];

      if (threshold !== undefined) {
        if (key === 'PH') {
          const min = thresholds.PH || defaultThresholds.PH;
          const max = thresholds.PH_MAX || defaultThresholds.PH_MAX;
          if (value < min || value > max) {
            exceedIndicators.push({
              name: key,
              value,
              threshold: { min, max },
              exceedRatio: value > max ? ((value - max) / max * 100) : ((min - value) / min * 100),
              type: value > max ? 'high' : 'low',
            });
          }
        } else {
          if (value > threshold) {
            exceedIndicators.push({
              name: key,
              value,
              threshold,
              exceedRatio: ((value - threshold) / threshold * 100),
              type: 'high',
            });
          }
        }
      }
    }

    return exceedIndicators;
  }

  async handleViolation(monitorPoint, exceedIndicators, monitorData) {
    const maxExceedRatio = Math.max(...exceedIndicators.map(i => i.exceedRatio));

    const existingViolation = await ViolationEvent.findOne({
      where: {
        monitorPointId: monitorPoint.id,
        status: {
          [Op.in]: ['pending_response', 'waiting_inspection', 'under_treatment', 'under_review'],
        },
      },
    });

    if (existingViolation) {
      return existingViolation;
    }

    const eventNo = this.generateEventNo();

    const violation = await ViolationEvent.create({
      id: uuidv4(),
      eventNo,
      monitorPointId: monitorPoint.id,
      enterpriseId: monitorPoint.enterpriseId,
      type: monitorPoint.type,
      status: 'pending_response',
      triggeredAt: moment().toDate(),
      responseDeadline: moment().add(24, 'hours').toDate(),
      location: {
        lat: parseFloat(monitorPoint.latitude),
        lng: parseFloat(monitorPoint.longitude),
        address: monitorPoint.address,
      },
      exceedIndicators,
      maxExceedRatio,
    });

    await this.sendViolationNotification(violation, monitorPoint);

    setTimeout(async () => {
      try {
        await pollutionTrajectoryEngine.analyzeViolation(violation.id);
      } catch (error) {
        console.error('溯源分析失败:', error);
      }
    }, 0);

    return violation;
  }

  generateEventNo() {
    const date = moment().format('YYYYMMDD');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EVT-${date}-${random}`;
  }

  async sendViolationNotification(violation, monitorPoint) {
    const notifications = [];

    if (monitorPoint.enterpriseId) {
      notifications.push({
        id: uuidv4(),
        enterpriseId: monitorPoint.enterpriseId,
        type: 'violation_alarm',
        title: `[告警] 监测点 ${monitorPoint.name} 发生超标`,
        content: `监测点 ${monitorPoint.name} 检测到${this.getTypeLabel(monitorPoint.type)}超标，最大超标倍数 ${violation.maxExceedRatio.toFixed(1)}%。请立即自查并采取措施。`,
        relatedId: violation.id,
        relatedType: 'ViolationEvent',
        priority: violation.maxExceedRatio > 200 ? 'urgent' : 'high',
        expireAt: violation.responseDeadline,
      });

      notifications.push({
        id: uuidv4(),
        enterpriseId: monitorPoint.enterpriseId,
        type: 'self_inspection_notice',
        title: `[通知] 请立即开展自查`,
        content: `针对监测点 ${monitorPoint.name} 超标事件，请在 24 小时内完成自查并提交自查报告。`,
        relatedId: violation.id,
        relatedType: 'ViolationEvent',
        priority: 'high',
        expireAt: violation.responseDeadline,
      });
    }

    notifications.push({
      id: uuidv4(),
      type: 'violation_alarm',
      title: `[监管告警] ${monitorPoint.name} 超标事件`,
      content: `监测点 ${monitorPoint.name} 发生${this.getTypeLabel(monitorPoint.type)}超标，超标倍数 ${violation.maxExceedRatio.toFixed(1)}%。事件编号: ${violation.eventNo}`,
      relatedId: violation.id,
      relatedType: 'ViolationEvent',
      priority: violation.maxExceedRatio > 200 ? 'urgent' : 'high',
    });

    for (const notification of notifications) {
      await Notification.create(notification);
    }
  }

  getTypeLabel(type) {
    const labels = {
      air: '空气质量',
      water: '水质',
      noise: '噪声',
      soil: '土壤',
    };
    return labels[type] || type;
  }

  async getMonitorPoints(filters = {}, page = 1, pageSize = 20) {
    const where = {};

    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.enterpriseId) {
      where.enterpriseId = filters.enterpriseId;
    }

    const { count, rows } = await MonitorPoint.findAndCountAll({
      where,
      include: [
        { model: Enterprise, as: 'enterprise' },
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      total: count,
      page,
      pageSize,
      data: rows,
    };
  }

  async getMonitorData(monitorPointId, startTime, endTime, page = 1, pageSize = 100) {
    const where = { monitorPointId };

    if (startTime && endTime) {
      where.dataTime = {
        [Op.between]: [startTime, endTime],
      };
    }

    const { count, rows } = await MonitorData.findAndCountAll({
      where,
      order: [['dataTime', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      total: count,
      page,
      pageSize,
      data: rows,
    };
  }

  async getLatestData(monitorPointId) {
    return await MonitorData.findOne({
      where: { monitorPointId },
      order: [['dataTime', 'DESC']],
    });
  }

  async createMonitorPoint(data) {
    const existing = await MonitorPoint.findOne({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('监测点编码已存在');
    }

    return await MonitorPoint.create({
      id: uuidv4(),
      code: data.code,
      name: data.name,
      type: data.type,
      latitude: data.latitude,
      longitude: data.longitude,
      enterpriseId: data.enterpriseId,
      address: data.address,
      indicators: data.indicators || this.getDefaultIndicators(data.type),
      thresholds: data.thresholds || this.indicatorThresholds[data.type] || {},
      status: data.status || 'active',
    });
  }

  getDefaultIndicators(type) {
    const thresholds = this.indicatorThresholds[type] || {};
    return Object.keys(thresholds).filter(k => k !== 'PH_MAX');
  }

  async updateMonitorPoint(id, data) {
    const monitorPoint = await MonitorPoint.findByPk(id);
    if (!monitorPoint) {
      throw new Error('监测点不存在');
    }

    const allowedFields = ['name', 'latitude', 'longitude', 'address', 'indicators', 'thresholds', 'status', 'isMonitored'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    return await monitorPoint.update(updateData);
  }

  async deleteMonitorPoint(id) {
    const monitorPoint = await MonitorPoint.findByPk(id);
    if (!monitorPoint) {
      throw new Error('监测点不存在');
    }

    return await monitorPoint.update({ status: 'inactive' });
  }

  async getRealTimeStatus(monitorPointIds = []) {
    const where = { status: 'active' };
    if (monitorPointIds.length > 0) {
      where.id = { [Op.in]: monitorPointIds };
    }

    const monitorPoints = await MonitorPoint.findAll({
      where,
      include: [{ model: Enterprise, as: 'enterprise' }],
    });

    const statuses = [];

    for (const mp of monitorPoints) {
      const latestData = await MonitorData.findOne({
        where: { monitorPointId: mp.id },
        order: [['dataTime', 'DESC']],
      });

      const activeViolation = await ViolationEvent.findOne({
        where: {
          monitorPointId: mp.id,
          status: {
            [Op.in]: ['pending_response', 'waiting_inspection', 'under_treatment', 'under_review'],
          },
        },
      });

      let status = 'normal';
      if (activeViolation) {
        status = 'violating';
      } else if (!latestData) {
        status = 'offline';
      } else if (moment().diff(moment(latestData.dataTime), 'minutes') > 30) {
        status = 'stale';
      }

      statuses.push({
        monitorPointId: mp.id,
        name: mp.name,
        type: mp.type,
        status,
        latitude: parseFloat(mp.latitude),
        longitude: parseFloat(mp.longitude),
        enterprise: mp.enterprise ? {
          id: mp.enterprise.id,
          name: mp.enterprise.name,
        } : null,
        latestData: latestData ? {
          dataTime: latestData.dataTime,
          rawData: latestData.rawData,
          isAnomaly: latestData.isAnomaly,
        } : null,
        activeViolation: activeViolation ? {
          id: activeViolation.id,
          eventNo: activeViolation.eventNo,
          status: activeViolation.status,
          triggeredAt: activeViolation.triggeredAt,
          maxExceedRatio: activeViolation.maxExceedRatio,
        } : null,
      });
    }

    return statuses;
  }
}

module.exports = new MonitorService();
