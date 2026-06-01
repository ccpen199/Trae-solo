const express = require('express');
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const sceneTypes = ['人像', '风景', '美食', '夜景', '日落', '室内', '户外', '宠物', '建筑', '其他'];

router.get('/scene-detect', optionalAuth, (req, res) => {
  const randomScene = sceneTypes[Math.floor(Math.random() * sceneTypes.length)];
  const confidence = 0.7 + Math.random() * 0.3;
  
  const suggestions = {
    '人像': ['建议开启人像模式', '推荐使用美颜+清新滤镜', '可调节虚化背景'],
    '风景': ['建议开启HDR模式', '推荐使用风景滤镜', '注意水平线对齐'],
    '美食': ['建议开启美食模式', '推荐使用暖调滤镜', '靠近主体拍摄'],
    '夜景': ['建议开启夜景模式', '推荐使用夜景滤镜', '建议使用三脚架'],
    '其他': ['保持稳定', '注意光线', '尝试不同角度']
  };

  res.json({
    scene: randomScene,
    confidence: confidence.toFixed(2),
    suggestions: suggestions[randomScene] || suggestions['其他'],
    recommendedBeauty: {
      smooth: randomScene === '人像' ? 0.6 : 0.3,
      whiten: randomScene === '人像' ? 0.5 : 0.2,
      filter: randomScene === '人像' ? '清新' : '原图'
    }
  });
});

router.get('/beauty-preferences', authMiddleware, (req, res) => {
  try {
    let prefs = db.prepare('SELECT * FROM beauty_preferences WHERE user_id = ?').get(req.user.id);
    if (!prefs) {
      db.prepare('INSERT INTO beauty_preferences (user_id) VALUES (?)').run(req.user.id);
      prefs = db.prepare('SELECT * FROM beauty_preferences WHERE user_id = ?').get(req.user.id);
    }
    res.json({ preferences: prefs });
  } catch (error) {
    res.status(500).json({ message: '获取美颜偏好失败', error: error.message });
  }
});

router.put('/beauty-preferences', authMiddleware, (req, res) => {
  const { smooth_level, whiten_level, slim_face_level, big_eye_level, nose_level, lip_level, last_used_filter } = req.body;
  
  const updates = [];
  const params = [];
  
  const fields = { smooth_level, whiten_level, slim_face_level, big_eye_level, nose_level, lip_level, last_used_filter };
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  });
  
  if (updates.length === 0) {
    return res.status(400).json({ message: '没有需要更新的内容' });
  }

  try {
    params.push(req.user.id);
    const result = db.prepare(`UPDATE beauty_preferences SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(...params);
    
    if (result.changes === 0) {
      const insertFields = ['user_id', ...Object.keys(fields).filter(k => fields[k] !== undefined)];
      const insertParams = [req.user.id, ...params.slice(0, -1)];
      db.prepare(`INSERT INTO beauty_preferences (${insertFields.join(', ')}) VALUES (${insertParams.map(() => '?').join(', ')})`).run(...insertParams);
    }
    
    res.json({ message: '美颜偏好已保存' });
  } catch (error) {
    res.status(500).json({ message: '保存美颜偏好失败', error: error.message });
  }
});

router.post('/capture-suggestion', optionalAuth, (req, res) => {
  const { scene, lightingCondition, deviceOrientation } = req.body;
  
  const suggestions = [];
  
  if (lightingCondition === 'low') {
    suggestions.push('光线较暗，建议开启闪光灯或夜景模式');
  } else if (lightingCondition === 'bright') {
    suggestions.push('光线充足，建议降低曝光补偿');
  }
  
  if (Math.abs(deviceOrientation) > 10) {
    suggestions.push('建议保持设备水平');
  }
  
  suggestions.push('点击屏幕对焦主体');
  suggestions.push('尝试使用网格线构图');
  
  res.json({
    suggestions,
    autoSettings: {
      exposure: lightingCondition === 'low' ? 0.3 : -0.1,
      iso: lightingCondition === 'low' ? 800 : 100,
      shutterSpeed: lightingCondition === 'low' ? '1/30s' : '1/250s'
    }
  });
});

module.exports = router;