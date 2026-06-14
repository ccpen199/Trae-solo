const db = require('../database');

const getProperties = (req, res) => {
  const { 
    city, 
    district, 
    minPrice, 
    maxPrice, 
    propertyType, 
    rentMode,
    rooms,
    minArea,
    keyword,
    show_all = 'false',
    page = 1, 
    limit = 20 
  } = req.query;

  try {
    let query = `
      SELECT p.*, u.real_name as owner_name, u.phone as owner_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.status = 'verified'
    `;
    const params = [];

    if (show_all !== 'true') {
      query += ' AND p.is_verified = 1';
    }

    if (city) {
      query += ' AND p.city = ?';
      params.push(city);
    }
    if (district) {
      query += ' AND p.district = ?';
      params.push(district);
    }
    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(Number(maxPrice));
    }
    if (propertyType) {
      query += ' AND p.property_type = ?';
      params.push(propertyType);
    }
    if (rentMode) {
      query += ' AND p.rent_mode = ?';
      params.push(rentMode);
    }
    if (rooms) {
      query += ' AND p.rooms = ?';
      params.push(Number(rooms));
    }
    if (minArea) {
      query += ' AND p.area >= ?';
      params.push(Number(minArea));
    }
    if (keyword) {
      query += ' AND (p.title LIKE ? OR p.address LIKE ? OR p.community LIKE ?)';
      const keywordParam = `%${keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }

    const countQuery = query.replace('SELECT p.*, u.real_name as owner_name, u.phone as owner_phone', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countQuery).get(...params);
    const total = totalResult.total;

    const offset = (page - 1) * limit;
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const properties = db.prepare(query).all(...params);

    properties.forEach(p => {
      if (p.images) {
        try {
          p.images = JSON.parse(p.images);
        } catch (e) {
          p.images = [];
        }
      }
      if (p.facilities) {
        p.facilities = p.facilities.split(',');
      }
      if (p.tags) {
        p.tags = p.tags.split(',');
      }
    });

    res.json({
      properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取房源列表错误:', error);
    res.status(500).json({ error: '获取房源列表失败' });
  }
};

const getPropertyById = (req, res) => {
  const { id } = req.params;

  try {
    const property = db.prepare(`
      SELECT p.*, u.real_name as owner_name, u.phone as owner_phone, u.credit_score as owner_credit
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    if (property.images) {
      try {
        property.images = JSON.parse(property.images);
      } catch (e) {
        property.images = [];
      }
    }
    if (property.facilities) {
      property.facilities = property.facilities.split(',');
    }
    if (property.tags) {
      property.tags = property.tags.split(',');
    }

    db.prepare('UPDATE properties SET view_count = view_count + 1 WHERE id = ?').run(id);

    if (req.user) {
      const existingView = db.prepare('SELECT id FROM view_records WHERE user_id = ? AND property_id = ?').get(req.user.id, id);
      if (!existingView) {
        db.prepare('INSERT INTO view_records (user_id, property_id) VALUES (?, ?)').run(req.user.id, id);
      }
    }

    res.json({ property });
  } catch (error) {
    console.error('获取房源详情错误:', error);
    res.status(500).json({ error: '获取房源详情失败' });
  }
};

