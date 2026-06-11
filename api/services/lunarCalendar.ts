import { LunarCalendar, Anniversary } from '../../shared/types'
import { anniversaryDB } from '../db/index'

const lunarInfo = [
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
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
]

const lunarMonthNames = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const lunarDayNames = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]
const ganNames = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const zhiNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

const solarTerms = [
  { name: '小寒', month: 1, day: 6 },
  { name: '大寒', month: 1, day: 20 },
  { name: '立春', month: 2, day: 4 },
  { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 6 },
  { name: '春分', month: 3, day: 21 },
  { name: '清明', month: 4, day: 5 },
  { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 6 },
  { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 6 },
  { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 },
  { name: '大暑', month: 7, day: 23 },
  { name: '立秋', month: 8, day: 8 },
  { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 8 },
  { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 },
  { name: '霜降', month: 10, day: 24 },
  { name: '立冬', month: 11, day: 7 },
  { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 22 }
]

const yiBase = ['祭祀', '祈福', '求嗣', '开光', '塑绘', '斋醮', '订盟', '纳采', '嫁娶', '动土', '出行', '安床', '破土', '安葬', '修造', '开市', '交易', '立券', '纳财', '开仓']
const jiBase = ['诸事不宜', '动土', '破土', '嫁娶', '入宅', '安葬', '开市', '出行', '纳财', '开光', '祭祀', '祈福', '求嗣', '订盟', '纳采', '修造', '栽种', '伐木']

function getLeapMonth(year: number): number {
  return lunarInfo[year - 1900] & 0xf
}

function getLunarMonthDays(year: number, month: number): number {
  return (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29
}

function getLunarYearDays(year: number): number {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[year - 1900] & i) ? 1 : 0
  }
  return sum + getLeapDays(year)
}

