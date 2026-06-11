const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const tianGanWuxing = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

const diZhiWuxing = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

const diZhiShengxiao = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
  '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
  '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
};

const tianGanYinYang = {
  '甲': '阳', '乙': '阴',
  '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴',
  '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴'
};

const diZhiYinYang = {
  '子': '阳', '丑': '阴', '寅': '阳', '卯': '阴',
  '辰': '阳', '巳': '阴', '午': '阳', '未': '阴',
  '申': '阳', '酉': '阴', '戌': '阳', '亥': '阴'
};

const diZhiHidden = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '戊', '庚'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲']
};

function getShengxiaoByYear(year) {
  const index = (year - 4) % 12;
  return diZhiShengxiao[diZhi[index >= 0 ? index : index + 12]];
}

function getDiZhiByShengxiao(shengxiao) {
  const entries = Object.entries(diZhiShengxiao);
  const found = entries.find(([, sx]) => sx === shengxiao);
  return found ? found[0] : null;
}

function trueSolarTimeAdjust(hour, minute, longitude, timezone = 8) {
  const localMeanTime = hour + minute / 60;
  const timeDiff = (longitude - 120) / 15;
  let trueSolar = localMeanTime + timeDiff;
  
  if (trueSolar < 0) trueSolar += 24;
  if (trueSolar >= 24) trueSolar -= 24;
  
  return {
    hour: Math.floor(trueSolar),
    minute: Math.round((trueSolar - Math.floor(trueSolar)) * 60),
    decimal: trueSolar
  };
}

function hourToDiZhi(hour) {
  if (hour >= 23 || hour < 1) return '子';
  if (hour >= 1 && hour < 3) return '丑';
  if (hour >= 3 && hour < 5) return '寅';
  if (hour >= 5 && hour < 7) return '卯';
  if (hour >= 7 && hour < 9) return '辰';
  if (hour >= 9 && hour < 11) return '巳';
  if (hour >= 11 && hour < 13) return '午';
  if (hour >= 13 && hour < 15) return '未';
  if (hour >= 15 && hour < 17) return '申';
  if (hour >= 17 && hour < 19) return '酉';
  if (hour >= 19 && hour < 21) return '戌';
  return '亥';
}

function yearGanZhi(year) {
  const ganIndex = (year - 4) % 10;
  const zhiIndex = (year - 4) % 12;
  return {
    tianGan: tianGan[ganIndex >= 0 ? ganIndex : ganIndex + 10],
    diZhi: diZhi[zhiIndex >= 0 ? zhiIndex : zhiIndex + 12]
  };
}

function monthGanZhi(year, month) {
  const yearGan = yearGanZhi(year).tianGan;
  const yearGanIndex = tianGan.indexOf(yearGan);
  
  const monthZhiIndex = (month + 1) % 12;
  const monthZhi = diZhi[monthZhiIndex >= 2 ? monthZhiIndex - 2 : monthZhiIndex + 10];
  
  let monthGanIndex;
  if (yearGanIndex % 5 === 0 || yearGanIndex % 5 === 4) {
    monthGanIndex = (month + 1) % 10;
  } else if (yearGanIndex % 5 === 1 || yearGanIndex % 5 === 5) {
    monthGanIndex = (month + 3) % 10;
  } else if (yearGanIndex % 5 === 2 || yearGanIndex % 5 === 6) {
    monthGanIndex = (month + 5) % 10;
  } else if (yearGanIndex % 5 === 3 || yearGanIndex % 5 === 7) {
    monthGanIndex = (month + 7) % 10;
  } else {
    monthGanIndex = (month + 9) % 10;
  }
  
  return {
    tianGan: tianGan[monthGanIndex],
    diZhi: monthZhi
  };
}

function dayGanZhi(year, month, day) {
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const daysDiff = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  
  const ganIndex = (daysDiff + 9) % 10;
  const zhiIndex = (daysDiff + 1) % 12;
  
  return {
    tianGan: tianGan[ganIndex],
    diZhi: diZhi[zhiIndex]
  };
}

