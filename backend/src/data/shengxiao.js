const shengxiaoList = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

const shengxiaoXiJi = {
  '鼠': {
    xi: ['宀', '米', '豆', '鱼', '艹', '金', '玉', '木', '月', '田'],
    ji: ['山', '刀', '力', '弓', '土', '火', '石', '皮', '马', '酉'],
    description: '鼠为十二生肖之首，与十二地支之子相配。鼠喜夜间活动，喜食五谷杂粮。',
    personality: '聪明机智，适应性强，心思细腻，善于交际，勤俭持家'
  },
  '牛': {
    xi: ['艹', '豆', '米', '宀', '田', '车', '木', '亻', '金', '玉'],
    ji: ['羊', '马', '刀', '血', '火', '石', '山', '皮', '酉', '未'],
    description: '牛为十二生肖之二，与十二地支之丑相配。牛为耕田之畜，任劳任怨。',
    personality: '勤劳踏实，忠厚老实，坚韧不拔，责任感强，做事稳重'
  },
  '虎': {
    xi: ['山', '木', '林', '金', '玉', '月', '水', '马', '午', '戌'],
    ji: ['申', '猴', '蛇', '巳', '刀', '血', '火', '石', '皮', '小'],
    description: '虎为十二生肖之三，与十二地支之寅相配。虎为山林之王，威猛无比。',
    personality: '勇敢无畏，自信果断，正义感强，领导力强，热情豪爽'
  },
  '兔': {
    xi: ['艹', '木', '禾', '米', '豆', '宀', '口', '玉', '月', '亥'],
    ji: ['鸡', '酉', '龙', '辰', '鼠', '子', '刀', '血', '火', '皮'],
    description: '兔为十二生肖之四，与十二地支之卯相配。兔为温顺之兽，行动敏捷。',
    personality: '温和善良，聪明谨慎，举止优雅，心思细腻，善解人意'
  },
  '龙': {
    xi: ['云', '雨', '水', '金', '玉', '日', '月', '星', '辰', '申'],
    ji: ['狗', '戌', '兔', '卯', '土', '山', '石', '田', '穴', '小'],
    description: '龙为十二生肖之五，与十二地支之辰相配。龙为祥瑞之兽，能兴云布雨。',
    personality: '志向高远，气质非凡，创造力强，领导力强，慷慨大方'
  },
  '蛇': {
    xi: ['艹', '木', '虫', '鱼', '酉', '鸡', '丑', '牛', '心', '忄'],
    ji: ['猪', '亥', '虎', '寅', '猴', '申', '刀', '血', '火', '石'],
    description: '蛇为十二生肖之六，与十二地支之巳相配。蛇为灵物，能屈能伸。',
    personality: '沉稳冷静，心思缜密，直觉敏锐，神秘莫测，追求完美'
  },
  '马': {
    xi: ['艹', '禾', '米', '豆', '金', '玉', '木', '日', '月', '寅'],
    ji: ['鼠', '子', '牛', '丑', '山', '刀', '血', '火', '石', '车'],
    description: '马为十二生肖之七，与十二地支之午相配。马为奔腾之兽，日行千里。',
    personality: '热情奔放，自由独立，积极向上，行动力强，善于交际'
  },
  '羊': {
    xi: ['艹', '木', '禾', '米', '豆', '宀', '口', '金', '玉', '亥'],
    ji: ['牛', '丑', '狗', '戌', '鼠', '子', '刀', '血', '火', '石'],
    description: '羊为十二生肖之八，与十二地支之未相配。羊为温顺之畜，象征吉祥。',
    personality: '温和善良，有同情心，知足常乐，艺术感强，人缘好'
  },
  '猴': {
    xi: ['木', '林', '山', '口', '言', '金', '玉', '子', '辰', '龙'],
    ji: ['虎', '寅', '蛇', '巳', '猪', '亥', '刀', '血', '火', '石'],
    description: '猴为十二生肖之九，与十二地支之申相配。猴为灵长动物，聪明机智。',
    personality: '聪明伶俐，反应敏捷，好奇心强，幽默感强，多才多艺'
  },
  '鸡': {
    xi: ['米', '豆', '虫', '鱼', '宀', '山', '金', '玉', '木', '蛇'],
    ji: ['兔', '卯', '狗', '戌', '鼠', '子', '刀', '血', '火', '石'],
    description: '鸡为十二生肖之十，与十二地支之酉相配。鸡为报晓之禽，守时守信。',
    personality: '勤奋努力，守时守信，条理分明，追求完美，有责任心'
  },
  '狗': {
    xi: ['亻', '人', '口', '宀', '豆', '米', '鱼', '金', '玉', '寅'],
    ji: ['龙', '辰', '鸡', '酉', '羊', '未', '牛', '丑', '刀', '血'],
    description: '狗为十二生肖之十一，与十二地支之戌相配。狗为忠诚之兽，守家护院。',
    personality: '忠诚可靠，正义感强，勇敢无畏，意志坚定，重视感情'
  },
  '猪': {
    xi: ['艹', '木', '米', '豆', '宀', '金', '玉', '卯', '兔', '未'],
    ji: ['蛇', '巳', '猴', '申', '虎', '寅', '刀', '血', '火', '石'],
    description: '猪为十二生肖之十二，与十二地支之亥相配。猪为福兽，象征富足。',
    personality: '善良忠厚，心胸宽广，乐观豁达，重情重义，福气满满'
  }
};