function getLeapDays(year: number): number {
  if (getLeapMonth(year)) {
    return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

interface LunarDate {
  year: number
  month: number
  day: number
  isLeap: boolean
}

function solarToLunar(date: Date): LunarDate {
  const baseDate = new Date(1900, 0, 31)
  let offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000)

  let year = 1900
  let daysInYear = 0
  while (year < 2100 && offset > 0) {
    daysInYear = getLunarYearDays(year)
    if (offset < daysInYear) break
    offset -= daysInYear
    year++
  }

  const leapMonth = getLeapMonth(year)
  let isLeap = false
  let month = 1

  while (month < 13 && offset > 0) {
    let daysInMonth: number
    if (leapMonth > 0 && month === leapMonth + 1 && !isLeap) {
      month--
      isLeap = true
      daysInMonth = getLeapDays(year)
    } else {
      daysInMonth = getLunarMonthDays(year, month)
    }

    if (isLeap && month === leapMonth + 1) isLeap = false
    if (offset < daysInMonth) break
    offset -= daysInMonth
    month++
  }

  const day = offset + 1

  return { year, month, day, isLeap }
}

function getGanZhi(year: number): string {
  const ganIndex = (year - 4) % 10
  const zhiIndex = (year - 4) % 12
  return ganNames[ganIndex] + zhiNames[zhiIndex]
}

function getZodiac(year: number): string {
  return zodiacNames[(year - 4) % 12]
}

function getSolarTerm(date: Date): string | null {
  const month = date.getMonth() + 1
  const day = date.getDate()

  for (const term of solarTerms) {
    if (term.month === month && Math.abs(term.day - day) <= 1) {
      if (term.day === day) {
        return term.name
      }
    }
  }
  return null
}

function generateYiJi(date: Date): { yi: string[]; ji: string[] } {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  const pseudoRandom = (n: number) => {
    const x = Math.sin(seed + n) * 10000
    return x - Math.floor(x)
  }

  const yiCount = Math.floor(pseudoRandom(1) * 5) + 4
  const jiCount = Math.floor(pseudoRandom(2) * 4) + 3

  const yi: string[] = []
  const usedYi = new Set<number>()
  for (let i = 0; i < yiCount; i++) {
    let idx = Math.floor(pseudoRandom(i + 3) * yiBase.length)
    while (usedYi.has(idx)) {
      idx = (idx + 1) % yiBase.length
    }
    usedYi.add(idx)
    yi.push(yiBase[idx])
  }

  const ji: string[] = []
  const usedJi = new Set<number>()
  for (let i = 0; i < jiCount; i++) {
    let idx = Math.floor(pseudoRandom(i + 10) * jiBase.length)
    while (usedJi.has(idx)) {
      idx = (idx + 1) % jiBase.length
    }
    usedJi.add(idx)
    ji.push(jiBase[idx])
  }

  return { yi, ji }
}

function getHealthTips(date: Date, solarTerm: string | null, chronicDiseases: string[] = []): string[] {
  const tips: string[] = []
  const month = date.getMonth() + 1

  if (month >= 3 && month <= 5) {
    tips.push('春季宜养肝，可多吃绿色蔬菜，早睡早起')
    tips.push('早晚温差大，注意适时增减衣物')
  } else if (month >= 6 && month <= 8) {
    tips.push('夏季养心，饮食宜清淡，注意防暑降温')
    tips.push('午间适当小憩，补充体力')
  } else if (month >= 9 && month <= 11) {
    tips.push('秋季养肺，可适当食用银耳、百合等润燥食物')
    tips.push('天气转凉，注意保暖，预防感冒')
  } else {
    tips.push('冬季养肾，可适当进补温热食物')
    tips.push('早睡晚起，保证充足睡眠')
  }

  if (solarTerm) {
    switch (solarTerm) {
      case '立春':
        tips.push('立春时节，宜养肝护肝，保持心情舒畅')
        break
      case '清明':
        tips.push('清明时节雨纷纷，注意防潮祛湿')
        break
      case '夏至':
        tips.push('夏至阳气最盛，注意清热解暑')
        break
      case '立秋':
        tips.push('立秋贴秋膘，饮食宜滋阴润燥')
        break
      case '冬至':
        tips.push('冬至进补，可适当食用羊肉、牛肉等温热食物')
        break
    }
  }

  if (chronicDiseases.includes('高血压')) {
    tips.push('高血压患者注意监测血压，保持情绪稳定')
    tips.push('低盐饮食，避免剧烈运动')
  }
  if (chronicDiseases.includes('糖尿病')) {
    tips.push('糖尿病患者注意控制饮食，规律用药')
    tips.push('适度运动，保持血糖稳定')
  }
  if (chronicDiseases.includes('关节炎')) {
    tips.push('关节炎患者注意关节保暖，避免受凉')
    tips.push('可进行温和的关节活动训练')
  }

  return tips.slice(0, 5)
}

function getLunarDateString(lunar: LunarDate): string {
  const monthStr = (lunar.isLeap ? '闰' : '') + lunarMonthNames[lunar.month - 1] + '月'
  const dayStr = lunarDayNames[lunar.day - 1]
  return monthStr + dayStr
}

function getUpcomingAnniversaries(userId: string, date: Date): Anniversary[] {
  const allAnniversaries = anniversaryDB.findByUserId(userId)
  const today = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  return allAnniversaries.filter(anniv => {
    const annivDate = anniv.date
    const todayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const annivDateThisYear = new Date(date.getFullYear(), parseInt(annivDate.split('-')[0]) - 1, parseInt(annivDate.split('-')[1]))

    if (annivDateThisYear < todayDate) {
      annivDateThisYear.setFullYear(annivDateThisYear.getFullYear() + 1)
    }

    const diffDays = Math.ceil((annivDateThisYear.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= anniv.remindDays && diffDays >= 0
  })
}

export function getLunarCalendar(dateParam?: Date | string, userId?: string): LunarCalendar {
  const date = dateParam ? (typeof dateParam === 'string' ? new Date(dateParam) : dateParam) : new Date()
  const lunar = solarToLunar(date)
  const solarTerm = getSolarTerm(date)
  const yiJi = generateYiJi(date)
  const ganZhi = getGanZhi(lunar.year)
  const zodiac = getZodiac(lunar.year)
  const healthTips = getHealthTips(date, solarTerm)

  let anniversaries: Anniversary[] = []
  if (userId) {
    anniversaries = getUpcomingAnniversaries(userId, date)
  }

  return {
    solarDate: date.toISOString().split('T')[0],
    lunarDate: getLunarDateString(lunar),
    lunarYear: `${lunar.year}年`,
    lunarMonth: (lunar.isLeap ? '闰' : '') + lunarMonthNames[lunar.month - 1] + '月',
    lunarDay: lunarDayNames[lunar.day - 1],
    ganZhi: ganZhi + '年',
    zodiac: '属' + zodiac,
    solarTerm,
    yi: yiJi.yi,
    ji: yiJi.ji,
    healthTips,
    anniversaries
  }
}

export function getLunarCalendarWithHealth(dateParam?: Date | string, chronicDiseases: string[] = []): LunarCalendar {
  const date = dateParam ? (typeof dateParam === 'string' ? new Date(dateParam) : dateParam) : new Date()
  const lunar = solarToLunar(date)
  const solarTerm = getSolarTerm(date)
  const yiJi = generateYiJi(date)
  const ganZhi = getGanZhi(lunar.year)
  const zodiac = getZodiac(lunar.year)
  const healthTips = getHealthTips(date, solarTerm, chronicDiseases)

  return {
    solarDate: date.toISOString().split('T')[0],
    lunarDate: getLunarDateString(lunar),
    lunarYear: `${lunar.year}年`,
    lunarMonth: (lunar.isLeap ? '闰' : '') + lunarMonthNames[lunar.month - 1] + '月',
    lunarDay: lunarDayNames[lunar.day - 1],
    ganZhi: ganZhi + '年',
    zodiac: '属' + zodiac,
    solarTerm,
    yi: yiJi.yi,
    ji: yiJi.ji,
    healthTips,
    anniversaries: []
  }
}

export default {
  getLunarCalendar,
  getLunarCalendarWithHealth
}
