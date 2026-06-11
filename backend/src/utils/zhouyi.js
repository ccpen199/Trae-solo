const bagua = [
  { name: '乾', symbol: '☰', wuxing: '金', nature: '天', direction: '西北', meaning: '刚健、创始、领导' },
  { name: '兑', symbol: '☱', wuxing: '金', nature: '泽', direction: '西', meaning: '喜悦、沟通、收获' },
  { name: '离', symbol: '☲', wuxing: '火', nature: '火', direction: '南', meaning: '光明、文明、依附' },
  { name: '震', symbol: '☳', wuxing: '木', nature: '雷', direction: '东', meaning: '震动、奋起、行动' },
  { name: '巽', symbol: '☴', wuxing: '木', nature: '风', direction: '东南', meaning: '谦逊、进入、顺利' },
  { name: '坎', symbol: '☵', wuxing: '水', nature: '水', direction: '北', meaning: '危险、陷难、智慧' },
  { name: '艮', symbol: '☶', wuxing: '土', nature: '山', direction: '东北', meaning: '静止、阻止、笃实' },
  { name: '坤', symbol: '☷', wuxing: '土', nature: '地', direction: '西南', meaning: '柔顺、承载、生长' }
];

const liushisiGua = [
  { name: '乾为天', shang: '乾', xia: '乾', guaCi: '元亨利贞', guaXu: 1, jixiong: '大吉' },
  { name: '坤为地', shang: '坤', xia: '坤', guaCi: '元亨，利牝马之贞', guaXu: 2, jixiong: '吉' },
  { name: '水雷屯', shang: '坎', xia: '震', guaCi: '元亨利贞，勿用有攸往', guaXu: 3, jixiong: '平' },
  { name: '山水蒙', shang: '艮', xia: '坎', guaCi: '亨。匪我求童蒙，童蒙求我', guaXu: 4, jixiong: '平' },
  { name: '水天需', shang: '坎', xia: '乾', guaCi: '有孚，光亨，贞吉', guaXu: 5, jixiong: '吉' },
  { name: '天水讼', shang: '乾', xia: '坎', guaCi: '有孚，窒惕，中吉，终凶', guaXu: 6, jixiong: '凶' },
  { name: '地水师', shang: '坤', xia: '坎', guaCi: '贞，丈人吉，无咎', guaXu: 7, jixiong: '吉' },
  { name: '水地比', shang: '坎', xia: '坤', guaCi: '吉。原筮元永贞，无咎', guaXu: 8, jixiong: '吉' },
  { name: '风天小畜', shang: '巽', xia: '乾', guaCi: '亨。密云不雨，自我西郊', guaXu: 9, jixiong: '平' },
  { name: '天泽履', shang: '乾', xia: '兑', guaCi: '履虎尾，不咥人，亨', guaXu: 10, jixiong: '吉' },
  { name: '地天泰', shang: '坤', xia: '乾', guaCi: '小往大来，吉亨', guaXu: 11, jixiong: '大吉' },
  { name: '天地否', shang: '乾', xia: '坤', guaCi: '否之匪人，不利君子贞', guaXu: 12, jixiong: '凶' },
  { name: '天火同人', shang: '乾', xia: '离', guaCi: '同人于野，亨', guaXu: 13, jixiong: '吉' },
  { name: '火天大有', shang: '离', xia: '乾', guaCi: '元亨', guaXu: 14, jixiong: '大吉' },
  { name: '地山谦', shang: '坤', xia: '艮', guaCi: '亨，君子有终', guaXu: 15, jixiong: '吉' },
  { name: '雷地豫', shang: '震', xia: '坤', guaCi: '利建侯行师', guaXu: 16, jixiong: '吉' },
  { name: '泽雷随', shang: '兑', xia: '震', guaCi: '元亨利贞，无咎', guaXu: 17, jixiong: '吉' },
  { name: '山风蛊', shang: '艮', xia: '巽', guaCi: '元亨，利涉大川', guaXu: 18, jixiong: '平' },
  { name: '地泽临', shang: '坤', xia: '兑', guaCi: '元亨利贞，至于八月有凶', guaXu: 19, jixiong: '吉' },
  { name: '风地观', shang: '巽', xia: '坤', guaCi: '盥而不荐，有孚颙若', guaXu: 20, jixiong: '平' },
  { name: '火雷噬嗑', shang: '离', xia: '震', guaCi: '亨，利用狱', guaXu: 21, jixiong: '吉' },
  { name: '山火贲', shang: '艮', xia: '离', guaCi: '亨，小利有攸往', guaXu: 22, jixiong: '吉' },
  { name: '山地剥', shang: '艮', xia: '坤', guaCi: '不利有攸往', guaXu: 23, jixiong: '凶' },
  { name: '地雷复', shang: '坤', xia: '震', guaCi: '亨。出入无疾，朋来无咎', guaXu: 24, jixiong: '吉' },
  { name: '天雷无妄', shang: '乾', xia: '震', guaCi: '元亨利贞，其匪正有眚', guaXu: 25, jixiong: '平' },
  { name: '山天大畜', shang: '艮', xia: '乾', guaCi: '利贞，不家食吉', guaXu: 26, jixiong: '吉' },
  { name: '山雷颐', shang: '艮', xia: '震', guaCi: '贞吉，观颐，自求口实', guaXu: 27, jixiong: '吉' },
  { name: '泽风大过', shang: '兑', xia: '巽', guaCi: '栋桡，利有攸往', guaXu: 28, jixiong: '平' },
  { name: '坎为水', shang: '坎', xia: '坎', guaCi: '习坎，有孚维心亨', guaXu: 29, jixiong: '凶' },
  { name: '离为火', shang: '离', xia: '离', guaCi: '利贞，亨', guaXu: 30, jixiong: '吉' },
  { name: '泽山咸', shang: '兑', xia: '艮', guaCi: '亨，利贞，取女吉', guaXu: 31, jixiong: '吉' },
  { name: '雷风恒', shang: '震', xia: '巽', guaCi: '亨，无咎，利贞', guaXu: 32, jixiong: '吉' },
  { name: '天山遁', shang: '乾', xia: '艮', guaCi: '亨，小利贞', guaXu: 33, jixiong: '平' },
  { name: '雷天大壮', shang: '震', xia: '乾', guaCi: '利贞', guaXu: 34, jixiong: '吉' },
  { name: '火地晋', shang: '离', xia: '坤', guaCi: '康侯用锡马蕃庶', guaXu: 35, jixiong: '吉' },
  { name: '地火明夷', shang: '坤', xia: '离', guaCi: '利艰贞', guaXu: 36, jixiong: '凶' },
  { name: '风火家人', shang: '巽', xia: '离', guaCi: '利女贞', guaXu: 37, jixiong: '吉' },
  { name: '火泽睽', shang: '离', xia: '兑', guaCi: '小事吉', guaXu: 38, jixiong: '平' },
  { name: '山水蹇', shang: '艮', xia: '坎', guaCi: '利西南，不利东北', guaXu: 39, jixiong: '平' },
  { name: '雷水解', shang: '震', xia: '坎', guaCi: '利西南，无所往', guaXu: 40, jixiong: '吉' },
  { name: '山泽损', shang: '艮', xia: '兑', guaCi: '有孚，元吉，无咎', guaXu: 41, jixiong: '平' },
  { name: '风雷益', shang: '巽', xia: '震', guaCi: '利有攸往，利涉大川', guaXu: 42, jixiong: '吉' },
  { name: '泽天夬', shang: '兑', xia: '乾', guaCi: '扬于王庭，孚号有厉', guaXu: 43, jixiong: '平' },
  { name: '天风姤', shang: '乾', xia: '巽', guaCi: '女壮，勿用取女', guaXu: 44, jixiong: '平' },
  { name: '泽地萃', shang: '兑', xia: '坤', guaCi: '亨，王假有庙', guaXu: 45, jixiong: '吉' },
  { name: '地风升', shang: '坤', xia: '巽', guaCi: '元亨，用见大人', guaXu: 46, jixiong: '吉' },
  { name: '泽水困', shang: '兑', xia: '坎', guaCi: '亨，贞，大人吉', guaXu: 47, jixiong: '平' },
  { name: '水风井', shang: '坎', xia: '巽', guaCi: '改邑不改井，无丧无得', guaXu: 48, jixiong: '平' },
  { name: '泽火革', shang: '兑', xia: '离', guaCi: '巳日乃孚，元亨利贞', guaXu: 49, jixiong: '吉' },
  { name: '火风鼎', shang: '离', xia: '巽', guaCi: '元吉，亨', guaXu: 50, jixiong: '大吉' },
  { name: '震为雷', shang: '震', xia: '震', guaCi: '亨，震来虩虩', guaXu: 51, jixiong: '平' },
  { name: '艮为山', shang: '艮', xia: '艮', guaCi: '艮其背，不获其身', guaXu: 52, jixiong: '平' },
  { name: '风山渐', shang: '巽', xia: '艮', guaCi: '女归吉，利贞', guaXu: 53, jixiong: '吉' },
  { name: '雷泽归妹', shang: '震', xia: '兑', guaCi: '征凶，无攸利', guaXu: 54, jixiong: '凶' },
  { name: '雷火丰', shang: '震', xia: '离', guaCi: '亨，王假之，勿忧', guaXu: 55, jixiong: '吉' },
  { name: '火山旅', shang: '离', xia: '艮', guaCi: '小亨，旅贞吉', guaXu: 56, jixiong: '平' },
  { name: '巽为风', shang: '巽', xia: '巽', guaCi: '小亨，利有攸往', guaXu: 57, jixiong: '吉' },
  { name: '兑为泽', shang: '兑', xia: '兑', guaCi: '亨，利贞', guaXu: 58, jixiong: '吉' },
  { name: '风水涣', shang: '巽', xia: '坎', guaCi: '亨，王假有庙', guaXu: 59, jixiong: '平' },
  { name: '水泽节', shang: '坎', xia: '兑', guaCi: '亨，苦节不可贞', guaXu: 60, jixiong: '吉' },
  { name: '风泽中孚', shang: '巽', xia: '兑', guaCi: '豚鱼吉，利涉大川', guaXu: 61, jixiong: '吉' },
  { name: '雷山小过', shang: '震', xia: '艮', guaCi: '亨，利贞，可小事', guaXu: 62, jixiong: '平' },
  { name: '水火既济', shang: '坎', xia: '离', guaCi: '亨小，利贞，初吉终乱', guaXu: 63, jixiong: '吉' },
  { name: '火水未济', shang: '离', xia: '坎', guaCi: '亨，小狐汔济，濡其尾', guaXu: 64, jixiong: '平' }
];

