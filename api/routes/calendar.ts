import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'

const router = Router()

const lunarMonthNames = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
]

const lunarDayNames = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const shengXiao = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const weekDayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const getGanZhi = (year: number): string => {
  const ganIndex = (year - 4) % 10
  const zhiIndex = (year - 4) % 12
  return tianGan[ganIndex] + diZhi[zhiIndex]
}

const getShengXiao = (year: number): string => {
  return shengXiao[(year - 4) % 12]
}

const yiList = [
  { name: '祭祀', description: '祭拜祖先、神明' },
  { name: '祈福', description: '祈求平安幸福' },
  { name: '出行', description: '外出旅行、探亲' },
  { name: '嫁娶', description: '结婚典礼' },
  { name: '纳财', description: '进财、收账' },
  { name: '开市', description: '开业、开张' },
  { name: '动土', description: '建筑动工' },
  { name: '安床', description: '安置睡床' },
  { name: '作灶', description: '修造灶台' },
  { name: '修造', description: '修缮房屋' },
  { name: '理发', description: '理发美容' },
  { name: '沐浴', description: '清洁沐浴' },
]

const jiList = [
  { name: '诸事不宜', description: '不宜进行重大事项' },
  { name: '入宅', description: '搬入新家' },
  { name: '安葬', description: '举行葬礼' },
  { name: '伐木', description: '砍伐树木' },
  { name: '栽种', description: '种植作物' },
  { name: '纳畜', description: '收养牲畜' },
  { name: '开仓', description: '打开仓库' },
  { name: '置产', description: '购置产业' },
]

const getTodayYiJi = (date: Date): { yi: typeof yiList; ji: typeof jiList } => {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  const yiCount = 4 + (seed % 4)
  const jiCount = 3 + (seed % 3)

  const yiShuffled = [...yiList].sort(() => ((seed * 9301 + 49297) % 233280) / 233280 - 0.5)
  const jiShuffled = [...jiList].sort(() => ((seed * 7919 + 31337) % 233280) / 233280 - 0.5)

  return {
    yi: yiShuffled.slice(0, yiCount),
    ji: jiShuffled.slice(0, jiCount),
  }
}

