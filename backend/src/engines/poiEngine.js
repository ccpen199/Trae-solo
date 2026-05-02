class POIEngine {
  constructor() {
    this.searchRadius = 5000;
    this.minMatchScore = 0.6;
  }

  searchPOI(pois, location, options = {}) {
    const radius = options.radius || this.searchRadius;
    const category = options.category;
    const keyword = options.keyword;

    let results = pois.map(poi => {
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        poi.lat,
        poi.lng
      );

      let matchScore = 0;
      if (distance < radius) {
        matchScore = 1 - (distance / radius);
      }

      if (keyword && poi.name) {
        const nameMatch = poi.name.toLowerCase().includes(keyword.toLowerCase()) ? 0.3 : 0;
        matchScore += nameMatch;
      }

      if (keyword && poi.address) {
        const addressMatch = poi.address.toLowerCase().includes(keyword.toLowerCase()) ? 0.2 : 0;
        matchScore += addressMatch;
      }

      return {
        ...poi,
        distance,
        matchScore: Math.min(matchScore, 1),
      };
    });

    results = results.filter(poi => poi.distance <= radius && poi.matchScore >= this.minMatchScore);

    if (category) {
      results = results.filter(poi => poi.category === category);
    }

    results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.distance - b.distance;
    });

    return {
      total: results.length,
      pois: results,
      radius,
      center: location,
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
    
    return Math.round(R * c);
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  isInPOIRadius(location, poi) {
    const distance = this.calculateDistance(
      location.lat,
      location.lng,
      poi.lat,
      poi.lng
    );

    return {
      isInside: distance <= poi.radius,
      distance,
      radius: poi.radius,
    };
  }

  findNearestPOI(pois, location, categories = null) {
    if (!pois || pois.length === 0) {
      return { found: false };
    }

    let filteredPOIs = pois;
    if (categories && categories.length > 0) {
      filteredPOIs = pois.filter(p => categories.includes(p.category));
    }

    if (filteredPOIs.length === 0) {
      return { found: false };
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const poi of filteredPOIs) {
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        poi.lat,
        poi.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = poi;
      }
    }

    return {
      found: true,
      poi: nearest,
      distance: minDistance,
      isInsideRadius: minDistance <= (nearest?.radius || 100),
    };
  }

  lockPOI(poi, orderId) {
    if (poi.is_locked && poi.lock_order_id !== orderId) {
      return {
        success: false,
        reason: 'POI已被其他订单锁定',
        lockedBy: poi.lock_order_id,
      };
    }

    return {
      success: true,
      poi: {
        ...poi,
        is_locked: 1,
        lock_order_id: orderId,
        updated_at: new Date().toISOString(),
      },
    };
  }

  unlockPOI(poi, orderId) {
    if (poi.is_locked && poi.lock_order_id !== orderId) {
      return {
        success: false,
        reason: 'POI被其他订单锁定，无法解锁',
        lockedBy: poi.lock_order_id,
      };
    }

    return {
      success: true,
      poi: {
        ...poi,
        is_locked: 0,
        lock_order_id: null,
        updated_at: new Date().toISOString(),
      },
    };
  }

  validatePOIAccess(poi, userRole, action) {
    const rolePermissions = {
      ADMIN: ['read', 'write', 'lock', 'unlock', 'create', 'delete'],
      DISPATCHER: ['read', 'write', 'lock', 'unlock'],
      DRIVER: ['read'],
      USER: ['read'],
      OPERATOR: ['read', 'write', 'lock', 'unlock'],
    };

    const allowedActions = rolePermissions[userRole] || ['read'];

    return {
      allowed: allowedActions.includes(action),
      allowedActions,
      userRole,
      action,
    };
  }

  suggestPOIByLocation(location, pois, context = {}) {
    const searchResults = this.searchPOI(pois, location, {
      radius: 3000,
      category: context.category,
      keyword: context.keyword,
    });

    if (searchResults.total === 0) {
      return {
        hasSuggestion: false,
        message: '附近没有找到匹配的POI',
      };
    }

    const suggestions = searchResults.pois.slice(0, 5).map(poi => ({
      ...poi,
      confidence: poi.matchScore,
      recommendationReason: this.getRecommendationReason(poi, context),
    }));

    return {
      hasSuggestion: true,
      suggestions,
      recommended: suggestions[0],
    };
  }

  getRecommendationReason(poi, context) {
    const reasons = [];

    if (poi.distance < 500) {
      reasons.push('距离较近');
    }

    if (poi.matchScore > 0.8) {
      reasons.push('匹配度高');
    }

    if (poi.category === context.category) {
      reasons.push('类型匹配');
    }

    return reasons.length > 0 ? reasons.join('、') : '默认推荐';
  }

  getPOICategories() {
    return [
      { code: '交通枢纽', name: '交通枢纽', icon: '🚄' },
      { code: '景点', name: '景点', icon: '🏛️' },
      { code: '商业区', name: '商业区', icon: '🏢' },
      { code: '住宅区', name: '住宅区', icon: '🏠' },
      { code: '教育机构', name: '教育机构', icon: '🏫' },
      { code: '医疗机构', name: '医疗机构', icon: '🏥' },
      { code: '政府机构', name: '政府机构', icon: '🏛️' },
      { code: '餐饮', name: '餐饮', icon: '🍽️' },
      { code: '酒店', name: '酒店', icon: '🏨' },
      { code: '停车场', name: '停车场', icon: '🅿️' },
    ];
  }
}

module.exports = new POIEngine();
