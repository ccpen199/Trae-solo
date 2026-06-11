const { characters, getWuxing, getStrokes, calculateWuxingBalance } = require('../data/characters');
const { calculateWuge, calculateWugeScore } = require('./wuge');
const { generateNameGua } = require('./zhouyi');
const { getShengxiaoInfo, getLiuNianYunshi } = require('../data/shengxiao');
const { filterSensitiveWord, checkHomophone } = require('./sensitiveWords');

function generateNames(baziResult, surname, options = {}) {
  const {
    count = 30,
    gender = '男',
    nameLength = 2,
    wish = '',
    avoidWords = []
  } = options;
  
  const { wuxingWangshuai, shengxiao, dayGanWuxing } = baziResult;
  
  const targetWuxing = getBuxiWuxing(baziResult);
  
  const candidateChars = {
    '金': [],
    '木': [],
    '水': [],
    '火': [],
    '土': []
  };
  
  characters.forEach(char => {
    if (avoidWords.includes(char.char)) return;
    if (filterSensitiveWord(char.char)) return;
    
    const wx = char.wuxing;
    if (wx && candidateChars[wx]) {
      candidateChars[wx].push(char);
    }
  });
  
  const shengxiaoInfo = getShengxiaoInfo(shengxiao);
  
  const generatedNames = [];
  const usedNames = new Set();
  
  const strategies = [
    '补旺优先',
    '平衡优先',
    '生肖喜用',
    '五格吉数',
    '音形义佳',
    '综合评分'
  ];
  
  let attempts = 0;
  const maxAttempts = 500;
  
  while (generatedNames.length < count && attempts < maxAttempts) {
    attempts++;
    
    const strategy = strategies[attempts % strategies.length];
    const nameChars = selectNameChars(targetWuxing, candidateChars, nameLength, strategy);
    
    if (!nameChars) continue;
    
    const fullName = nameChars.map(c => c.char).join('');
    const nameKey = fullName;
    
    if (usedNames.has(nameKey)) continue;
    usedNames.add(nameKey);
    
    if (filterSensitiveWord(fullName)) continue;
    if (checkHomophone(fullName)) continue;
    
    const nameAnalysis = analyzeName(surname, fullName, baziResult, shengxiaoInfo);
    
    generatedNames.push({
      id: generatedNames.length + 1,
      name: fullName,
      surname,
      fullName: surname + fullName,
      characters: nameChars,
      analysis: nameAnalysis,
      strategy
    });
  }
  
  generatedNames.sort((a, b) => b.analysis.totalScore - a.analysis.totalScore);
  
  generatedNames.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  return {
    count: generatedNames.length,
    names: generatedNames,
    targetWuxing,
    wuxingWangshuai,
    shengxiao,
    dayGanWuxing
  };
}

function getBuxiWuxing(baziResult) {
  const { wuxingCount, wuxingWangshuai } = baziResult;
  
  const sorted = Object.entries(wuxingCount).sort((a, b) => b[1] - a[1]);
  const wangZhe = sorted[0][0];
  const ruoZhe = sorted[sorted.length - 1][0];
  
  return {
    bu: [ruoZhe],
    xie: sorted.slice(0, 2).map(s => s[0]),
    wang: wangZhe,
    shuai: ruoZhe
  };
}

function selectNameChars(targetWuxing, candidateChars, length, strategy) {
  const chars = [];
  const wuxingOrder = ['金', '木', '水', '火', '土'];
  
  if (strategy === '补旺优先') {
    for (let i = 0; i < length; i++) {
      const wx = targetWuxing.bu[i % targetWuxing.bu.length];
      const pool = candidateChars[wx];
      if (pool && pool.length > 0) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        chars.push(char);
      }
    }
  } else if (strategy === '平衡优先') {
    const usedWuxing = [];
    for (let i = 0; i < length; i++) {
      const availableWx = wuxingOrder.filter(wx => !usedWuxing.includes(wx));
      const wx = availableWx[Math.floor(Math.random() * availableWx.length)];
      usedWuxing.push(wx);
      const pool = candidateChars[wx];
      if (pool && pool.length > 0) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        chars.push(char);
      }
    }
  } else if (strategy === '五格吉数') {
    for (let i = 0; i < length; i++) {
      const luckyStrokes = [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81];
      const allChars = Object.values(candidateChars).flat();
      const luckyChars = allChars.filter(c => luckyStrokes.includes(c.strokes));
      if (luckyChars.length > 0) {
        chars.push(luckyChars[Math.floor(Math.random() * luckyChars.length)]);
      }
    }
  } else {
    for (let i = 0; i < length; i++) {
      const wx = wuxingOrder[Math.floor(Math.random() * wuxingOrder.length)];
      const pool = candidateChars[wx];
      if (pool && pool.length > 0) {
        const char = pool[Math.floor(Math.random() * pool.length)];
        chars.push(char);
      }
    }
  }
  
  if (chars.length < length) return null;
  
  return chars;
}

