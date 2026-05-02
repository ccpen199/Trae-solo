const { EXCEPTION_TYPES } = require('../utils/constants');

class PositioningEngine {
  constructor() {
    this.driftThreshold = 500;
    this.accuracyThreshold = 20;
    this.consecutiveDriftLimit = 3;
  }

  validateLocation(location, previousLocation = null) {
    const result = {
      isValid: true,
      isDrift: false,
      accuracy: location.accuracy || 0,
      issues: [],
      corrections: null,
    };

    if (!location.lat || !location.lng) {
      result.isValid = false;
      result.issues.push('经纬度坐标不能为空');
      return result;
    }

    if (location.lat < -90 || location.lat > 90) {
      result.isValid = false;
      result.issues.push('纬度值超出有效范围 [-90, 90]');
    }

    if (location.lng < -180 || location.lng > 180) {
      result.isValid = false;
      result.issues.push('经度值超出有效范围 [-180, 180]');
    }

    if (location.accuracy && location.accuracy > this.accuracyThreshold) {
      result.issues.push(`定位精度较低 (${location.accuracy}m)，建议等待GPS信号增强`);
    }

    if (previousLocation && this.checkDrift(location, previousLocation)) {
      result.isDrift = true;
      result.issues.push('检测到定位漂移');
      result.corrections = {
        suggestedAction: 'WAIT_FOR_STABLE_SIGNAL',
        suggestedLocation: this.suggestCorrectedLocation(location, previousLocation),
      };
    }

    return result;
  }

  checkDrift(currentLocation, previousLocation) {
    if (!previousLocation) return false;

    const distance = this.calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      previousLocation.lat,
      previousLocation.lng
    );

    const timeDiff = currentLocation.timestamp 
      ? (new Date(currentLocation.timestamp) - new Date(previousLocation.timestamp || Date.now())) / 1000
      : 1;

    if (timeDiff > 0) {
      const speed = distance / timeDiff;
      const maxReasonableSpeed = 50;

      if (speed > maxReasonableSpeed) {
        return true;
      }
    }

    return distance > this.driftThreshold;
  }

  suggestCorrectedLocation(currentLocation, previousLocation) {
    if (!previousLocation) return currentLocation;

    const alpha = 0.3;
    return {
      lat: previousLocation.lat + (currentLocation.lat - previousLocation.lat) * alpha,
      lng: previousLocation.lng + (currentLocation.lng - previousLocation.lng) * alpha,
      accuracy: Math.max(currentLocation.accuracy || 0, previousLocation.accuracy || 0),
      source: 'SMOOTHED',
    };
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  analyzeDriftPattern(trackPoints) {
    if (!trackPoints || trackPoints.length < 3) {
      return { hasPattern: false, pattern: null };
    }

    const driftCounts = trackPoints.filter(t => t.is_drift === 1).length;
    const driftRatio = driftCounts / trackPoints.length;

    if (driftRatio > 0.3) {
      return {
        hasPattern: true,
        pattern: 'CONTINUOUS_DRIFT',
        severity: driftRatio > 0.6 ? 'HIGH' : 'MEDIUM',
        suggestion: '建议检查设备GPS信号或切换定位源',
        exceptionType: EXCEPTION_TYPES.LOCATION_DRIFT,
      };
    }

    let consecutiveDrifts = 0;
    let maxConsecutive = 0;

    for (const point of trackPoints) {
      if (point.is_drift === 1) {
        consecutiveDrifts++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveDrifts);
      } else {
        consecutiveDrifts = 0;
      }
    }

    if (maxConsecutive >= this.consecutiveDriftLimit) {
      return {
        hasPattern: true,
        pattern: 'CONSECUTIVE_DRIFT',
        severity: maxConsecutive > 5 ? 'HIGH' : 'MEDIUM',
        maxConsecutive,
        suggestion: '建议暂停定位采集，检查设备状态',
        exceptionType: EXCEPTION_TYPES.LOCATION_DRIFT,
      };
    }

    return { hasPattern: false, pattern: null };
  }

  validateAddress(address, location) {
    const result = {
      isValid: true,
      confidence: 0,
      issues: [],
    };

    if (!address || !address.trim()) {
      result.isValid = false;
      result.issues.push('地址不能为空');
      return result;
    }

    result.confidence = this.calculateAddressConfidence(address);

    if (result.confidence < 30) {
      result.issues.push('地址信息不够详细，建议补充门牌号或附近地标');
    }

    if (location && location.lat && location.lng) {
      result.geoMatch = this.checkGeoAddressMatch(location, address);
      if (!result.geoMatch.isMatched) {
        result.issues.push('地址与坐标位置可能存在偏差');
      }
    }

    return result;
  }

  calculateAddressConfidence(address) {
    let confidence = 0;

    if (address.match(/[省市自治区]/)) confidence += 20;
    if (address.match(/[市区县]/)) confidence += 15;
    if (address.match(/[街道乡镇]/)) confidence += 15;
    if (address.match(/[路街巷弄]/)) confidence += 20;
    if (address.match(/\d+[号号楼层]/)) confidence += 20;
    if (address.match(/[室单元层]/)) confidence += 10;

    return Math.min(confidence, 100);
  }

  checkGeoAddressMatch(location, address) {
    return {
      isMatched: true,
      confidence: 85,
      method: 'MOCK',
    };
  }
}

module.exports = new PositioningEngine();