const liuNian2025 = {
  year: 2025,
  yearGanZhi: '乙巳',
  yearShengxiao: '蛇',
  yearWuxing: '火',
  chongHeTable: [
    { shengxiao: '鼠', yueming: '鼠年生人', relation: '三合', jixiong: '吉', yunyishi: '事业顺遂，贵人相助，财运亨通' },
    { shengxiao: '牛', yueming: '牛年生人', relation: '三合', jixiong: '吉', yunyishi: '家庭和睦，身体健康，财运平稳' },
    { shengxiao: '虎', yueming: '虎年生人', relation: '相害', jixiong: '凶', yunyishi: '注意健康，谨言慎行，避免投资' },
    { shengxiao: '兔', yueming: '兔年生人', relation: '相生', jixiong: '半吉', yunyishi: '事业上升，感情稳定，注意休息' },
    { shengxiao: '龙', yueming: '龙年生人', relation: '相克', jixiong: '凶', yunyishi: '诸事不顺，破财消灾，宜静不宜动' },
    { shengxiao: '蛇', yueming: '蛇年生人', relation: '值太岁', jixiong: '平', yunyishi: '本命年，犯太岁，宜佩戴红绳化解' },
    { shengxiao: '马', yueming: '马年生人', relation: '六合', jixiong: '大吉', yunyishi: '桃花运旺，事业有成，贵人运佳' },
    { shengxiao: '羊', yueming: '羊年生人', relation: '相生', jixiong: '半吉', yunyishi: '财运不错，工作顺利，注意饮食' },
    { shengxiao: '猴', yueming: '猴年生人', relation: '相冲', jixiong: '大凶', yunyishi: '冲太岁，变动大，宜守不宜攻' },
    { shengxiao: '鸡', yueming: '鸡年生人', relation: '三合', jixiong: '吉', yunyishi: '事业顺遂，财运亨通，感情甜蜜' },
    { shengxiao: '狗', yueming: '狗年生人', relation: '相刑', jixiong: '凶', yunyishi: '是非口舌，官司缠身，忍一时风平浪静' },
    { shengxiao: '猪', yueming: '猪年生人', relation: '相冲', jixiong: '凶', yunyishi: '冲太岁，注意安全，谨慎投资' }
  ]
};