function calculateBaZi(year, month, day, hour, minute, longitude = 116.4, gender = '男') {
  const trueSolar = trueSolarTimeAdjust(hour, minute, longitude);
  const trueHour = trueSolar.hour;
  
  const yearGZ = yearGanZhi(year);
  const monthGZ = monthGanZhi(year, month);
  const dayGZ = dayGanZhi(year, month, day);
  const hourZhi = hourToDiZhi(trueHour);
  
  const dayGanIndex = tianGan.indexOf(dayGZ.tianGan);
  const hourZhiIndex = diZhi.indexOf(hourZhi);
  let hourGanIndex;
  
  if (dayGanIndex % 5 === 0 || dayGanIndex % 5 === 4) {
    hourGanIndex = (hourZhiIndex + 0) % 10;
  } else if (dayGanIndex % 5 === 1 || dayGanIndex % 5 === 5) {
    hourGanIndex = (hourZhiIndex + 2) % 10;
  } else if (dayGanIndex % 5 === 2 || dayGanIndex % 5 === 6) {
    hourGanIndex = (hourZhiIndex + 4) % 10;
  } else if (dayGanIndex % 5 === 3 || dayGanIndex % 5 === 7) {
    hourGanIndex = (hourZhiIndex + 6) % 10;
  } else {
    hourGanIndex = (hourZhiIndex + 8) % 10;
  }
  
  const hourGZ = {
    tianGan: tianGan[hourGanIndex],
    diZhi: hourZhi
  };
  
  const eightChars = [
    { position: '年柱', ...yearGZ },
    { position: '月柱', ...monthGZ },
    { position: '日柱', ...dayGZ },
    { position: '时柱', ...hourGZ }
  ];
  
  const dayGan = dayGZ.tianGan;
  const dayGanWuxing = tianGanWuxing[dayGan];
  
  const wuxingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  
  eightChars.forEach(pillar => {
    wuxingCount[tianGanWuxing[pillar.tianGan]]++;
    wuxingCount[diZhiWuxing[pillar.diZhi]]++;
    
    const hidden = diZhiHidden[pillar.diZhi];
    hidden.forEach((gan, idx) => {
      const weight = idx === 0 ? 0.7 : idx === 1 ? 0.2 : 0.1;
      wuxingCount[tianGanWuxing[gan]] += weight;
    });
  });
  
  const totalWuxing = Object.values(wuxingCount).reduce((a, b) => a + b, 0);
  const wuxingPercent = {};
  Object.keys(wuxingCount).forEach(k => {
    wuxingPercent[k] = Math.round(wuxingCount[k] / totalWuxing * 100) / 100;
  });
  
  const sortedWuxing = Object.entries(wuxingCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  
  const shengxiao = diZhiShengxiao[yearGZ.diZhi];
  
  const dayGanIndex5 = tianGan.indexOf(dayGan) % 10;
  let dayunStart = 0;
  const dayun = [];
  
  if (gender === '男') {
    if (dayGanIndex5 % 2 === 0) {
      dayunStart = Math.ceil((365 / 3) / 365 * 10);
      for (let i = 1; i <= 8; i++) {
        const idx = (tianGan.indexOf(monthGZ.tianGan) + i) % 10;
        const zidx = (diZhi.indexOf(monthGZ.diZhi) + i) % 12;
        dayun.push({
          age: i * 10,
          tianGan: tianGan[idx],
          diZhi: diZhi[zidx]
        });
      }
    } else {
      dayunStart = Math.floor((365 / 3) / 365 * 10);
      for (let i = 1; i <= 8; i++) {
        const idx = (tianGan.indexOf(monthGZ.tianGan) - i + 10) % 10;
        const zidx = (diZhi.indexOf(monthGZ.diZhi) - i + 12) % 12;
        dayun.push({
          age: i * 10,
          tianGan: tianGan[idx],
          diZhi: diZhi[zidx]
        });
      }
    }
  } else {
    if (dayGanIndex5 % 2 === 1) {
      dayunStart = Math.ceil((365 / 3) / 365 * 10);
      for (let i = 1; i <= 8; i++) {
        const idx = (tianGan.indexOf(monthGZ.tianGan) + i) % 10;
        const zidx = (diZhi.indexOf(monthGZ.diZhi) + i) % 12;
        dayun.push({
          age: i * 10,
          tianGan: tianGan[idx],
          diZhi: diZhi[zidx]
        });
      }
    } else {
      dayunStart = Math.floor((365 / 3) / 365 * 10);
      for (let i = 1; i <= 8; i++) {
        const idx = (tianGan.indexOf(monthGZ.tianGan) - i + 10) % 10;
        const zidx = (diZhi.indexOf(monthGZ.diZhi) - i + 12) % 12;
        dayun.push({
          age: i * 10,
          tianGan: tianGan[idx],
          diZhi: diZhi[zidx]
        });
      }
    }
  }
  
  return {
    eightChars,
    dayGan,
    dayGanWuxing,
    shengxiao,
    wuxingCount,
    wuxingPercent,
    wuxingWangshuai: {
      wang: sortedWuxing.slice(0, 2),
      shuai: sortedWuxing.slice(-2),
      mingGe: dayGanWuxing + '命'
    },
    trueSolarTime: trueSolar,
    dayun,
    dayunStart,
    gender
  };
}

module.exports = {
  tianGan,
  diZhi,
  tianGanWuxing,
  diZhiWuxing,
  diZhiShengxiao,
  tianGanYinYang,
  diZhiYinYang,
  diZhiHidden,
  getShengxiaoByYear,
  getDiZhiByShengxiao,
  trueSolarTimeAdjust,
  hourToDiZhi,
  yearGanZhi,
  monthGanZhi,
  dayGanZhi,
  calculateBaZi
};