const solarTerms = [
  { name: '立春', date: '02-04', healthTips: ['早睡早起养肝', '适当舒展筋骨', '饮食宜清淡'], dietTips: ['多吃新鲜蔬菜', '少食辛辣油腻', '可食韭菜、春笋'], acupressureTips: ['按揉太冲穴', '按摩足三里'] },
  { name: '雨水', date: '02-19', healthTips: ['注意防寒保暖', '调养脾胃', '适量运动'], dietTips: ['多食粥类', '适量吃蜂蜜', '忌生冷食物'], acupressureTips: ['按揉中脘穴', '按摩丰隆穴'] },
  { name: '惊蛰', date: '03-06', healthTips: ['早睡早起', '防范流感', '情志舒畅'], dietTips: ['多吃梨润肺', '清淡饮食', '适当进补'], acupressureTips: ['按揉合谷穴', '按摩迎香穴'] },
  { name: '春分', date: '03-21', healthTips: ['阴阳平衡', '适量户外运动', '保持心情愉悦'], dietTips: ['忌大热大寒', '多食时令蔬菜', '饮食多样化'], acupressureTips: ['按揉涌泉穴', '按摩三阴交'] },
  { name: '清明', date: '04-05', healthTips: ['踏青出游', '注意防过敏', '保持心情舒畅'], dietTips: ['食时令野菜', '少食发物', '多喝水'], acupressureTips: ['按揉风池穴', '按摩曲池穴'] },
  { name: '谷雨', date: '04-20', healthTips: ['祛湿健脾', '注意神经痛', '适当运动'], dietTips: ['多食薏米红豆', '少食高蛋白质', '饮祛湿茶'], acupressureTips: ['按揉阴陵泉', '按摩足三里'] },
  { name: '立夏', date: '05-06', healthTips: ['养心安神', '午休补觉', '避免大汗淋漓'], dietTips: ['清心降火', '多吃苦味食物', '补充水分'], acupressureTips: ['按揉内关穴', '按摩神门穴'] },
  { name: '小满', date: '05-21', healthTips: ['清热利湿', '防皮肤病', '保持心情愉快'], dietTips: ['清淡饮食', '多食瓜果蔬菜', '忌生冷油腻'], acupressureTips: ['按揉曲池穴', '按摩阴陵泉'] },
  { name: '芒种', date: '06-06', healthTips: ['防暑降温', '保证睡眠', '勤洗澡换衣'], dietTips: ['食酸补心', '多喝绿豆汤', '清淡为主'], acupressureTips: ['按揉大椎穴', '按摩百会穴'] },
  { name: '夏至', date: '06-21', healthTips: ['养阳护心', '避免贪凉', '适当午睡'], dietTips: ['清暑益气', '多吃瓜果', '忌过食生冷'], acupressureTips: ['按揉内关穴', '按摩关元穴'] },
  { name: '小暑', date: '07-07', healthTips: ['防暑降温', '少动多静', '保持心情平静'], dietTips: ['清热解暑', '多喝温水', '食清淡易消化'], acupressureTips: ['按揉人中穴', '按摩合谷穴'] },
  { name: '大暑', date: '07-23', healthTips: ['避暑纳凉', '冬病夏治', '注意饮食卫生'], dietTips: ['多食苦味', '补充电解质', '忌暴饮暴食'], acupressureTips: ['按揉足三里', '按摩中脘穴'] },
  { name: '立秋', date: '08-08', healthTips: ['早睡早起', '润肺防燥', '适当秋冻'], dietTips: ['滋阴润肺', '多食梨与百合', '少辛增酸'], acupressureTips: ['按揉迎香穴', '按摩肺俞穴'] },
  { name: '处暑', date: '08-23', healthTips: ['调整作息', '润肺养胃', '防秋乏'], dietTips: ['多食蔬菜水果', '适量进补', '多喝粥品'], acupressureTips: ['按揉天突穴', '按摩膻中穴'] },
  { name: '白露', date: '09-08', healthTips: ['适时添衣', '滋阴润燥', '锻炼耐寒'], dietTips: ['润肺生津', '多吃银耳莲子', '忌辛辣'], acupressureTips: ['按揉合谷穴', '按摩鱼际穴'] },
  { name: '秋分', date: '09-23', healthTips: ['养阴防燥', '平衡情志', '早睡早起'], dietTips: ['润燥养肺', '饮食有节制', '多喝汤水'], acupressureTips: ['按揉太渊穴', '按摩列缺穴'] },
  { name: '寒露', date: '10-08', healthTips: ['足部保暖', '防感冒', '养阴润肺'], dietTips: ['润燥生津', '多食芝麻核桃', '适当进补'], acupressureTips: ['按揉涌泉穴', '按摩足三里'] },
  { name: '霜降', date: '10-24', healthTips: ['防寒保暖', '保护关节', '适当锻炼'], dietTips: ['平补养胃', '多食栗子山药', '少食寒凉'], acupressureTips: ['按揉肾俞穴', '按摩关元穴'] },
  { name: '立冬', date: '11-07', healthTips: ['早睡晚起', '养精蓄锐', '适量运动'], dietTips: ['温补为主', '多食羊肉鸡肉', '进补强身'], acupressureTips: ['按揉关元穴', '按摩气海穴'] },
  { name: '小雪', date: '11-22', healthTips: ['防寒保暖', '调节情志', '适当运动'], dietTips: ['温补肾阳', '多食黑色食物', '适量喝汤'], acupressureTips: ['按揉肾俞穴', '按摩命门穴'] },
  { name: '大雪', date: '12-07', healthTips: ['御寒保暖', '注意头部保暖', '早睡晚起'], dietTips: ['温补不燥', '多食坚果', '多饮热水'], acupressureTips: ['按揉百会穴', '按摩涌泉穴'] },
  { name: '冬至', date: '12-22', healthTips: ['静养为主', '防寒保暖', '适量进补'], dietTips: ['冬令进补', '食饺子汤圆', '温补脾肾'], acupressureTips: ['按揉关元穴', '按摩肾俞穴'] },
  { name: '小寒', date: '01-06', healthTips: ['防寒保暖', '适当运动', '养肾防寒'], dietTips: ['温补脾肾', '多食羊肉', '适量喝热粥'], acupressureTips: ['按揉命门穴', '按摩关元穴'] },
  { name: '大寒', date: '01-20', healthTips: ['防风御寒', '早睡晚起', '适当进补'], dietTips: ['固护脾肾', '多食温热食物', '饮食多样化'], acupressureTips: ['按揉肾俞穴', '按摩足三里'] },
]

