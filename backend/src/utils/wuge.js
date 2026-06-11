const { getStrokes } = require('../data/characters');

const wugeNumbers = {
  1: { type: '大吉', name: '太极之数', meaning: '万物开泰，生发无穷，利禄亨通' },
  2: { type: '凶', name: '两仪之数', meaning: '混沌未开，进退保守，志望难达' },
  3: { type: '大吉', name: '三才之数', meaning: '天地人和，大事大业，繁荣昌隆' },
  4: { type: '凶', name: '四象之数', meaning: '待于生发，万事慎重，不具营谋' },
  5: { type: '大吉', name: '五行之数', meaning: '五行俱权，循环相生，圆通畅达，福祉无穷' },
  6: { type: '吉', name: '六爻之数', meaning: '六爻之数，发展变化，天赋美德，吉祥安泰' },
  7: { type: '吉', name: '七政之数', meaning: '七政之数，精悍严谨，天赋之力，吉星照耀' },
  8: { type: '吉', name: '八卦之数', meaning: '八卦之数，乾坎艮震，巽离坤兑，无穷无尽' },
  9: { type: '凶', name: '大成之数', meaning: '大成之数，蕴涵凶险，或成或败，难以把握' },
  10: { type: '凶', name: '终结之数', meaning: '终结之数，雪暗飘零，偶或有成，回顾茫然' },
  11: { type: '大吉', name: '旱苗逢雨', meaning: '万物更新，调顺发达，恢弘泽世，繁荣富贵' },
  12: { type: '凶', name: '掘井无泉', meaning: '无理之数，发展薄弱，虽生不足，难酬志向' },
  13: { type: '大吉', name: '春日牡丹', meaning: '才艺多能，智谋奇略，忍柔当事，鸣奏大功' },
  14: { type: '凶', name: '破兆', meaning: '家庭缘薄，孤独遭难，谋事不达，悲惨不测' },
  15: { type: '大吉', name: '福寿', meaning: '福寿圆满，富贵荣誉，涵养雅量，德高望重' },
  16: { type: '大吉', name: '厚重', meaning: '厚重载德，安富尊荣，财官双美，功成名就' },
  17: { type: '吉', name: '刚强', meaning: '权威刚强，突破万难，如能容忍，必获成功' },
  18: { type: '吉', name: '铁镜重磨', meaning: '权威显达，博得名利，且养柔德，功成名就' },
  19: { type: '凶', name: '多难', meaning: '风云蔽日，辛苦重来，虽有智谋，万事挫折' },
  20: { type: '凶', name: '非业破运', meaning: '非业破运，灾难重重，进退维谷，万事难成' },
  21: { type: '大吉', name: '明月中天', meaning: '光风霁月，万物确立，官运亨通，大搏名利' },
  22: { type: '凶', name: '秋草逢霜', meaning: '秋草逢霜，困难疾弱，虽出豪杰，人生波折' },
  23: { type: '大吉', name: '壮丽', meaning: '旭日东升，壮丽壮观，权威旺盛，功名荣达' },
  24: { type: '大吉', name: '掘藏得金', meaning: '家门余庆，金钱丰盈，白手成家，财源广进' },
  25: { type: '吉', name: '荣俊', meaning: '资性英敏，才能奇特，涵养性情，可成大业' },
  26: { type: '半吉', name: '变怪', meaning: '变怪奇异，英雄豪杰，波澜重叠，而奏大功' },
  27: { type: '半吉', name: '增长', meaning: '欲望无止，自我强烈，多受毁谤，尚可成功' },
  28: { type: '凶', name: '阔水浮萍', meaning: '遭难之数，豪杰气概，四海漂泊，终世浮躁' },
  29: { type: '吉', name: '智谋', meaning: '智谋优秀，财力归集，名闻海内，成就大业' },
  30: { type: '半吉', name: '非运', meaning: '沉浮不定，凶吉难变，若明若暗，大成大败' },
  31: { type: '大吉', name: '春日花开', meaning: '智勇得志，博得名利，统领众人，繁荣富贵' },
  32: { type: '大吉', name: '宝马金鞍', meaning: '侥幸多望，贵人得助，财帛如裕，繁荣至上' },
  33: { type: '大吉', name: '旭日升天', meaning: '旭日升天，鸾凤相会，名闻天下，隆昌至极' },
  34: { type: '凶', name: '破家', meaning: '破家之身，见识短小，辛苦遭逢，灾祸至极' },
  35: { type: '吉', name: '高楼望月', meaning: '温和平静，智达通畅，文昌技艺，奏功洋洋' },
  36: { type: '半吉', name: '波澜重叠', meaning: '波澜重叠，沉浮万状，侠肝义胆，舍己成仁' },
  37: { type: '大吉', name: '猛虎出林', meaning: '权威显达，热诚忠信，宜着雅量，终身荣富' },
  38: { type: '半吉', name: '磨铁成针', meaning: '意志薄弱，刻意经营，才识不凡，技艺有成' },
  39: { type: '吉', name: '富贵荣华', meaning: '富贵荣华，财帛丰盈，暗藏险象，德泽四方' },
  40: { type: '半吉', name: '退安', meaning: '智谋胆力兼备，冒险投机，沉浮不定，退保平安' },
  41: { type: '大吉', name: '有德', meaning: '纯阳独秀，德高望重，和顺畅达，博得名利' },
  42: { type: '半吉', name: '寒蝉在柳', meaning: '博识多能，精通世情，如能专心，尚可成功' },
  43: { type: '半吉', name: '散财', meaning: '散财破产，诸事不遂，虽有智谋，财来财去' },
  44: { type: '凶', name: '烦闷', meaning: '破家亡身，暗藏惨淡，事不如意，乱世怪杰' },
  45: { type: '吉', name: '顺风', meaning: '新生泰和，顺风扬帆，智谋经纬，富贵繁荣' },
  46: { type: '半吉', name: '浪里淘金', meaning: '载宝沉舟，浪里淘金，大难尝尽，大功有成' },
  47: { type: '大吉', name: '点石成金', meaning: '花开之象，万事如意，祯祥吉庆，天赋幸福' },
  48: { type: '大吉', name: '古松立鹤', meaning: '智谋兼备，德量荣达，威望成师，洋洋大观' },
  49: { type: '半吉', name: '转变', meaning: '吉临则吉，凶来则凶，转凶为吉，配好三才' },
  50: { type: '半吉', name: '小舟入海', meaning: '一成一败，吉凶参半，先得庇荫，后遭凄惨' },
  51: { type: '半吉', name: '沉浮', meaning: '一盛一衰，浮沉不定，知难而退，自获天佑' },
  52: { type: '大吉', name: '达眼', meaning: '卓识达眼，先见之明，智谋超群，名利双收' },
  53: { type: '半吉', name: '曲卷', meaning: '外祥内患，外祸内安，先富后贫，先贫后富' },
  54: { type: '凶', name: '石上栽花', meaning: '石上栽花，难得有活，忧闷频来，一生凄苦' },
  55: { type: '半吉', name: '善恶', meaning: '善善得恶，恶恶得善，吉到极限，反生凶险' },
  56: { type: '凶', name: '浪里行舟', meaning: '历尽艰辛，四周障碍，万事龃龌，做事难成' },
  57: { type: '吉', name: '日照春松', meaning: '寒雪青松，夜莺吟春，必遭一过，繁荣百事' },
  58: { type: '半吉', name: '晚行遇月', meaning: '沉浮多端，先苦后甜，宽宏扬名，富贵繁荣' },
  59: { type: '凶', name: '寒蝉悲风', meaning: '寒蝉悲风，意志衰退，缺乏忍耐，苦难不休' },
  60: { type: '凶', name: '无谋', meaning: '无谋不算，瞻望前程，心猿意马，进退失据' },
  61: { type: '吉', name: '牡丹芙蓉', meaning: '牡丹芙蓉，花开富贵，名利双收，定享天赋' },
  62: { type: '凶', name: '衰败', meaning: '衰败之象，内外不和，志望难达，灾祸频来' },
  63: { type: '大吉', name: '舟归平浦', meaning: '富贵荣华，身心安泰，雨露惠泽，万事亨通' },
  64: { type: '凶', name: '非命', meaning: '骨肉分离，孤独悲愁，难得心安，做事不成' },
  65: { type: '大吉', name: '巨流归海', meaning: '天长地久，家运隆昌，福寿绵长，事事成就' },
  66: { type: '凶', name: '岩头步马', meaning: '进退失据，艰难不堪，等待时机，一跃而起' },
  67: { type: '大吉', name: '顺风通达', meaning: '天赋幸运，四通八达，家道繁昌，富贵东来' },
  68: { type: '大吉', name: '顺风吹帆', meaning: '智虑周密，集众信达，发明能智，拓展力行' },
  69: { type: '凶', name: '非业', meaning: '非业非力，志望难达，破灭无常，病患不绝' },
  70: { type: '凶', name: '残菊逢霜', meaning: '残菊逢霜，寂寞无踪，惨淡凄凉，晚景萧瑟' },
  71: { type: '半吉', name: '石上金花', meaning: '石上金花，内心劳苦，贯彻始终，定可昌隆' },
  72: { type: '半吉', name: '劳苦', meaning: '荣苦相伴，阴云蔽月，外表吉祥，内实凶祸' },
  73: { type: '吉', name: '无勇', meaning: '盛衰交加，徒有高志，天王福祉，终世平安' },
  74: { type: '凶', name: '残花经霜', meaning: '残花经霜，秋叶落寞，寂寞无靠，百事碌碌' },
  75: { type: '半吉', name: '退守', meaning: '退守保吉，发迹甚迟，虽有吉相，无谋不成' },
  76: { type: '凶', name: '离散', meaning: '倾覆离散，骨肉分离，内外不和，虽劳无功' },
  77: { type: '半吉', name: '半吉', meaning: '家庭有悦，半凶半吉，能获援护，失运难展' },
  78: { type: '半吉', name: '苦早', meaning: '祸福参半，先天凶相，勤勉行事，晚景尚可' },
  79: { type: '凶', name: '云头望月', meaning: '云头望月，心力交瘁，缺乏进取，难望成功' },
  80: { type: '半吉', name: '遁吉', meaning: '辛苦不绝，早入隐遁，安心立命，化凶转吉' },
  81: { type: '大吉', name: '万物回春', meaning: '最吉之数，还本归元，吉祥重叠，富贵尊荣' }
};

