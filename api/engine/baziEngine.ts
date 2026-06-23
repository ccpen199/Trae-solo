import type { NamingInput, BaZiResult } from '../../shared/types.js';

type FiveElement = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const GAN_WUXING: Record<string, FiveElement> = {
  '甲': 'wood', '乙': 'wood',
  '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth',
  '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water'
};

const ZHI_WUXING: Record<string, FiveElement> = {
  '子': 'water', '丑': 'earth',
  '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire',
  '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal',
  '戌': 'earth', '亥': 'water'
};

const ZHI_CANG_GAN: Record<string, string[]> = {
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

const NA_YIN_TABLE: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金',
  '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木',
  '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金',
  '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水',
  '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金',
  '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水',
  '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火',
  '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水',
  '甲午': '砂石金', '乙未': '砂石金',
  '丙申': '山下火', '丁酉': '山下火',
  '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土',
  '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火',
  '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土',
  '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木',
  '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土',
  '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木',
  '壬戌': '大海水', '癸亥': '大海水'
};

const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0
];

const SOLAR_1_1 = [
  1887, 0xec04c, 0xec23f, 0xec435, 0xec649, 0xec83e, 0xeca51, 0xecc46, 0xece3a,
  0xed04d, 0xed242, 0xed436, 0xed64a, 0xed83f, 0xeda53, 0xedc48, 0xede3d, 0xee050,
  0xee244, 0xee439, 0xee64d, 0xee842, 0xeea36, 0xeec4a, 0xeee3e, 0xef052, 0xef246,
  0xef43a, 0xef64e, 0xef843, 0xefa37, 0xefc4b, 0xefe41, 0xf0054, 0xf0248, 0xf043c,
  0xf0650, 0xf0845, 0xf0a38, 0xf0c4d, 0xf0e42, 0xf1037, 0xf124a, 0xf143e, 0xf1651,
  0xf1846, 0xf1a3a, 0xf1c4e, 0xf1e44, 0xf2038, 0xf224b, 0xf243f, 0xf2653, 0xf2848,
  0xf2a3b, 0xf2c4f, 0xf2e45, 0xf3039, 0xf324d, 0xf3442, 0xf3636, 0xf384a, 0xf3a3d,
  0xf3c51, 0xf3e46, 0xf403b, 0xf424e, 0xf4443, 0xf4638, 0xf484c, 0xf4a3f, 0xf4c52,
  0xf4e48, 0xf503c, 0xf524f, 0xf5445, 0xf5639, 0xf584d, 0xf5a42, 0xf5c35, 0xf5e49,
  0xf603e, 0xf6251, 0xf6446, 0xf663b, 0xf684f, 0xf6a43, 0xf6c37, 0xf6e4b, 0xf703f,
  0xf7252, 0xf7447, 0xf764c, 0xf7841, 0xf7a44, 0xf7c48, 0xf7e3c, 0xf8050, 0xf8245,
  0xf8439, 0xf864d, 0xf8842, 0xf8a36, 0xf8c4a, 0xf8e3d, 0xf9051, 0xf9246, 0xf943a,
  0xf964e, 0xf9843, 0xf9a37, 0xf9c4b, 0xf9e41, 0xfa054, 0xfa248, 0xfa43c, 0xfa650,
  0xfa845, 0xfaa38, 0xfac4c, 0xfae42, 0xfb037, 0xfb24a, 0xfb43e, 0xfb652, 0xfb846,
  0xfba3a, 0xfbc4f, 0xfbe43, 0xfc038, 0xfc24b, 0xfc440, 0xfc654, 0xfc849, 0xfca3d,
  0xfcc51, 0xfce46, 0xfd03a, 0xfd24d, 0xfd442, 0xfd636, 0xfd84a, 0xfda3d, 0xfdc51,
  0xfde46, 0xfe03a, 0xfe24e, 0xfe443, 0xfe638, 0xfe84c, 0xfea3f, 0xfec52, 0xfee48,
  0xff03c, 0xff250, 0xff445, 0xff639, 0xff84d, 0xffa42, 0xffc35, 0xffe49, 0x10003d
];