function getBaguaByName(name) {
  return bagua.find(g => g.name === name);
}

function getGuaByName(name) {
  return liushisiGua.find(g => g.name === name);
}

function strokesToGua(strokes) {
  let s = strokes;
  if (s <= 0) s = 1;
  const index = (s - 1) % 8;
  return bagua[index];
}

function generateGuaByStrokes(surnameStrokes, nameStrokes) {
  const shangGua = strokesToGua(surnameStrokes > 0 ? surnameStrokes : 7);
  const xiaGua = strokesToGua(nameStrokes > 0 ? nameStrokes : 11);
  
  const benGuaName = `${shangGua.name}${xiaGua.name === shangGua.name ? '为' : ''}${xiaGua.nature}`;
  let benGua = liushisiGua.find(g => g.shang === shangGua.name && g.xia === xiaGua.name);
  
  if (!benGua) {
    benGua = {
      name: `${shangGua.name}${xiaGua.name}`,
      shang: shangGua.name,
      xia: xiaGua.name,
      guaCi: '卦象待考',
      guaXu: 0,
      jixiong: '平'
    };
  }
  
  const yaoCount = (surnameStrokes + nameStrokes) % 6;
  const dongYao = yaoCount === 0 ? 6 : yaoCount;
  
  const yaoCis = generateYaoCis(benGua, dongYao);
  
  const zhiGua = generateZhiGua(benGua, dongYao);
  
  return {
    benGua: {
      ...benGua,
      shangGua,
      xiaGua,
      symbol: shangGua.symbol + xiaGua.symbol
    },
    dongYao,
    yaoCis,
    zhiGua: {
      ...zhiGua,
      symbol: zhiGua.shangGua.symbol + zhiGua.xiaGua.symbol
    },
    jieshi: generateGuaJieshi(benGua, zhiGua, dongYao)
  };
}