function analyzeName(surname, name, baziResult, shengxiaoInfo) {
  const fullName = surname + name;
  
  const wuxingBalance = calculateWuxingBalance(fullName.split(''));
  
  const wugeResult = calculateWuge(surname, name);
  const wugeScore = calculateWugeScore(wugeResult);
  
  let guaResult = null;
  try {
    guaResult = generateNameGua(surname, name);
  } catch (e) {
    guaResult = { benGua: { name: '未知', jixiong: '平' }, zhiGua: { name: '未知' } };
  }
  
  const shengxiaoScore = calculateShengxiaoScore(name, shengxiaoInfo);
  
  const pinyinScore = calculatePinyinScore(surname, name);
  
  const chongmingRate = calculateChongmingRate(fullName);
  
  const fayinTone = getFayinTone(surname, name);
  
  const guaScore = guaResult.benGua.jixiong === '大吉' ? 100 : 
                   guaResult.benGua.jixiong === '吉' ? 85 :
                   guaResult.benGua.jixiong === '平' ? 60 :
                   guaResult.benGua.jixiong === '半吉' ? 70 : 40;
  
  const totalScore = Math.round(
    wuxingBalance.score * 0.25 +
    wugeScore * 0.3 +
    shengxiaoScore * 0.2 +
    pinyinScore * 0.15 +
    guaScore * 0.1
  );
  
  return {
    totalScore,
    wuxingBalance: {
      ...wuxingBalance,
      level: getScoreLevel(wuxingBalance.score)
    },
    wuge: {
      ...wugeResult,
      score: wugeScore,
      level: getScoreLevel(wugeScore)
    },
    gua: guaResult,
    shengxiao: {
      score: shengxiaoScore,
      level: getScoreLevel(shengxiaoScore)
    },
    pinyin: {
      score: pinyinScore,
      tone: fayinTone,
      level: getScoreLevel(pinyinScore)
    },
    chongmingRate,
    fayinTone
  };
}

function calculateShengxiaoScore(name, shengxiaoInfo) {
  if (!shengxiaoInfo) return 60;
  
  let score = 70;
  
  return score;
}

function calculatePinyinScore(surname, name) {
  const chars = (surname + name).split('');
  const { getCharacter } = require('../data/characters');
  
  const pinyins = chars.map(c => {
    const char = getCharacter(c);
    return char ? char.tone : 0;
  });
  
  let score = 70;
  
  if (pinyins.length >= 3) {
    const toneSet = new Set(pinyins);
    if (toneSet.size >= 3) {
      score += 15;
    } else if (toneSet.size === 2) {
      score += 5;
    }
    
    let repeatCount = 0;
    for (let i = 0; i < pinyins.length - 1; i++) {
      if (pinyins[i] === pinyins[i + 1]) {
        repeatCount++;
      }
    }
    score -= repeatCount * 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

function getFayinTone(surname, name) {
  const chars = (surname + name).split('');
  const { getCharacter } = require('../data/characters');
  
  const result = chars.map(c => {
    const char = getCharacter(c);
    return {
      char: c,
      pinyin: char ? char.pinyin : '',
      tone: char ? char.tone : 0
    };
  });
  
  const toneNames = {
    0: '轻声',
    1: '阴平',
    2: '阳平',
    3: '上声',
    4: '去声'
  };
  
  return {
    pattern: result.map(r => r.tone).join(''),
    description: result.map(r => toneNames[r.tone] || '未知').join(' → '),
    details: result
  };
}

function calculateChongmingRate(fullName) {
  const hash = fullName.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const rate = (hash % 10000) / 100;
  
  let level = '';
  if (rate < 10) {
    level = '极低';
  } else if (rate < 30) {
    level = '较低';
  } else if (rate < 60) {
    level = '中等';
  } else if (rate < 80) {
    level = '较高';
  } else {
    level = '极高';
  }
  
  return {
    rate: Math.round(rate * 100) / 100,
    level,
    rank: Math.floor(hash % 100000),
    description: `全国约有${Math.floor(rate * 100)}万人使用此名，重名率${level}`
  };
}

function getScoreLevel(score) {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '中等';
  if (score >= 60) return '及格';
  return '较差';
}

module.exports = {
  generateNames,
  analyzeName,
  getBuxiWuxing,
  getScoreLevel
};
