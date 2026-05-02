const { Op } = require('sequelize');
const { MonitorPoint, Enterprise, ViolationEvent } = require('../models');
const moment = require('moment');

class GeoFencingEngine {
  constructor() {
    this.fences = new Map();
  }

  createFence(fenceData) {
    const fence = {
      id: fenceData.id || `fence_${Date.now()}`,
      name: fenceData.name,
      type: fenceData.type,
      center: {
        latitude: parseFloat(fenceData.latitude),
        longitude: parseFloat(fenceData.longitude),
      },
      radiusKm: fenceData.radiusKm || 5,
      shape: fenceData.shape || 'circle',
      rules: fenceData.rules || [],
      status: fenceData.status || 'active',
      createdAt: moment().toISOString(),
      enterpriseId: fenceData.enterpriseId,
      monitorPointIds: fenceData.monitorPointIds || [],
    };

    this.fences.set(fence.id, fence);
    return fence;
  }

  getFence(fenceId) {
    return this.fences.get(fenceId);
  }

  updateFence(fenceId, updates) {
    const fence = this.fences.get(fenceId);
    if (!fence) return null;

    Object.assign(fence, updates);
    fence.updatedAt = moment().toISOString();
    return fence;
  }

  deleteFence(fenceId) {
    return this.fences.delete(fenceId);
  }

  async checkPointInFence(latitude, longitude, fenceId) {
    const fence = this.fences.get(fenceId);
    if (!fence) return { inFence: false, error: '围栏不存在' };

    const distance = this.calculateDistance(
      latitude,
      longitude,
      fence.center.latitude,
      fence.center.longitude
    );

    const inFence = distance <= fence.radiusKm;

    return {
      inFence,
      distance,
      fence,
      checkTime: moment().toISOString(),
    };
  }

  async findFencesForPoint(latitude, longitude) {
    const activeFences = Array.from(this.fences.values()).filter(f => f.status === 'active');

    const matches = [];

    for (const fence of activeFences) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        fence.center.latitude,
        fence.center.longitude
      );

      if (distance <= fence.radiusKm) {
        matches.push({
          fence,
          distance,
        });
      }
    }

    return matches.sort((a, b) => a.distance - b.distance);
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const earthRadius = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  }

  async generateEnterpriseFence(enterpriseId) {
    const enterprise = await Enterprise.findByPk(enterpriseId);
    if (!enterprise || !enterprise.latitude || !enterprise.longitude) {
      throw new Error('企业不存在或无地理位置信息');
    }

    const monitorPoints = await MonitorPoint.findAll({
      where: {
        enterpriseId,
        status: 'active',
      },
    });

    const fence = this.createFence({
      name: `${enterprise.name} - 企业围栏`,
      type: 'enterprise',
      latitude: enterprise.latitude,
      longitude: enterprise.longitude,
      radiusKm: 5,
      enterpriseId: enterpriseId,
      monitorPointIds: monitorPoints.map(mp => mp.id),
      rules: [
        {
          type: 'violation_alert',
          description: '围栏内监测点超标时触发告警',
          enabled: true,
        },
      ],
    });

    return fence;
  }

  async getHeatMapData(type = 'all', timeRange = { hours: 24 }) {
    const endTime = moment().toDate();
    const startTime = moment(endTime).subtract(timeRange.hours, 'hours').toDate();

    const whereClause = {
      status: 'active',
    };

    if (type !== 'all') {
      whereClause.type = type;
    }

    const monitorPoints = await MonitorPoint.findAll({
      where: whereClause,
      include: [
        {
          model: Enterprise,
          as: 'enterprise',
          attributes: ['id', 'name', 'creditScore', 'complianceStatus'],
        },
      ],
    });

    const violationCounts = await ViolationEvent.findAndCountAll({
      where: {
        triggeredAt: {
          [Op.between]: [startTime, endTime],
        },
      },
    });

    const violationsByPoint = {};
    for (const violation of violationCounts.rows) {
      const pointId = violation.monitorPointId;
      violationsByPoint[pointId] = (violationsByPoint[pointId] || 0) + 1;
    }

    const heatMapData = monitorPoints.map(point => {
      const violationCount = violationsByPoint[point.id] || 0;
      
      let intensity = 0.1;
      if (violationCount > 0) {
        intensity = Math.min(1, 0.3 + violationCount * 0.2);
      }
      
      const enterprise = point.enterprise;
      if (enterprise && enterprise.complianceStatus === 'non_compliant') {
        intensity = Math.max(intensity, 0.6);
      } else if (enterprise && enterprise.complianceStatus === 'warning') {
        intensity = Math.max(intensity, 0.4);
      }

      return {
        id: point.id,
        name: point.name,
        type: point.type,
        latitude: parseFloat(point.latitude),
        longitude: parseFloat(point.longitude),
        intensity,
        violationCount,
        status: point.status,
        enterprise: enterprise ? {
          id: enterprise.id,
          name: enterprise.name,
          creditScore: enterprise.creditScore,
          complianceStatus: enterprise.complianceStatus,
        } : null,
        address: point.address,
      };
    });

    return {
      generatedAt: moment().toISOString(),
      timeRange: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      totalPoints: heatMapData.length,
      totalViolations: violationCounts.count,
      data: heatMapData,
    };
  }

  async getFenceStats(enterpriseId = null) {
    const whereClause = {};
    if (enterpriseId) {
      whereClause.enterpriseId = enterpriseId;
    }

    const fences = Array.from(this.fences.values()).filter(f => {
      if (enterpriseId) {
        return f.enterpriseId === enterpriseId;
      }
      return true;
    });

    const stats = {
      totalFences: fences.length,
      activeFences: fences.filter(f => f.status === 'active').length,
      byType: {},
      avgRadius: 0,
    };

    for (const fence of fences) {
      stats.byType[fence.type] = (stats.byType[fence.type] || 0) + 1;
    }

    if (fences.length > 0) {
      const totalRadius = fences.reduce((sum, f) => sum + f.radiusKm, 0);
      stats.avgRadius = parseFloat((totalRadius / fences.length).toFixed(2));
    }

    return stats;
  }
}

module.exports = new GeoFencingEngine();