const shengxiaoChongHe = {
  '鼠': {
    liuhe: '牛',
    sanhe: ['龙', '猴'],
    liuchong: '马',
    liuhai: '羊',
    sanxing: ['兔', '鸡']
  },
  '牛': {
    liuhe: '鼠',
    sanhe: ['蛇', '鸡'],
    liuchong: '羊',
    liuhai: '马',
    sanxing: ['狗', '龙']
  },
  '虎': {
    liuhe: '猪',
    sanhe: ['马', '狗'],
    liuchong: '猴',
    liuhai: '蛇',
    sanxing: ['蛇', '猴']
  },
  '兔': {
    liuhe: '狗',
    sanhe: ['羊', '猪'],
    liuchong: '鸡',
    liuhai: '龙',
    sanxing: ['鼠', '马']
  },
  '龙': {
    liuhe: '鸡',
    sanhe: ['鼠', '猴'],
    liuchong: '狗',
    liuhai: '兔',
    sanxing: ['牛', '狗']
  },
  '蛇': {
    liuhe: '猴',
    sanhe: ['牛', '鸡'],
    liuchong: '猪',
    liuhai: '虎',
    sanxing: ['虎', '猴']
  },
  '马': {
    liuhe: '羊',
    sanhe: ['虎', '狗'],
    liuchong: '鼠',
    liuhai: '牛',
    sanxing: ['兔', '鸡']
  },
  '羊': {
    liuhe: '马',
    sanhe: ['兔', '猪'],
    liuchong: '牛',
    liuhai: '鼠',
    sanxing: ['狗', '牛']
  },
  '猴': {
    liuhe: '蛇',
    sanhe: ['鼠', '龙'],
    liuchong: '虎',
    liuhai: '猪',
    sanxing: ['虎', '蛇']
  },
  '鸡': {
    liuhe: '龙',
    sanhe: ['牛', '蛇'],
    liuchong: '兔',
    liuhai: '狗',
    sanxing: ['鼠', '马']
  },
  '狗': {
    liuhe: '兔',
    sanhe: ['虎', '马'],
    liuchong: '龙',
    liuhai: '鸡',
    sanxing: ['牛', '羊']
  },
  '猪': {
    liuhe: '虎',
    sanhe: ['兔', '羊'],
    liuchong: '蛇',
    liuhai: '猴',
    sanxing: ['猪', '蛇']
  }
};

function getShengxiaoInfo(shengxiao) {
  return shengxiaoXiJi[shengxiao] || null;
}

function getChongHeRelation(shengxiao1, shengxiao2) {
  const info = shengxiaoChongHe[shengxiao1];
  if (!info) return null;
  
  if (info.liuhe === shengxiao2) return { type: '六合', jixiong: '大吉' };
  if (info.sanhe.includes(shengxiao2)) return { type: '三合', jixiong: '吉' };
  if (info.liuchong === shengxiao2) return { type: '六冲', jixiong: '凶' };
  if (info.liuhai === shengxiao2) return { type: '六害', jixiong: '凶' };
  if (info.sanxing.includes(shengxiao2)) return { type: '三刑', jixiong: '凶' };
  if (shengxiao1 === shengxiao2) return { type: '本命', jixiong: '平' };
  
  return { type: '普通', jixiong: '平' };
}

function getLiuNianYunshi(shengxiao, year = 2025) {
  if (year === 2025) {
    return liuNian2025.chongHeTable.find(item => item.shengxiao === shengxiao);
  }
  return null;
}

function checkRadix(charRadicals, xiRadicals, jiRadicals) {
  let score = 0;
  let xiFound = [];
  let jiFound = [];
  
  if (charRadicals) {
    charRadicals.forEach(radical => {
      if (xiRadicals.includes(radical)) {
        score += 10;
        xiFound.push(radical);
      }
      if (jiRadicals.includes(radical)) {
        score -= 10;
        jiFound.push(radical);
      }
    });
  }
  
  return { score, xiFound, jiFound };
}

module.exports = {
  shengxiaoList,
  shengxiaoXiJi,
  liuNian2025,
  shengxiaoChongHe,
  getShengxiaoInfo,
  getChongHeRelation,
  getLiuNianYunshi,
  checkRadix
};