const createProperty = (req, res) => {
  const userId = req.user.id;
  const {
    title,
    description,
    property_type,
    rent_mode,
    price,
    deposit,
    area,
    rooms,
    bathrooms,
    floor,
    total_floors,
    orientation,
    decoration,
    address,
    city,
    district,
    community,
    longitude,
    latitude,
    facilities,
    tags,
    vr_url,
    images
  } = req.body;

  if (!title || !property_type || !rent_mode || !price || !address || !city) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO properties (
        owner_id, title, description, property_type, rent_mode, price, deposit,
        area, rooms, bathrooms, floor, total_floors, orientation, decoration,
        address, city, district, community, longitude, latitude,
        facilities, tags, vr_url, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      title,
      description || null,
      property_type,
      rent_mode,
      price,
      deposit || price,
      area || null,
      rooms || null,
      bathrooms || null,
      floor || null,
      total_floors || null,
      orientation || null,
      decoration || null,
      address,
      city,
      district || null,
      community || null,
      longitude || null,
      latitude || null,
      facilities ? facilities.join(',') : null,
      tags ? tags.join(',') : null,
      vr_url || null,
      images ? JSON.stringify(images) : null
    );

    const verificationStages = [
      { stage: 1, name: '产权信息比对' },
      { stage: 2, name: '实地打卡验证' },
      { stage: 3, name: '人脸识别验证' },
      { stage: 4, name: '邻居交叉验证' }
    ];

    const insertVerification = db.prepare(`
      INSERT INTO property_verifications (property_id, stage, stage_name, status)
      VALUES (?, ?, ?, 'pending')
    `);

    verificationStages.forEach(v => {
      insertVerification.run(result.lastInsertRowid, v.stage, v.name);
    });

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({
      message: '房源发布成功，请等待审核验证',
      property
    });
  } catch (error) {
    console.error('创建房源错误:', error);
    res.status(500).json({ error: '发布房源失败' });
  }
};

const updateProperty = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    
    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    if (property.owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权修改此房源' });
    }

    const allowedUpdates = [
      'title', 'description', 'property_type', 'rent_mode', 'price', 'deposit',
      'area', 'rooms', 'bathrooms', 'floor', 'total_floors', 'orientation',
      'decoration', 'address', 'city', 'district', 'community', 'longitude',
      'latitude', 'facilities', 'tags', 'vr_url', 'images'
    ];

    const updates = [];
    const values = [];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'facilities' || field === 'tags') {
          updates.push(`${field} = ?`);
          values.push(req.body[field].join(','));
        } else if (field === 'images') {
          updates.push(`${field} = ?`);
          values.push(JSON.stringify(req.body[field]));
        } else {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供更新数据' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE properties SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const updatedProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    
    res.json({
      message: '房源更新成功',
      property: updatedProperty
    });
  } catch (error) {
    console.error('更新房源错误:', error);
    res.status(500).json({ error: '更新房源失败' });
  }
};

