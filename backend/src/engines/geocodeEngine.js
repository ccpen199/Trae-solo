const { v4: uuidv4 } = require('uuid');

const locationDatabase = {
  '北京': { lat: 39.9042, lng: 116.4074, region: '华北' },
  '北京市': { lat: 39.9042, lng: 116.4074, region: '华北' },
  
  '上海': { lat: 31.2304, lng: 121.4737, region: '华东' },
  '上海市': { lat: 31.2304, lng: 121.4737, region: '华东' },
  
  '广州': { lat: 23.1291, lng: 113.2644, region: '华南' },
  '广州市': { lat: 23.1291, lng: 113.2644, region: '华南' },
  
  '深圳': { lat: 22.5431, lng: 114.0579, region: '华南' },
  '深圳市': { lat: 22.5431, lng: 114.0579, region: '华南' },
  
  '杭州': { lat: 30.2741, lng: 120.1551, region: '华东' },
  '杭州市': { lat: 30.2741, lng: 120.1551, region: '华东' },
  
  '南京': { lat: 32.0603, lng: 118.7969, region: '华东' },
  '南京市': { lat: 32.0603, lng: 118.7969, region: '华东' },
  
  '成都': { lat: 30.5728, lng: 104.0668, region: '西南' },
  '成都市': { lat: 30.5728, lng: 104.0668, region: '西南' },
  
  '武汉': { lat: 30.5928, lng: 114.3055, region: '华中' },
  '武汉市': { lat: 30.5928, lng: 114.3055, region: '华中' },
  
  '西安': { lat: 34.3416, lng: 108.9398, region: '西北' },
  '西安市': { lat: 34.3416, lng: 108.9398, region: '西北' },
  
  '天津': { lat: 39.0842, lng: 117.2009, region: '华北' },
  '天津市': { lat: 39.0842, lng: 117.2009, region: '华北' },
  
  '重庆': { lat: 29.4316, lng: 106.9123, region: '西南' },
  '重庆市': { lat: 29.4316, lng: 106.9123, region: '西南' },
  
  '北京站': { lat: 39.9042, lng: 116.4274, region: '华北', category: '交通枢纽' },
  '北京西站': { lat: 39.8948, lng: 116.3226, region: '华北', category: '交通枢纽' },
  '北京南站': { lat: 39.8652, lng: 116.3785, region: '华北', category: '交通枢纽' },
  '首都机场': { lat: 40.0799, lng: 116.6031, region: '华北', category: '交通枢纽' },
  '大兴机场': { lat: 39.5085, lng: 116.4204, region: '华北', category: '交通枢纽' },
  
  '天安门': { lat: 39.9055, lng: 116.3976, region: '华北', category: '景点' },
  '故宫': { lat: 39.9163, lng: 116.3972, region: '华北', category: '景点' },
  '八达岭长城': { lat: 40.3576, lng: 116.0206, region: '华北', category: '景点' },
  '颐和园': { lat: 39.9999, lng: 116.2755, region: '华北', category: '景点' },
  
  '中关村': { lat: 39.9834, lng: 116.3169, region: '华北', category: '商业区' },
  '望京SOHO': { lat: 40.0029, lng: 116.4704, region: '华北', category: '商业区' },
  '国贸': { lat: 39.9106, lng: 116.4620, region: '华北', category: '商业区' },
  
  '南京博物馆': { lat: 32.0458, lng: 118.8330, region: '华东', category: '文化设施' },
  '南京博物院': { lat: 32.0458, lng: 118.8330, region: '华东', category: '文化设施' },
  '夫子庙': { lat: 32.0206, lng: 118.7897, region: '华东', category: '景点' },
  '中山陵': { lat: 32.0607, lng: 118.8463, region: '华东', category: '景点' },
  
  '武汉大学': { lat: 30.5398, lng: 114.3629, region: '华中', category: '教育机构' },
  '华中科技大学': { lat: 30.5148, lng: 114.4150, region: '华中', category: '教育机构' },
  '黄鹤楼': { lat: 30.5467, lng: 114.3062, region: '华中', category: '景点' },
  
  '上海外滩': { lat: 31.2397, lng: 121.4998, region: '华东', category: '景点' },
  '陆家嘴': { lat: 31.2385, lng: 121.5016, region: '华东', category: '商业区' },
  '浦东新区': { lat: 31.2304, lng: 121.5065, region: '华东', category: '商业区' },
  
  '广州塔': { lat: 23.1066, lng: 113.3245, region: '华南', category: '景点' },
  '天河': { lat: 23.1291, lng: 113.3380, region: '华南', category: '商业区' },
  
  '西湖': { lat: 30.2430, lng: 120.1446, region: '华东', category: '景点' },
  '阿里巴巴': { lat: 30.2741, lng: 120.0216, region: '华东', category: '商业区' },
  
  '春熙路': { lat: 30.6571, lng: 104.0656, region: '西南', category: '商业区' },
  '锦里': { lat: 30.6476, lng: 104.0432, region: '西南', category: '景点' },
  
  '回民街': { lat: 34.2611, lng: 108.9465, region: '西北', category: '商业区' },
  '兵马俑': { lat: 34.3853, lng: 109.2785, region: '西北', category: '景点' },
};