function generateYaoCis(gua, dongYao) {
  const yaoNames = ['初六', '九二', '六三', '六四', '六五', '上六'];
  const yangYaoNames = ['初九', '九二', '九三', '九四', '九五', '上九'];
  
  const yaos = [];
  const xiaGua = getBaguaByName(gua.xia);
  const shangGua = getBaguaByName(gua.shang);
  
  if (xiaGua && shangGua) {
    const xiaYaos = getYaoLines(xiaGua.name, '下');
    const shangYaos = getYaoLines(shangGua.name, '上');
    yaos.push(...xiaYaos.reverse(), ...shangYaos.reverse());
  }
  
  return yaos.map((yao, idx) => ({
    position: idx + 1,
    name: yao.yinYang === '阳' ? yangYaoNames[idx] : yaoNames[idx],
    yinYang: yao.yinYang,
    yaoCi: getYaoCi(gua.name, idx + 1),
    isDong: idx + 1 === dongYao
  }));
}

function getYaoLines(guaName, position) {
  const yaos = {
    '乾': [
      { yinYang: '阳', position: '初' },
      { yinYang: '阳', position: '二' },
      { yinYang: '阳', position: '三' }
    ],
    '兑': [
      { yinYang: '阴', position: '初' },
      { yinYang: '阳', position: '二' },
      { yinYang: '阳', position: '三' }
    ],
    '离': [
      { yinYang: '阳', position: '初' },
      { yinYang: '阴', position: '二' },
      { yinYang: '阳', position: '三' }
    ],
    '震': [
      { yinYang: '阳', position: '初' },
      { yinYang: '阴', position: '二' },
      { yinYang: '阴', position: '三' }
    ],
    '巽': [
      { yinYang: '阴', position: '初' },
      { yinYang: '阳', position: '二' },
      { yinYang: '阳', position: '三' }
    ],
    '坎': [
      { yinYang: '阴', position: '初' },
      { yinYang: '阳', position: '二' },
      { yinYang: '阴', position: '三' }
    ],
    '艮': [
      { yinYang: '阴', position: '初' },
      { yinYang: '阴', position: '二' },
      { yinYang: '阳', position: '三' }
    ],
    '坤': [
      { yinYang: '阴', position: '初' },
      { yinYang: '阴', position: '二' },
      { yinYang: '阴', position: '三' }
    ]
  };
  
  return yaos[guaName] || [];
}