function getNumberInfo(num) {
  const n = num > 81 ? num % 80 : num;
  return wugeNumbers[n] || { type: '未知', name: '未知', meaning: '数理不详' };
}

function calculateWuge(surname, name) {
  const surnameChars = surname.split('');
  const nameChars = name.split('');
  
  const surnameStrokes = surnameChars.reduce((sum, c) => sum + getStrokes(c), 0);
  const nameStrokes = nameChars.map(c => getStrokes(c));
  
  const tianGe = surnameStrokes + 1;
  const renGe = surnameStrokes + nameStrokes[0];
  let diGe = 0;
  
  if (nameChars.length === 1) {
    diGe = nameStrokes[0] + 1;
  } else {
    diGe = nameStrokes.slice(0, 2).reduce((a, b) => a + b, 0);
  }
  
  const totalStrokes = surnameStrokes + nameStrokes.reduce((a, b) => a + b, 0);
  const zongGe = totalStrokes;
  
  const waiGe = zongGe - renGe + 1;
  
  const wuge = {
    tianGe: {
      position: '天格',
      strokes: tianGe,
      ...getNumberInfo(tianGe),
      description: '天格为姓氏之数，代表祖上、父母、长辈运，对个人命运影响较小'
    },
    renGe: {
      position: '人格',
      strokes: renGe,
      ...getNumberInfo(renGe),
      description: '人格为姓名之中心，代表主运、性格、事业，是五格中最重要的'
    },
    diGe: {
      position: '地格',
      strokes: diGe,
      ...getNumberInfo(diGe),
      description: '地格为名字之数，代表前运、基础运，影响36岁前的运势'
    },
    waiGe: {
      position: '外格',
      strokes: waiGe,
      ...getNumberInfo(waiGe),
      description: '外格为副运，代表外缘、人际关系、外界环境'
    },
    zongGe: {
      position: '总格',
      strokes: zongGe,
      ...getNumberInfo(zongGe),
      description: '总格为姓名总数，代表后运、晚年运，影响36岁后的运势'
    }
  };
  
  const sanCai = calculateSanCai(tianGe, renGe, diGe);
  const biange = checkBiange(surnameChars, nameChars);
  
  return {
    wuge,
    sanCai,
    biange,
    strokes: {
      surname: surnameStrokes,
      name: nameStrokes,
      total: totalStrokes
    }
  };
}