const geocodeEngine = {
  geocode(address) {
    if (!address || address.trim() === '') {
      return {
        success: false,
        message: '地址不能为空',
      };
    }

    const trimmedAddress = address.trim();
    
    let bestMatch = null;
    let bestMatchScore = 0;

    for (const [key, location] of Object.entries(locationDatabase)) {
      const score = this.calculateMatchScore(trimmedAddress, key);
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = { key, location };
      }
    }

    if (bestMatch && bestMatchScore >= 0.3) {
      return {
        success: true,
        data: {
          address: trimmedAddress,
          formattedAddress: this.buildFormattedAddress(trimmedAddress, bestMatch),
          lat: bestMatch.location.lat + (Math.random() - 0.5) * 0.01,
          lng: bestMatch.location.lng + (Math.random() - 0.5) * 0.01,
          region: bestMatch.location.region,
          category: bestMatch.location.category || '未知',
          matchScore: bestMatchScore,
          matchedKeyword: bestMatch.key,
          providers: ['模拟地图服务'],
        },
      };
    }

    return {
      success: true,
      data: {
        address: trimmedAddress,
        formattedAddress: trimmedAddress,
        lat: 39.9042 + (Math.random() - 0.5) * 0.5,
        lng: 116.4074 + (Math.random() - 0.5) * 0.5,
        region: '未知',
        category: '未知',
        matchScore: 0,
        isFallback: true,
        providers: ['模拟地图服务'],
      },
      message: '未找到精确匹配，使用默认坐标',
    };
  },

  reverseGeocode(lat, lng) {
    if (lat === undefined || lng === undefined) {
      return {
        success: false,
        message: '坐标不能为空',
      };
    }

    let bestMatch = null;
    let minDistance = Infinity;

    for (const [key, location] of Object.entries(locationDatabase)) {
      const distance = this.calculateDistance(
        { lat, lng },
        { lat: location.lat, lng: location.lng }
      );

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = { key, location, distance };
      }
    }

    if (bestMatch && minDistance < 50000) {
      return {
        success: true,
        data: {
          lat,
          lng,
          formattedAddress: this.buildReverseAddress(bestMatch, minDistance),
          region: bestMatch.location.region,
          category: bestMatch.location.category || '未知',
          distance: minDistance,
          nearestPOI: bestMatch.key,
          providers: ['模拟地图服务'],
        },
      };
    }

    return {
      success: true,
      data: {
        lat,
        lng,
        formattedAddress: `未知位置 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        region: '未知',
        category: '未知',
        isFallback: true,
        providers: ['模拟地图服务'],
      },
      message: '未找到附近地址信息',
    };
  },

  batchGeocode(addresses) {
    const results = [];
    for (const address of addresses) {
      results.push({
        original: address,
        result: this.geocode(address),
      });
    }
    return {
      success: true,
      count: results.length,
      results,
    };
  },

  suggestPOI(address, options = {}) {
    const { limit = 5, category = null } = options;
    
    if (!address || address.trim() === '') {
      return {
        success: true,
        suggestions: [],
      };
    }

    const trimmedAddress = address.trim();
    const suggestions = [];

    for (const [key, location] of Object.entries(locationDatabase)) {
      if (category && location.category !== category) {
        continue;
      }

      const score = this.calculateMatchScore(trimmedAddress, key);
      if (score > 0.1) {
        suggestions.push({
          id: uuidv4(),
          name: key,
          address: this.buildFormattedAddress(key, { key, location }),
          lat: location.lat,
          lng: location.lng,
          region: location.region,
          category: location.category || '未知',
          matchScore: score,
        });
      }
    }

    suggestions.sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      total: suggestions.length,
      suggestions: suggestions.slice(0, limit),
    };
  },

  calculateMatchScore(input, keyword) {
    const inputLower = input.toLowerCase();
    const keywordLower = keyword.toLowerCase();

    if (inputLower === keywordLower) {
      return 1.0;
    }

    if (keywordLower.includes(inputLower)) {
      return 0.9 * (inputLower.length / keywordLower.length);
    }

    if (inputLower.includes(keywordLower)) {
      return 0.8 * (keywordLower.length / inputLower.length);
    }

    let matchChars = 0;
    for (const char of inputLower) {
      if (keywordLower.includes(char)) {
        matchChars++;
      }
    }

    return matchChars / Math.max(inputLower.length, keywordLower.length) * 0.5;
  },

  calculateDistance(point1, point2) {
    const R = 6371000;
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  toRad(deg) {
    return (deg * Math.PI) / 180;
  },

  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}米`;
    }
    return `${(meters / 1000).toFixed(1)}公里`;
  },

  buildFormattedAddress(input, match) {
    const region = match.location.region || '';
    const category = match.location.category || '';
    
    if (match.key === input) {
      return `${region} ${match.key}`;
    }
    
    return `${region} ${match.key}附近`;
  },

  buildReverseAddress(match, distance) {
    const region = match.location.region || '';
    const category = match.location.category || '';
    const distanceText = this.formatDistance(distance);
    
    if (distance < 100) {
      return `${region} ${match.key}`;
    }
    
    return `${region} ${match.key} ${distanceText}`;
  },
};

module.exports = geocodeEngine;