function getYaoCi(guaName, yaoPosition) {
  const yaoCis = {
    '乾为天': ['潜龙勿用', '见龙在田，利见大人', '君子终日乾乾', '或跃在渊，无咎', '飞龙在天，利见大人', '亢龙有悔'],
    '坤为地': ['履霜，坚冰至', '直方大，不习无不利', '含章可贞', '括囊，无咎无誉', '黄裳，元吉', '龙战于野，其血玄黄'],
    '水雷屯': ['磐桓，利居贞', '屯如邅如，乘马班如', '即鹿无虞，惟入于林中', '乘马班如，求婚媾往', '屯其膏，小贞吉', '乘马班如，泣血涟如'],
    '山水蒙': ['发蒙，利用刑人', '包蒙吉，纳妇吉', '勿用取女，见金夫', '困蒙，吝', '童蒙，吉', '击蒙，不利为寇']
  };
  
  if (yaoCis[guaName]) {
    return yaoCis[guaName][yaoPosition - 1] || '爻辞待考';
  }
  
  const defaultCis = {
    1: '初爻：事物之始，宜审慎起步',
    2: '二爻：得中得位，宜积极进取',
    3: '三爻：多凶多惧，宜谨慎行事',
    4: '四爻：多惧多惧，宜审时度势',
    5: '五爻：得尊得位，宜大展宏图',
    6: '上爻：事物之终，宜知进退'
  };
  
  return defaultCis[yaoPosition] || '爻辞待考';
}

