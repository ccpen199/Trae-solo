const { Op } = require('sequelize');
const { MonitorData, MonitorPoint, Enterprise, ViolationEvent } = require('../models');
const moment = require('moment');

class PollutionTrajectoryEngine {
  constructor() {
    this.trajectoryCache = new Map();
  }

  async analyzeViolation(violationEventId) {
    const violation = await ViolationEvent.findByPk(violationEventId, {
      include: [
        { model: MonitorPoint, as: 'monitorPoint' },
        { model: Enterprise, as: 'enterprise' },
      ],
    });

    if (!violation) {
      throw new Error('超标事件不存在');
    }

    const monitorPoint = violation.monitorPoint;
    const exceedIndicators = violation.exceedIndicators;

    const historicalData = await this.getHistoricalData(
      monitorPoint.id,
      violation.triggeredAt,
      24
    );

    const trajectory = await this.calculateTrajectory(
      monitorPoint,
      historicalData,
      exceedIndicators
    );

    const nearbySources = await this.findNearbySources(
      monitorPoint.latitude,
      monitorPoint.longitude,
      violation.type,
      10
    );

    const probableSource = this.determineProbableSource(
      trajectory,
      nearbySources,
      exceedIndicators
    );

    const result = {
      eventId: violationEventId,
      analysisTime: moment().toISOString(),
      monitorPoint: {
        id: monitorPoint.id,
        name: monitorPoint.name,
        latitude: parseFloat(monitorPoint.latitude),
        longitude: parseFloat(monitorPoint.longitude),
      },
      exceedIndicators,
      trajectory,
      nearbySources,
      probableSource,
      suggestions: this.generateSuggestions(probableSource, exceedIndicators),
    };

    await violation.update({ traceabilityResult: result });

    return result;
  }

  async getHistoricalData(monitorPointId, endTime, hoursBack = 24) {
    const startTime = moment(endTime).subtract(hoursBack, 'hours').toDate();

    return await MonitorData.findAll({
      where: {
        monitorPointId,
        dataTime: {
          [Op.between]: [startTime, endTime],
        },
        isAnomaly: false,
      },
      order: [['dataTime', 'ASC']],
    });
  }

  async calculateTrajectory(monitorPoint, historicalData, exceedIndicators) {
    if (historicalData.length === 0) {
      return {
        trend: 'unknown',
        peakTime: null,
        avgExceedRatio: 0,
        dataPoints: 0,
      };
    }

    const values = historicalData.map(d => d.rawData);
    const timeSeries = historicalData.map(d => moment(d.dataTime).valueOf());

    const indicatorAnalysis = {};

    for (const indicator of exceedIndicators) {
      const indicatorValues = values
        .map(v => v[indicator.name])
        .filter(v => v !== undefined && v !== null);

      if (indicatorValues.length > 0) {
        const avg = indicatorValues.reduce((a, b) => a + b, 0) / indicatorValues.length;
        const max = Math.max(...indicatorValues);
        const min = Math.min(...indicatorValues);

        const threshold = indicator.threshold || 0;
        const exceedRatio = max > 0 ? ((max - threshold) / threshold * 100) : 0;

        const trend = this.detectTrend(indicatorValues);

        const peakIndex = indicatorValues.indexOf(max);
        const peakTime = timeSeries[peakIndex] ? moment(timeSeries[peakIndex]).toISOString() : null;

        indicatorAnalysis[indicator.name] = {
          avg,
          max,
          min,
          threshold,
          exceedRatio: parseFloat(exceedRatio.toFixed(2)),
          trend,
          peakTime,
        };
      }
    }

    const trends = Object.values(indicatorAnalysis).map(i => i.trend);
    const overallTrend = trends.length > 0 
      ? (trends.every(t => t === 'rising') ? 'rising' 
        : trends.every(t => t === 'falling') ? 'falling' 
        : 'stable')
      : 'unknown';

    return {
      trend: overallTrend,
      indicatorAnalysis,
      dataPoints: historicalData.length,
    };
  }

  detectTrend(values) {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = avgSecond - avgFirst;
    const threshold = avgFirst * 0.05;

    if (diff > threshold) return 'rising';
    if (diff < -threshold) return 'falling';
    return 'stable';
  }