function solarToLunar(solarDate: Date): { year: number; month: number; day: number; isLeap: boolean } {
  const baseDate = new Date(1900, 0, 31);
  let offset = Math.floor((solarDate.getTime() - baseDate.getTime()) / 86400000);

  let year = 1900;
  let daysInYear = 0;
  while (year < 2100 && offset > 0) {
    daysInYear = getLunarYearDays(year);
    if (offset < daysInYear) break;
    offset -= daysInYear;
    year++;
  }

  const leapMonth = getLunarLeapMonth(year);
  let isLeap = false;
  let month = 1;
  let daysInMonth = 0;

  while (month < 13 && offset >= 0) {
    if (leapMonth > 0 && month === leapMonth + 1 && !isLeap) {
      --month;
      isLeap = true;
      daysInMonth = getLunarLeapDays(year);
    } else {
      daysInMonth = getLunarMonthDays(year, month);
    }

    if (isLeap && month === leapMonth + 1) isLeap = false;
    if (offset < daysInMonth) break;
    offset -= daysInMonth;
    month++;
  }

  const day = offset + 1;
  return { year, month, day, isLeap };
}

function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean): Date {
  const baseDate = new Date(1900, 0, 31);
  let offset = 0;

  for (let y = 1900; y < lunarYear; y++) {
    offset += getLunarYearDays(y);
  }

  const leapMonth = getLunarLeapMonth(lunarYear);
  for (let m = 1; m < lunarMonth; m++) {
    if (leapMonth > 0 && m === leapMonth + 1) {
      offset += getLunarLeapDays(lunarYear);
    }
    offset += getLunarMonthDays(lunarYear, m);
  }

  if (isLeap && leapMonth === lunarMonth) {
    offset += getLunarMonthDays(lunarYear, lunarMonth);
  }

  offset += lunarDay - 1;
  const solarDate = new Date(baseDate.getTime() + offset * 86400000);
  return solarDate;
}

function getLunarYearDays(year: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & i) ? 1 : 0;
  }
  return sum + getLunarLeapDays(year);
}