function wuxingFromNumber(num) {
  const mod = num % 10;
  if (mod === 1 || mod === 2) return '木';
  if (mod === 3 || mod === 4) return '火';
  if (mod === 5 || mod === 6) return '土';
  if (mod === 7 || mod === 8) return '金';
  return '水';
}

function calculateSanCai(tianGe, renGe, diGe) {
  const tianWx = wuxingFromNumber(tianGe);
  const renWx = wuxingFromNumber(renGe);
  const diWx = wuxingFromNumber(diGe);
  
  const shengkeMap = {
    '木': { sheng: '火', shengzhe: '水', ke: '土', kezha: '金' },
    '火': { sheng: '土', shengzhe: '木', ke: '金', kezha: '水' },
    '土': { sheng: '金', shengzhe: '火', ke: '水', kezha: '木' },
    '金': { sheng: '水', shengzhe: '土', ke: '木', kezha: '火' },
    '水': { sheng: '木', shengzhe: '金', ke: '火', kezha: '土' }
  };
  
  let type = '';
  let jixiong = '';
  let description = '';
  
  const tianRenRel = getShengKeRelation(tianWx, renWx);
  const renDiRel = getShengKeRelation(renWx, diWx);
  
  if (tianWx === renWx && renWx === diWx) {
    type = '三才比和';
    jixiong = '吉';
    description = '天地人三才五行相同，比和相助，运势平顺，基础稳固';
  } else if (tianRenRel === '相生' && renDiRel === '相生') {
    type = '三才相生';
    jixiong = '大吉';
    description = '天地人三才连续相生，运势亨通，事业顺利，贵人相助';
  } else if (tianRenRel === '相克' && renDiRel === '相克') {
    type = '三才相克';
    jixiong = '大凶';
    description = '天地人三才连续相克，运势坎坷，困难重重，需谨慎行事';
  } else if (tianRenRel === '相生') {
    type = '天人生地';
    jixiong = '吉';
    description = '天格生人格，事业有祖荫，易得长辈提携';
  } else if (renDiRel === '相生') {
    type = '人生地格';
    jixiong = '吉';
    description = '人格生地格，基础稳固，家庭和睦';
  } else if (tianRenRel === '相克') {
    type = '天克人格';
    jixiong = '凶';
    description = '天格克人格，易受长辈压制，事业多阻碍';
  } else if (renDiRel === '相克') {
    type = '人克地格';
    jixiong = '凶';
    description = '人格克地格，基础不稳，家庭不睦';
  } else {
    type = '三才平和';
    jixiong = '平';
    description = '三才配置平和，吉凶参半，需靠后天努力';
  }
  
  return {
    tianWx,
    renWx,
    diWx,
    type,
    jixiong,
    description
  };
}