  async findNearbySources(latitude, longitude, type, radiusKm = 10) {
    const earthRadius = 6371;

    const latRad = parseFloat(latitude) * Math.PI / 180;
    const lngRad = parseFloat(longitude) * Math.PI / 180;

    const deltaLat = radiusKm / earthRadius;
    const deltaLng = radiusKm / (earthRadius * Math.cos(latRad));

    const minLat = parseFloat(latitude) - deltaLat * 180 / Math.PI;
    const maxLat = parseFloat(latitude) + deltaLat * 180 / Math.PI;
    const minLng = parseFloat(longitude) - deltaLng * 180 / Math.PI;
    const maxLng = parseFloat(longitude) + deltaLng * 180 / Math.PI;

    const monitorPoints = await MonitorPoint.findAll({
      where: {
        type,
        latitude: {
          [Op.between]: [minLat, maxLat],
        },
        longitude: {
          [Op.between]: [minLng, maxLng],
        },
      },
      include: [
        { model: Enterprise, as: 'enterprise' },
      ],
    });

    return monitorPoints
      .filter(mp => mp.latitude !== null && mp.longitude !== null)
      .map(mp => {
        const mpLatRad = parseFloat(mp.latitude) * Math.PI / 180;
        const mpLngRad = parseFloat(mp.longitude) * Math.PI / 180;

        const dLat = mpLatRad - latRad;
        const dLng = mpLngRad - lngRad;

        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(latRad) * Math.cos(mpLatRad) *
          Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;

        return {
          id: mp.id,
          name: mp.name,
          type: mp.type,
          latitude: parseFloat(mp.latitude),
          longitude: parseFloat(mp.longitude),
          distance: parseFloat(distance.toFixed(2)),
          enterprise: mp.enterprise ? {
            id: mp.enterprise.id,
            name: mp.enterprise.name,
            code: mp.enterprise.code,
          } : null,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  determineProbableSource(trajectory, nearbySources, exceedIndicators) {
    if (nearbySources.length === 0) {
      return {
        type: 'unknown',
        confidence: 0,
        description: '未发现周边潜在污染源',
      };
    }

    const sourcesWithEnterprise = nearbySources.filter(s => s.enterprise);

    if (sourcesWithEnterprise.length === 0) {
      return {
        type: 'unknown',
        confidence: 30,
        description: '周边监测点未关联企业，需人工核查',
        nearbyPoints: nearbySources.slice(0, 5),
      };
    }

    const nearestEnterprise = sourcesWithEnterprise[0];
    const confidence = nearestEnterprise.distance < 2 ? 80 
      : nearestEnterprise.distance < 5 ? 60 
      : 40;

    return {
      type: 'enterprise',
      confidence,
      sourceId: nearestEnterprise.enterprise.id,
      sourceName: nearestEnterprise.enterprise.name,
      distance: nearestEnterprise.distance,
      monitorPoint: {
        id: nearestEnterprise.id,
        name: nearestEnterprise.name,
      },
      description: `距离 ${nearestEnterprise.distance.toFixed(2)} 公里处的 ${nearestEnterprise.enterprise.name} 为潜在污染源`,
    };
  }

  generateSuggestions(probableSource, exceedIndicators) {
    const suggestions = [];

    suggestions.push({
      priority: 'high',
      action: '通知企业自查',
      description: '立即向相关企业发送自查通知，要求核实超标原因',
    });

    suggestions.push({
      priority: 'high',
      action: '现场核查',
      description: '安排监管员前往疑似污染源现场进行核查',
    });

    if (probableSource.type === 'enterprise') {
      suggestions.push({
        priority: 'medium',
        action: '历史数据比对',
        description: `核查 ${probableSource.sourceName} 的历史监测数据，分析超标规律`,
      });
    }

    const indicatorNames = exceedIndicators.map(i => i.name).join('、');
    suggestions.push({
      priority: 'medium',
      action: '专项监测',
      description: `针对超标指标(${indicatorNames})增加采样频率，持续跟踪变化趋势`,
    });

    return suggestions;
  }
}

module.exports = new PollutionTrajectoryEngine();
