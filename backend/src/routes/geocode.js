const express = require('express');
const geocodeEngine = require('../engines/geocodeEngine');
const { authMiddleware } = require('./auth');

const router = express.Router();

router.get('/geocode', authMiddleware, (req, res) => {
  try {
    const { address } = req.query;

    if (!address || address.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '地址不能为空',
      });
    }

    const result = geocodeEngine.geocode(address);

    res.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '地址解析失败',
      error: err.message,
    });
  }
});

router.get('/reverse-geocode', authMiddleware, (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: '坐标参数不能为空',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: '坐标格式错误',
      });
    }

    const result = geocodeEngine.reverseGeocode(latitude, longitude);

    res.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '逆地址解析失败',
      error: err.message,
    });
  }
});

router.get('/suggest', authMiddleware, (req, res) => {
  try {
    const { keyword, limit = 5, category } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空',
      });
    }

    const result = geocodeEngine.suggestPOI(keyword, {
      limit: parseInt(limit) || 5,
      category: category || null,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取地址建议失败',
      error: err.message,
    });
  }
});

router.post('/batch-geocode', authMiddleware, (req, res) => {
  try {
    const { addresses } = req.body;

    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({
        success: false,
        message: '地址列表格式错误',
      });
    }

    const result = geocodeEngine.batchGeocode(addresses);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '批量地址解析失败',
      error: err.message,
    });
  }
});

router.get('/distance', authMiddleware, (req, res) => {
  try {
    const { origin_lat, origin_lng, dest_lat, dest_lng } = req.query;

    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      return res.status(400).json({
        success: false,
        message: '坐标参数不完整',
      });
    }

    const origin = {
      lat: parseFloat(origin_lat),
      lng: parseFloat(origin_lng),
    };
    const destination = {
      lat: parseFloat(dest_lat),
      lng: parseFloat(dest_lng),
    };

    if (isNaN(origin.lat) || isNaN(origin.lng) || isNaN(destination.lat) || isNaN(destination.lng)) {
      return res.status(400).json({
        success: false,
        message: '坐标格式错误',
      });
    }

    const distance = geocodeEngine.calculateDistance(origin, destination);
    const formattedDistance = geocodeEngine.formatDistance(distance);

    res.json({
      success: true,
      data: {
        origin,
        destination,
        distance: Math.round(distance),
        formattedDistance,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '计算距离失败',
      error: err.message,
    });
  }
});

module.exports = router;