function getShengKeRelation(wx1, wx2) {
  const shengke = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
  };
  const ke = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
  };
  
  if (shengke[wx1] === wx2) return '相生';
  if (ke[wx1] === wx2) return '相克';
  if (wx1 === wx2) return '比和';
  return '无关系';
}

function checkBiange(surnameChars, nameChars) {
  const fullName = [...surnameChars, ...nameChars].join('');
  
  const issues = [];
  
  if (surnameChars.length > 1) {
    const fuGe = surnameChars.reduce((sum, c) => sum + getStrokes(c), 0);
    issues.push({ type: '复姓', description: '复姓格局，天格计算需调整', level: 'normal' });
  }
  
  if (nameChars.length === 1) {
    issues.push({ type: '单名', description: '单名格局，地格为名字笔画+1', level: 'normal' });
  }
  
  if (nameChars.length > 2) {
    issues.push({ type: '多名', description: '名字超过两字，地格取前两字笔画之和', level: 'normal' });
  }
  
  const totalStrokes = [...surnameChars, ...nameChars].reduce((sum, c) => sum + getStrokes(c), 0);
  if (totalStrokes > 60) {
    issues.push({ type: '笔画过多', description: '姓名总笔画过多，书写不便', level: 'warning' });
  }
  
  if (nameChars.length >= 2 && nameChars[0] === nameChars[1]) {
    issues.push({ type: '叠字名', description: '名字为叠字，需注意特殊格局', level: 'normal' });
  }
  
  return {
    hasBiange: issues.length > 0,
    issues,
    description: issues.length > 0 ? '存在特殊格局，需综合考量' : '格局正常，无特殊变格'
  };
}

function calculateWugeScore(wugeResult) {
  const { wuge, sanCai } = wugeResult;
  
  let score = 0;
  
  const typeScores = {
    '大吉': 25,
    '吉': 20,
    '半吉': 15,
    '平': 10,
    '凶': 5,
    '大凶': 0
  };
  
  const positions = ['tianGe', 'renGe', 'diGe', 'waiGe', 'zongGe'];
  const weights = [0.15, 0.35, 0.2, 0.1, 0.2];
  
  positions.forEach((pos, i) => {
    const numScore = typeScores[wuge[pos].type] || 10;
    score += numScore * weights[i];
  });
  
  const sanCaiScores = {
    '大吉': 25,
    '吉': 20,
    '半吉': 15,
    '平': 10,
    '凶': 5,
    '大凶': 0
  };
  
  score += sanCaiScores[sanCai.jixiong] || 10;
  
  return Math.min(100, Math.round(score * 2));
}

module.exports = {
  wugeNumbers,
  getNumberInfo,
  calculateWuge,
  calculateSanCai,
  checkBiange,
  calculateWugeScore,
  wuxingFromNumber
};