function getLunarLeapMonth(year: number): number {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function getLunarLeapDays(year: number): number {
  if (getLunarLeapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function getLunarMonthDays(year: number, month: number): number {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

function trueSolarTime(localTime: Date, longitude: number): Date {
  const standardMeridian = Math.round(longitude / 15) * 15;
  const timeDiffMinutes = (longitude - standardMeridian) * 4;
  const dayOfYear = getDayOfYear(localTime);
  const equationOfTime = getEquationOfTime(dayOfYear);
  const totalDiff = timeDiffMinutes + equationOfTime;
  return new Date(localTime.getTime() + totalDiff * 60000);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function getEquationOfTime(day: number): number {
  const b = (2 * Math.PI * (day - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function getYearGanZhi(solarDate: Date): string {
  const year = solarDate.getFullYear();
  const springFestival = getSpringFestivalDate(year);
  let ganZhiYear = year;
  if (solarDate < springFestival) {
    ganZhiYear = year - 1;
  }
  const ganIndex = (ganZhiYear - 4) % 10;
  const zhiIndex = (ganZhiYear - 4) % 12;
  return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex];
}

function getSpringFestivalDate(year: number): Date {
  const data = SOLAR_1_1[year - SOLAR_1_1[0]];
  const month = Math.floor(data / 0x100);
  const day = data % 0x100;
  return new Date(year, month - 1, day);
}

function getMonthGanZhi(solarDate: Date): string {
  const yearGanZhi = getYearGanZhi(solarDate);
  const yearGan = yearGanZhi[0];
  const yearGanIndex = TIAN_GAN.indexOf(yearGan);
  
  const monthNode = getMonthNode(solarDate);
  
  const zhiStartIndex = 2;
  const monthZhiIndex = (zhiStartIndex + monthNode - 1) % 12;
  const monthZhi = DI_ZHI[monthZhiIndex];
  
  const ganStartTable = [0, 2, 4, 6, 8];
  const monthGanStart = ganStartTable[yearGanIndex % 5];
  const monthGanIndex = (monthGanStart + monthNode - 1) % 10;
  const monthGan = TIAN_GAN[monthGanIndex];
  
  return monthGan + monthZhi;
}

function getMonthNode(date: Date): number {
  const nodeDays = [
    { m: 1, d: 6 }, { m: 2, d: 4 }, { m: 3, d: 6 }, { m: 4, d: 5 },
    { m: 5, d: 6 }, { m: 6, d: 6 }, { m: 7, d: 7 }, { m: 8, d: 8 },
    { m: 9, d: 8 }, { m: 10, d: 8 }, { m: 11, d: 7 }, { m: 12, d: 7 }
  ];
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let nodeMonth = month - 1;
  if (day >= nodeDays[month - 1].d) {
    nodeMonth = month;
  }
  if (nodeMonth === 0) nodeMonth = 12;
  
  return nodeMonth;
}

function getDayGanZhi(solarDate: Date): string {
  const baseDate = new Date(1900, 0, 1);
  const daysDiff = Math.floor((solarDate.getTime() - baseDate.getTime()) / 86400000);
  const ganIndex = (daysDiff + 9) % 10;
  const zhiIndex = (daysDiff + 1) % 12;
  return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex];
}

function getHourGanZhi(solarDate: Date, dayGanZhi: string): string {
  const hour = solarDate.getHours();
  const minutes = solarDate.getMinutes();
  const totalMinutes = hour * 60 + minutes;
  
  let hourZhiIndex: number;
  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) {
    hourZhiIndex = 0;
  } else {
    hourZhiIndex = Math.floor((totalMinutes + 60) / 120);
  }
  const hourZhi = DI_ZHI[hourZhiIndex];
  
  const dayGan = dayGanZhi[0];
  const dayGanIndex = TIAN_GAN.indexOf(dayGan);
  const ganStartTable = [0, 2, 4, 6, 8];
  const hourGanStart = ganStartTable[dayGanIndex % 5];
  const hourGanIndex = (hourGanStart + hourZhiIndex) % 10;
  const hourGan = TIAN_GAN[hourGanIndex];
  
  return hourGan + hourZhi;
}

function getNaYin(ganZhi: string): string {
  return NA_YIN_TABLE[ganZhi] || '未知';
}

type FiveElementsScore = { metal: number; wood: number; water: number; fire: number; earth: number };

function calculateFiveElementsScore(
  yearGanZhi: string,
  monthGanZhi: string,
  dayGanZhi: string,
  hourGanZhi: string
): FiveElementsScore {
  const scores: FiveElementsScore = {
    metal: 0, wood: 0, water: 0, fire: 0, earth: 0
  };
  
  const pillars = [yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi];
  const weights = {
    tiangan: { main: 1.0, hidden: 0 },
    dizhiMain: 0.7,
    dizhiHidden: [0.5, 0.3, 0.2]
  };
  
  for (let i = 0; i < pillars.length; i++) {
    const pillar = pillars[i];
    const gan = pillar[0];
    const zhi = pillar[1];
    
    const ganWuxing = GAN_WUXING[gan];
    scores[ganWuxing] += weights.tiangan.main;
    
    const zhiWuxing = ZHI_WUXING[zhi];
    scores[zhiWuxing] += weights.dizhiMain;
    
    const hiddenGan = ZHI_CANG_GAN[zhi] || [];
    for (let j = 0; j < hiddenGan.length; j++) {
      const hg = hiddenGan[j];
      const hgWuxing = GAN_WUXING[hg];
      scores[hgWuxing] += weights.dizhiHidden[j] || 0;
    }
  }
  
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(scores) as FiveElement[]) {
    scores[key] = Math.round((scores[key] / total) * 100 * 10) / 10;
  }
  
  return scores;
}

function getDayMasterStrength(
  dayMaster: string,
  scores: Record<FiveElement, number>
): 'strong' | 'weak' | 'balanced' {
  const dayMasterElement = GAN_WUXING[dayMaster];
  
  const shengKe: Record<FiveElement, { sheng: FiveElement; ke: FiveElement; beiSheng: FiveElement; beiKe: FiveElement }> = {
    wood: { sheng: 'water', ke: 'earth', beiSheng: 'fire', beiKe: 'metal' },
    fire: { sheng: 'wood', ke: 'metal', beiSheng: 'earth', beiKe: 'water' },
    earth: { sheng: 'fire', ke: 'water', beiSheng: 'metal', beiKe: 'wood' },
    metal: { sheng: 'earth', ke: 'wood', beiSheng: 'water', beiKe: 'fire' },
    water: { sheng: 'metal', ke: 'fire', beiSheng: 'wood', beiKe: 'earth' }
  };
  
  const relation = shengKe[dayMasterElement];
  const selfScore = scores[dayMasterElement];
  const helpScore = scores[relation.sheng];
  const consumeScore = scores[relation.ke] + scores[relation.beiSheng];
  
  const totalPower = selfScore * 1.2 + helpScore * 0.8;
  const consumePower = consumeScore;
  
  if (totalPower / consumePower > 1.3) return 'strong';
  if (totalPower / consumePower < 0.8) return 'weak';
  return 'balanced';
}

function getFavorableAndAvoidElements(
  dayMasterElement: FiveElement,
  strength: 'strong' | 'weak' | 'balanced'
): { favorable: FiveElement[]; avoid: FiveElement[] } {
  const shengKe: Record<FiveElement, { sheng: FiveElement; ke: FiveElement; beiSheng: FiveElement; beiKe: FiveElement }> = {
    wood: { sheng: 'water', ke: 'earth', beiSheng: 'fire', beiKe: 'metal' },
    fire: { sheng: 'wood', ke: 'metal', beiSheng: 'earth', beiKe: 'water' },
    earth: { sheng: 'fire', ke: 'water', beiSheng: 'metal', beiKe: 'wood' },
    metal: { sheng: 'earth', ke: 'wood', beiSheng: 'water', beiKe: 'fire' },
    water: { sheng: 'metal', ke: 'fire', beiSheng: 'wood', beiKe: 'earth' }
  };
  
  const relation = shengKe[dayMasterElement];
  let favorable: FiveElement[];
  let avoid: FiveElement[];
  
  if (strength === 'strong') {
    favorable = [relation.ke, relation.beiSheng];
    avoid = [dayMasterElement, relation.sheng];
  } else if (strength === 'weak') {
    favorable = [dayMasterElement, relation.sheng];
    avoid = [relation.ke, relation.beiSheng];
  } else {
    favorable = [relation.beiSheng, relation.ke];
    avoid = [];
  }
  
  return { favorable, avoid };
}

export function analyzeBaZi(input: NamingInput): BaZiResult {
  let solarDate: Date;
  const birthDate = new Date(input.birthDateTime);
  
  if (input.isLunarCalendar) {
    const lunar = solarToLunar(birthDate);
    solarDate = lunarToSolar(lunar.year, lunar.month, lunar.day, lunar.isLeap);
    solarDate.setHours(birthDate.getHours(), birthDate.getMinutes());
  } else {
    solarDate = new Date(birthDate);
  }
  
  const adjustedTime = trueSolarTime(solarDate, input.birthPlace.longitude);
  
  const yearGanZhi = getYearGanZhi(adjustedTime);
  const monthGanZhi = getMonthGanZhi(adjustedTime);
  const dayGanZhi = getDayGanZhi(adjustedTime);
  const hourGanZhi = getHourGanZhi(adjustedTime, dayGanZhi);
  
  const fiveElementsScore = calculateFiveElementsScore(
    yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi
  );
  
  const dayMaster = dayGanZhi[0];
  const dayMasterStrength = getDayMasterStrength(dayMaster, fiveElementsScore);
  const dayMasterElement = GAN_WUXING[dayMaster];
  const { favorable, avoid } = getFavorableAndAvoidElements(dayMasterElement, dayMasterStrength);
  
  const elementNames: Record<FiveElement, string> = {
    metal: '金', wood: '木', water: '水', fire: '火', earth: '土'
  };
  
  return {
    yearGanZhi,
    monthGanZhi,
    dayGanZhi,
    hourGanZhi,
    yearNaYin: getNaYin(yearGanZhi),
    monthNaYin: getNaYin(monthGanZhi),
    dayNaYin: getNaYin(dayGanZhi),
    hourNaYin: getNaYin(hourGanZhi),
    fiveElementsScore,
    dayMaster,
    dayMasterStrength,
    favorableElements: favorable.map(e => elementNames[e]),
    avoidElements: avoid.map(e => elementNames[e]),
    trueSolarTime: adjustedTime.toISOString()
  };
}
