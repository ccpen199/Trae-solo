const express = require('express');
const router = express.Router();

const { generateNames, analyzeName } = require('../utils/nameGenerator');
const { calculateBaZi } = require('../utils/bazi');
const { getLiuNianYunshi } = require('../data/shengxiao');

router.post('/analyze', (req, res) => {
  try {
    const { surname, gender, birthday, birthHour, birthMinute, longitude, nameLength, wish } = req.body;
    
    if (!surname || !gender || !birthday || birthHour === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    const date = new Date(birthday);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const baziResult = calculateBaZi(
      year, month, day,
      birthHour, birthMinute || 0,
      longitude || 116.4,
      gender
    );
    
    const liuNian = getLiuNianYunshi(baziResult.shengxiao, 2025);
    
    const namesResult = generateNames(baziResult, surname, {
      count: 30,
      gender,
      nameLength: nameLength || 2,
      wish: wish || ''
    });
    
    res.json({
      success: true,
      data: {
        bazi: baziResult,
        liuNian2025: liuNian,
        names: namesResult
      }
    });
  } catch (error) {
    console.error('起名分析错误:', error);
    res.status(500).json({
      success: false,
      message: '分析失败，请稍后重试',
      error: error.message
    });
  }
});

router.post('/analyze-single', (req, res) => {
  try {
    const { surname, name, gender, birthday, birthHour, birthMinute, longitude } = req.body;
    
    if (!surname || !name) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    let baziResult = null;
    
    if (birthday && birthHour !== undefined) {
      const date = new Date(birthday);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      baziResult = calculateBaZi(
        year, month, day,
        birthHour, birthMinute || 0,
        longitude || 116.4,
        gender || '男'
      );
    } else {
      baziResult = {
        wuxingWangshuai: {
          wang: ['金', '木'],
          shuai: ['水', '火'],
          mingGe: '未知'
        },
        shengxiao: '龙',
        dayGanWuxing: '土',
        wuxingCount: { '金': 2, '木': 2, '水': 1, '火': 1, '土': 2 },
        wuxingPercent: { '金': 0.25, '木': 0.25, '水': 0.125, '火': 0.125, '土': 0.25 }
      };
    }
    
    const { getShengxiaoInfo } = require('../data/shengxiao');
    const shengxiaoInfo = getShengxiaoInfo(baziResult.shengxiao);
    
    const analysis = analyzeName(surname, name, baziResult, shengxiaoInfo);
    
    res.json({
      success: true,
      data: {
        name: surname + name,
        analysis,
        bazi: baziResult
      }
    });
  } catch (error) {
    console.error('名字分析错误:', error);
    res.status(500).json({
      success: false,
      message: '分析失败',
      error: error.message
    });
  }
});

router.get('/characters', (req, res) => {
  try {
    const { wuxing, strokes, page = 1, limit = 20 } = req.query;
    const { characters } = require('../data/characters');
    
    let result = [...characters];
    
    if (wuxing) {
      result = result.filter(c => c.wuxing === wuxing);
    }
    
    if (strokes) {
      const strokesNum = parseInt(strokes);
      result = result.filter(c => c.strokes === strokesNum);
    }
    
    const total = result.length;
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        characters: paginated,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取汉字列表失败',
      error: error.message
    });
  }
});

router.post('/validate', (req, res) => {
  try {
    const { name } = req.body;
    const { validateName, checkBadComponents } = require('../utils/sensitiveWords');
    
    const validation = validateName(name);
    const components = checkBadComponents(name);
    
    res.json({
      success: true,
      data: {
        validation,
        components
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '验证失败',
      error: error.message
    });
  }
});

module.exports = router;