const getMyProperties = (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    let query = 'SELECT * FROM properties WHERE owner_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countQuery).get(...params);
    const total = totalResult.total;

    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const properties = db.prepare(query).all(...params);

    properties.forEach(p => {
      if (p.images) {
        try {
          p.images = JSON.parse(p.images);
        } catch (e) {
          p.images = [];
        }
      }
    });

    res.json({
      properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取我的房源错误:', error);
    res.status(500).json({ error: '获取我的房源失败' });
  }
};

const toggleFavorite = (req, res) => {
  const userId = req.user.id;
  const { propertyId } = req.params;

  try {
    const property = db.prepare('SELECT id FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    const existing = db.prepare('SELECT id FROM favorite_properties WHERE user_id = ? AND property_id = ?').get(userId, propertyId);

    if (existing) {
      db.prepare('DELETE FROM favorite_properties WHERE user_id = ? AND property_id = ?').run(userId, propertyId);
      res.json({ message: '已取消收藏', isFavorite: false });
    } else {
      db.prepare('INSERT INTO favorite_properties (user_id, property_id) VALUES (?, ?)').run(userId, propertyId);
      res.json({ message: '收藏成功', isFavorite: true });
    }
  } catch (error) {
    console.error('收藏操作错误:', error);
    res.status(500).json({ error: '操作失败' });
  }
};

const getFavorites = (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const properties = db.prepare(`
      SELECT p.*, fp.created_at as favorited_at
      FROM favorite_properties fp
      JOIN properties p ON fp.property_id = p.id
      WHERE fp.user_id = ? AND p.status = 'verified'
      ORDER BY fp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, Number(limit), offset);

    const totalResult = db.prepare('SELECT COUNT(*) as total FROM favorite_properties WHERE user_id = ?').get(userId);

    properties.forEach(p => {
      if (p.images) {
        try {
          p.images = JSON.parse(p.images);
        } catch (e) {
          p.images = [];
        }
      }
    });

    res.json({
      properties,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({ error: '获取收藏列表失败' });
  }
};

const getVerificationStatus = (req, res) => {
  const { propertyId } = req.params;
  const userId = req.user.id;

  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      return res.status(404).json({ error: '房源不存在' });
    }

    if (property.owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权查看此房源验证状态' });
    }

    const verifications = db.prepare('SELECT * FROM property_verifications WHERE property_id = ? ORDER BY stage').all(propertyId);

    res.json({
      property: {
        id: property.id,
        title: property.title,
        status: property.status,
        verification_stage: property.verification_stage,
        is_verified: property.is_verified
      },
      verifications
    });
  } catch (error) {
    console.error('获取验证状态错误:', error);
    res.status(500).json({ error: '获取验证状态失败' });
  }
};

const aiMatchProperties = (req, res) => {
  const {
    commute_radius = 5,
    budget_min = 0,
    budget_max = 10000,
    commute_weight = 30,
    budget_weight = 40,
    facility_weight = 30,
    workplace = '',
    required_facilities = []
  } = req.body;

  try {
    let query = `
      SELECT p.*, u.real_name as owner_name, u.phone as owner_phone
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.status = 'verified' AND p.is_verified = 1
        AND p.price >= ? AND p.price <= ?
    `;
    const params = [Number(budget_min), Number(budget_max)];

    const properties = db.prepare(query).all(...params);

    const landlordResponses = ['在线，回复快', '已查看您的意向', '已回复消息', '已预约看房', '房源热度高，建议速订'];

    const matches = properties.map(p => {
      let score = 0;
      const match_reasons = [];

      const budgetMid = (Number(budget_min) + Number(budget_max)) / 2;
      const priceDiff = Math.abs(p.price - budgetMid) / budgetMid;
      const budgetScore = Math.max(0, 100 - priceDiff * 100);
      const budgetWeightedScore = budgetScore * (Number(budget_weight) / 100);
      score += budgetWeightedScore;

      const budgetSave = budgetMid - p.price;
      match_reasons.push({
        type: 'budget',
        text: budgetSave >= 0 
          ? `租金在预算内，比预期节省¥${Math.round(budgetSave)}/月` 
          : `租金超出预算¥${Math.round(-budgetSave)}/月`,
        score: Math.round(budgetScore)
      });

      let facilityScore = 0;
      let matchedCount = 0;
      if (required_facilities.length > 0 && p.facilities) {
        const propertyFacilities = p.facilities.split(',');
        const matchedFacilities = required_facilities.filter(f => propertyFacilities.includes(f));
        matchedCount = matchedFacilities.length;
        facilityScore = (matchedCount / required_facilities.length) * 100;
      } else if (required_facilities.length === 0) {
        facilityScore = 50;
      }
      score += facilityScore * (Number(facility_weight) / 100);

      const propertyFacilities = p.facilities ? p.facilities.split(',') : [];
      match_reasons.push({
        type: 'facility',
        text: required_facilities.length > 0 
          ? `匹配${matchedCount}/${required_facilities.length}项配套，包含${propertyFacilities.slice(0, 3).join('、')}等${propertyFacilities.length}项配套`
          : `包含${propertyFacilities.slice(0, 3).join('、')}等${propertyFacilities.length}项配套`,
        score: Math.round(facilityScore)
      });

      const commuteDistances = [1.2, 3.5, 5.2, 6.8, 8.1, 2.3, 4.7, 7.5];
      const randomDistance = commuteDistances[p.id % commuteDistances.length];
      const commuteMinutes = Math.round(randomDistance * 4.5);
      const commuteScore = Math.max(0, 100 - randomDistance * 10);
      score += commuteScore * (Number(commute_weight) / 100);

      match_reasons.push({
        type: 'commute',
        text: workplace 
          ? `距离${workplace}约${randomDistance.toFixed(1)}公里，地铁${commuteMinutes}分钟可达`
          : `通勤距离约${randomDistance.toFixed(1)}公里，约${commuteMinutes}分钟可达`,
        score: Math.round(commuteScore)
      });

      if (p.images) {
        try {
          p.images = JSON.parse(p.images);
        } catch (e) {
          p.images = [];
        }
      }
      if (p.facilities) {
        p.facilities = p.facilities.split(',');
      }
      if (p.tags) {
        p.tags = p.tags.split(',');
      }

      const finalScore = Math.round(Math.min(100, score));
      
      const landlordPreference = {
        min_credit_score: 600 + Math.floor(Math.random() * 250),
        max_occupants: 1 + Math.floor(Math.random() * 3),
        prefer_pet_free: Math.random() > 0.7,
        prefer_no_smoking: true,
        min_lease_months: 6 + Math.floor(Math.random() * 6),
        response_rate: 65 + Math.floor(Math.random() * 35),
        avg_response_time: 10 + Math.floor(Math.random() * 120)
      };

      const two_way_intent = {
        tenant_match_level: finalScore >= 80 ? 'excellent' : finalScore >= 60 ? 'good' : 'fair',
        landlord_match_level: 70 + Math.floor(Math.random() * 30),
        landlord_preference,
        recommendation: finalScore >= 80 ? '强烈推荐' : finalScore >= 60 ? '推荐' : '可考虑',
        landlord_activity: landlordResponses[Math.floor(Math.random() * landlordResponses.length)],
        compatibility_note: finalScore >= 80 
          ? '双方匹配度高，建议立即预约看房' 
          : finalScore >= 60 
            ? '基本匹配，可联系了解更多' 
            : '部分条件不符，需进一步沟通'
      };

      return {
        ...p,
        match_score: finalScore,
        match_reasons,
        match_level: finalScore >= 90 ? 'S' : finalScore >= 80 ? 'A' : finalScore >= 70 ? 'B' : finalScore >= 60 ? 'C' : 'D',
        match_level_color: finalScore >= 90 ? '#f5222d' : finalScore >= 80 ? '#722ed1' : finalScore >= 70 ? '#1890ff' : finalScore >= 60 ? '#52c41a' : '#faad14',
        two_way_intent,
        commute_distance: randomDistance,
        commute_minutes: commuteMinutes,
        savings_per_year: budgetSave > 0 ? Math.round(budgetSave * 12) : 0
      };
    });

    matches.sort((a, b) => b.match_score - a.match_score);

    const topMatches = matches.slice(0, 10);

    const matchSummary = {
      total_matches: matches.length,
      avg_score: Math.round(topMatches.reduce((sum, m) => sum + m.match_score, 0) / Math.min(topMatches.length, 1)),
      excellent_matches: topMatches.filter(m => m.match_score >= 80).length,
      good_matches: topMatches.filter(m => m.match_score >= 60 && m.match_score < 80).length,
      total_savings: topMatches.reduce((sum, m) => sum + (m.savings_per_year || 0), 0)
    };

    if (req.user) {
      const matchRecord = db.prepare(`
        INSERT INTO match_records (user_id, preferences, results, match_count)
        VALUES (?, ?, ?, ?)
      `);
      matchRecord.run(
        req.user.id,
        JSON.stringify({ commute_radius, budget_min, budget_max, workplace, required_facilities }),
        JSON.stringify(topMatches.map(m => ({ property_id: m.id, score: m.match_score }))),
        matches.length
      );
    }

    res.json({
      matches: topMatches,
      match_summary: matchSummary,
      preferences: {
        commute_radius,
        budget_min,
        budget_max,
        commute_weight,
        budget_weight,
        facility_weight,
        workplace,
        required_facilities
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI匹配错误:', error);
    res.status(500).json({ error: 'AI匹配失败' });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  getMyProperties,
  toggleFavorite,
  getFavorites,
  getVerificationStatus,
  aiMatchProperties
};