function generateZhiGua(benGua, dongYao) {
  const xiaGua = getBaguaByName(benGua.xia);
  const shangGua = getBaguaByName(benGua.shang);
  
  let xiaYaos = getYaoLines(benGua.xia, '下').map(y => y.yinYang);
  let shangYaos = getYaoLines(benGua.shang, '上').map(y => y.yinYang);
  
  const allYaos = [...xiaYaos.reverse(), ...shangYaos.reverse()];
  
  allYaos[dongYao - 1] = allYaos[dongYao - 1] === '阳' ? '阴' : '阳';
  
  const newXiaYaos = allYaos.slice(0, 3).reverse();
  const newShangYaos = allYaos.slice(3, 6).reverse();
  
  const newXiaGuaName = yaosToGuaName(newXiaYaos);
  const newShangGuaName = yaosToGuaName(newShangYaos);
  
  const newXiaGua = getBaguaByName(newXiaGuaName);
  const newShangGua = getBaguaByName(newShangGuaName);
  
  let zhiGua = liushisiGua.find(g => g.shang === newShangGuaName && g.xia === newXiaGuaName);
  
  if (!zhiGua) {
    zhiGua = {
      name: `${newShangGuaName}${newXiaGuaName}`,
      shang: newShangGuaName,
      xia: newXiaGuaName,
      guaCi: '之卦待考',
      guaXu: 0,
      jixiong: '平'
    };
  }
  
  return {
    ...zhiGua,
    shangGua: newShangGua,
    xiaGua: newXiaGua
  };
}

function yaosToGuaName(yaos) {
  const guaMap = {
    '阳阳阳': '乾',
    '阴阳阳': '兑',
    '阳阴阳': '离',
    '阳阴阴': '震',
    '阴阳阳': '巽',
    '阴阳阴': '坎',
    '阴阴阳': '艮',
    '阴阴阴': '坤'
  };
  
  const key = yaos.join('');
  return guaMap[key] || '乾';
}

function generateGuaJieshi(benGua, zhiGua, dongYao) {
  const jixiongMap = {
    '大吉': '运势极佳，诸事顺遂，可大胆进取',
    '吉': '运势良好，贵人相助，宜积极行动',
    '平': '运势平稳，吉凶参半，宜稳中求进',
    '凶': '运势欠佳，困难较多，宜谨慎行事',
    '大凶': '运势极差，诸事不顺，宜静守待时'
  };
  
  const dongYaoJieshi = {
    1: '初爻发动，预示事物正在起步阶段，需打好基础',
    2: '二爻发动，预示事业处于上升期，可得贵人相助',
    3: '三爻发动，预示面临转折，需谨慎行事避免失误',
    4: '四爻发动，预示进入新阶段，需审时度势把握机遇',
    5: '五爻发动，预示达到鼎盛时期，宜大展宏图',
    6: '上爻发动，预示事物发展到极点，需知进退'
  };
  
  return {
    benGuaJieshi: jixiongMap[benGua.jixiong] || '运势平平',
    dongYaoJieshi: dongYaoJieshi[dongYao] || '',
    zhiGuaJieshi: jixiongMap[zhiGua.jixiong] || '未来运势待观察',
    zongJie: `本卦为${benGua.name}，${benGua.guaCi}；动爻在第${dongYao}爻，变为${zhiGua.name}。${benGua.jixiong === '大吉' || benGua.jixiong === '吉' ? '此名卦象吉利' : '此名卦象平常'}，寓意${benGua.jixiong === '大吉' ? '前程似锦，大有作为' : benGua.jixiong === '吉' ? '运势顺畅，稳步发展' : '需后天努力，方能有成'}。`
  };
}

function generateNameGua(surname, name) {
  const { getStrokes } = require('../data/characters');
  
  const surnameStrokes = surname.split('').reduce((sum, c) => sum + getStrokes(c), 0);
  const nameStrokes = name.split('').reduce((sum, c) => sum + getStrokes(c), 0);
  
  return generateGuaByStrokes(surnameStrokes, nameStrokes);
}

module.exports = {
  bagua,
  liushisiGua,
  getBaguaByName,
  getGuaByName,
  generateGuaByStrokes,
  generateNameGua
};