const getCurrentSolarTerm = (date: Date) => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const currentMMDD = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

  let current: typeof solarTerms[0] | undefined
  let next: typeof solarTerms[0] | undefined

  for (let i = 0; i < solarTerms.length; i++) {
    const term = solarTerms[i]
    if (currentMMDD >= term.date) {
      current = term
      next = solarTerms[(i + 1) % solarTerms.length]
    }
  }

  if (!current) {
    current = solarTerms[solarTerms.length - 1]
    next = solarTerms[0]
  }

  return { current, next }
}

const solarToLunar = (date: Date) => {
  const lunarInfo = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0,
    0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540,
    0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50,
    0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0,
    0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
    0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573,
    0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4,
    0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5,
    0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
    0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
    0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50,
    0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0,
    0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260,
    0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0,
    0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
    0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  ]

  const lYearDays = (year: number): number => {
    let sum = 348
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += lunarInfo[year - 1900] & i ? 1 : 0
    }
    return sum + leapDays(year)
  }

  const leapMonthOfYear = (year: number): number => {
    return lunarInfo[year - 1900] & 0xf
  }

  const leapDays = (year: number): number => {
    if (leapMonthOfYear(year)) {
      return lunarInfo[year - 1900] & 0x10000 ? 30 : 29
    }
    return 0
  }

  const monthDaysOfYear = (year: number, month: number): number => {
    return lunarInfo[year - 1900] & (0x10000 >> month) ? 30 : 29
  }

  const baseDate = new Date(1900, 0, 31)
  let offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000)

  let year = 1900
  let yearDays: number

  for (; year < 2100 && offset > 0; year++) {
    yearDays = lYearDays(year)
    if (offset < yearDays) break
    offset -= yearDays
  }

  const leapMonth = leapMonthOfYear(year)
  let isLeap = false
  let month = 1
  let monthDays: number

  for (; month < 13 && offset > 0; month++) {
    if (leapMonth > 0 && month === leapMonth + 1 && !isLeap) {
      --month
      isLeap = true
      monthDays = leapDays(year)
    } else {
      monthDays = monthDaysOfYear(year, month)
    }

    if (isLeap && month === leapMonth + 1) isLeap = false
    if (offset < monthDays) break
    offset -= monthDays
  }

  const day = offset + 1

  return {
    year,
    month,
    day,
    yearGanZhi: getGanZhi(year),
    monthGanZhi: getGanZhi(year),
    dayGanZhi: getGanZhi(year),
    yearAnimal: getShengXiao(year),
    lunarMonthName: isLeap ? '闰' + lunarMonthNames[month - 1] : lunarMonthNames[month - 1],
    lunarDayName: lunarDayNames[day - 1],
    isLeap,
  }
}

router.get('/today', (req: Request, res: Response): void => {
  const today = new Date()
  const lunar = solarToLunar(today)
  const { yi, ji } = getTodayYiJi(today)
  const { current, next } = getCurrentSolarTerm(today)

  const data = {
    lunar,
    solarDate: dayjs(today).format('YYYY年M月D日'),
    weekDay: weekDayNames[today.getDay()],
    yi,
    ji,
    currentSolarTerm: current,
    nextSolarTerm: next,
  }

  res.json({
    success: true,
    message: '获取今日黄历成功',
    data,
  })
})

router.get('/yi-ji', (req: Request, res: Response): void => {
  const today = new Date()
  const { yi, ji } = getTodayYiJi(today)

  res.json({
    success: true,
    message: '获取宜忌成功',
    data: {
      yi,
      ji,
    },
  })
})

router.get('/solar-term', (req: Request, res: Response): void => {
  const today = new Date()
  const { current, next } = getCurrentSolarTerm(today)

  res.json({
    success: true,
    message: '获取节气养生成功',
    data: {
      current,
      next,
      allSolarTerms: solarTerms,
    },
  })
})

export default router
