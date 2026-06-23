import type { WorkHours } from '../../shared/types'

export function desensitizePhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

export function desensitizeIdCard(id: string): string {
  if (!id || id.length < 4) return id
  return id.slice(0, 3) + '*'.repeat(id.length - 4) + id.slice(-1)
}

const salaryUnitMap: Record<string, string> = {
  hourly: '元/时',
  daily: '元/天',
  monthly: '元/月',
}

export function formatSalary(
  min: number,
  max: number,
  type: 'hourly' | 'daily' | 'monthly'
): string {
  const unit = salaryUnitMap[type] || '元/月'
  return `${min}-${max} ${unit}`
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

export function getTimeRemaining(deadline: string): {
  hours: number
  minutes: number
  expired: boolean
} {
  const now = Date.now()
  const end = new Date(deadline).getTime()
  const diff = end - now

  if (diff <= 0) {
    return { hours: 0, minutes: 0, expired: true }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { hours, minutes, expired: false }
}

const industryLabelMap: Record<string, string> = {
  restaurant: '餐饮',
  retail: '零售',
  housekeeping: '家政',
  logistics: '物流',
  security: '安保',
  other: '其他',
}

export function getIndustryLabel(industry: string): string {
  return industryLabelMap[industry] || industry
}

export function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-info'
  if (score >= 40) return 'text-accent'
  return 'text-danger'
}

const riskLevelColorMap: Record<string, string> = {
  none: 'text-success',
  low: 'text-info',
  medium: 'text-accent',
  high: 'text-danger',
}

export function getRiskLevelColor(level: string): string {
  return riskLevelColorMap[level] || 'text-gray-500'
}

const statusLabelMap: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  draft: '草稿',
  published: '已发布',
  offline: '已下线',
  applied: '已投递',
  viewed: '已查看',
  interviewing: '面试中',
  accepted: '已录用',
  expired: '已过期',
  completed: '已完成',
  cancelled: '已取消',
  pending_sign: '待签署',
  signed: '已签署',
  terminated: '已终止',
  not_filed: '未备案',
  filing: '备案中',
  filed: '已备案',
  failed: '备案失败',
  pending_ocr: '待OCR识别',
  ocr_done: 'OCR完成',
  scanning: '风险扫描中',
  risk_detected: '检测到风险',
  pending_review: '待人工审核',
  submitted: '已提交',
  mediating: '调解中',
  resolved: '已解决',
  escalated: '已升级',
  verified: '已认证',
}

export function getStatusLabel(status: string): string {
  return statusLabelMap[status] || status
}

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface FormattedShift {
  startTime: string
  endTime: string
}

interface DaySchedule {
  day: number
  dayName: string
  shifts: FormattedShift[]
}

interface FormatWorkHoursResult {
  summary: string
  details: DaySchedule[]
  totalHoursPerWeek: number
}

export function formatWorkHours(hours: WorkHours[]): string {
  const result = formatWorkHoursStructured(hours)
  return result.summary
}

export function formatWorkHoursStructured(hours: WorkHours[]): FormatWorkHoursResult {
  if (!hours || hours.length === 0) {
    return { summary: '', details: [], totalHoursPerWeek: 0 }
  }

  const dayMap = new Map<number, FormattedShift[]>()

  for (const wh of hours) {
    if (!dayMap.has(wh.day)) {
      dayMap.set(wh.day, [])
    }
    dayMap.get(wh.day)!.push({
      startTime: wh.startTime,
      endTime: wh.endTime,
    })
  }

  const days: number[] = Array.from(dayMap.keys()).sort((a, b) => a - b)
  const details: DaySchedule[] = days.map(day => ({
    day,
    dayName: DAY_NAMES[day],
    shifts: dayMap.get(day)!,
  }))

  let totalHours = 0
  for (const wh of hours) {
    const [sh, sm] = wh.startTime.split(':').map(Number)
    const [eh, em] = wh.endTime.split(':').map(Number)
    totalHours += (eh * 60 + em - sh * 60 - sm) / 60
  }

  const isAllWeekdays = days.length === 5 && days.every(d => d >= 1 && d <= 5)
  const isAllWeekend = days.length === 2 && days.every(d => d === 0 || d === 6)
  const isFullWeek = days.length === 7

  function formatShifts(shifts: FormattedShift[]): string {
    if (shifts.length === 1) {
      return `${shifts[0].startTime}-${shifts[0].endTime}`
    }
    const shiftStrs = shifts.map(s => `${s.startTime}-${s.endTime}`)
    return `${shifts.length === 2 ? '早晚班' : `${shifts.length}班`}(${shiftStrs.join(', ')})`
  }

  let summary = ''
  if (isFullWeek) {
    const firstDayShifts = dayMap.get(days[0])!
    const allSame = days.every(d => JSON.stringify(dayMap.get(d)!) === JSON.stringify(firstDayShifts))
    if (allSame) {
      summary = `全周 ${formatShifts(firstDayShifts)}`
    } else {
      summary = `全周 共${hours.length}个班次`
    }
  } else if (isAllWeekdays) {
    const firstDayShifts = dayMap.get(days[0])!
    const allSame = days.every(d => JSON.stringify(dayMap.get(d)!) === JSON.stringify(firstDayShifts))
    if (allSame) {
      summary = `周一至周五 ${formatShifts(firstDayShifts)}`
    } else {
      summary = `周一至周五 共${hours.length}个班次`
    }
  } else if (isAllWeekend) {
    const firstDayShifts = dayMap.get(days[0])!
    const allSame = days.every(d => JSON.stringify(dayMap.get(d)!) === JSON.stringify(firstDayShifts))
    if (allSame) {
      summary = `周末 ${formatShifts(firstDayShifts)}`
    } else {
      summary = `周末 共${hours.length}个班次`
    }
  } else {
    const dayRanges: string[] = []
    let i = 0
    while (i < days.length) {
      let j = i
      const startShifts = dayMap.get(days[i])!
      while (j + 1 < days.length && days[j + 1] === days[j] + 1 &&
             JSON.stringify(dayMap.get(days[j + 1])!) === JSON.stringify(startShifts)) {
        j++
      }
      if (i === j) {
        dayRanges.push(`${DAY_NAMES[days[i]]} ${formatShifts(startShifts)}`)
      } else {
        dayRanges.push(`${DAY_NAMES[days[i]]}至${DAY_NAMES[days[j]]} ${formatShifts(startShifts)}`)
      }
      i = j + 1
    }
    summary = dayRanges.join('；')
  }

  return {
    summary,
    details,
    totalHoursPerWeek: Math.round(totalHours * 10) / 10,
  }
}

interface MomNightShiftMatch {
  matched: boolean
  coverageHours: number
  matchedDays: number
  totalMomDays: number
  coveragePercent: number
  details: string
}

export function matchMomNightShift(
  jobHours: WorkHours[],
  momStartHour: number = 18,
  momEndHour: number = 22
): MomNightShiftMatch {
  if (!jobHours || jobHours.length === 0) {
    return { matched: false, coverageHours: 0, matchedDays: 0, totalMomDays: 0, coveragePercent: 0, details: '无工作时间数据' }
  }

  const momDays = [1, 2, 3, 4, 5]
  const totalMomDays = momDays.length
  let matchedDays = 0
  let totalCoverageMinutes = 0
  const totalTargetMinutes = totalMomDays * (momEndHour - momStartHour) * 60

  const dayMap = new Map<number, FormattedShift[]>()
  for (const wh of jobHours) {
    if (!dayMap.has(wh.day)) {
      dayMap.set(wh.day, [])
    }
    dayMap.get(wh.day)!.push({ startTime: wh.startTime, endTime: wh.endTime })
  }

  for (const day of momDays) {
    const shifts = dayMap.get(day) || []
    let dayCoverage = 0

    for (const shift of shifts) {
      const [sh, sm] = shift.startTime.split(':').map(Number)
      const [eh, em] = shift.endTime.split(':').map(Number)
      const shiftStartMin = sh * 60 + sm
      const shiftEndMin = eh * 60 + em

      const momStartMin = momStartHour * 60
      const momEndMin = momEndHour * 60

      const overlapStart = Math.max(shiftStartMin, momStartMin)
      const overlapEnd = Math.min(shiftEndMin, momEndMin)

      if (overlapEnd > overlapStart) {
        dayCoverage += overlapEnd - overlapStart
      }
    }

    if (dayCoverage > 0) {
      matchedDays++
      totalCoverageMinutes += dayCoverage
    }
  }

  const coveragePercent = totalTargetMinutes > 0 ? Math.round((totalCoverageMinutes / totalTargetMinutes) * 100) : 0
  const coverageHours = Math.round((totalCoverageMinutes / 60) * 10) / 10
  const matched = coveragePercent >= 60

  let details = ''
  if (matched) {
    details = `覆盖宝妈${momStartHour}:00-${momEndHour}:00时段 ${coverageHours}h（${coveragePercent}%）`
  } else if (coverageHours > 0) {
    details = `部分覆盖宝妈时段 ${coverageHours}h（${coveragePercent}%）`
  } else {
    details = `未覆盖宝妈${momStartHour}:00-${momEndHour}:00时段`
  }

  return { matched, coverageHours, matchedDays, totalMomDays, coveragePercent, details }
}

interface CommuteEstimate {
  distanceKm: number
  walkingMinutes: number
  transitMinutes: number
  bikingMinutes: number
  withinRadius: boolean
  display: string
  displayWithMode: string
}

export function estimateCommute(
  jobLng: number,
  jobLat: number,
  userLng: number = 121.5,
  userLat: number = 31.2,
  radiusKm: number = 10
): CommuteEstimate {
  const R = 6371
  const dLat = (jobLat - userLat) * Math.PI / 180
  const dLng = (jobLng - userLng) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(jobLat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distanceKm = Math.round(R * c * 10) / 10

  const walkingMinutes = Math.round(distanceKm / 4.5 * 60)
  const bikingMinutes = Math.round(distanceKm / 15 * 60)
  const transitMinutes = Math.round(distanceKm / 30 * 60 + 5)

  const withinRadius = distanceKm <= radiusKm

  let display = ''
  if (distanceKm < 1) {
    display = `距您${Math.round(distanceKm * 1000)}m`
  } else {
    display = `距您${distanceKm}km`
  }

  let modeDisplay = ''
  if (distanceKm <= 1) {
    modeDisplay = `步行${walkingMinutes}分钟`
  } else if (distanceKm <= 3) {
    modeDisplay = `骑行${bikingMinutes}分钟`
  } else {
    modeDisplay = `地铁${transitMinutes}分钟`
  }

  return {
    distanceKm,
    walkingMinutes,
    transitMinutes,
    bikingMinutes,
    withinRadius,
    display,
    displayWithMode: `${display}·${modeDisplay}`,
  }
}

interface QualificationCheck {
  satisfied: string[]
  missing: string[]
  allSatisfied: boolean
  certRequirements: { name: string; hasCert: boolean }[]
  ageRequirement?: { min?: number; max?: number; userAge?: number; satisfied: boolean }
}

export function checkQualifications(
  requirements: string[],
  userCerts: string[] = [],
  userAge?: number
): QualificationCheck {
  const satisfied: string[] = []
  const missing: string[] = []
  const certRequirements: { name: string; hasCert: boolean }[] = []
  let ageRequirement: QualificationCheck['ageRequirement'] = undefined

  if (!requirements || requirements.length === 0) {
    return { satisfied: [], missing: [], allSatisfied: true, certRequirements: [] }
  }

  for (const req of requirements) {
    const ageMatch = req.match(/年龄\s*(\d+)\s*[-~至到]\s*(\d+)\s*岁/)
    if (ageMatch && userAge !== undefined) {
      const min = parseInt(ageMatch[1])
      const max = parseInt(ageMatch[2])
      const isSatisfied = userAge >= min && userAge <= max
      ageRequirement = { min, max, userAge, satisfied: isSatisfied }
      if (isSatisfied) {
        satisfied.push(req)
      } else {
        missing.push(req)
      }
      continue
    }

    const certKeywords = ['健康证', '证书', '资格证', '执业证', '许可证', '上岗证', '安全员', '育婴师', '月嫂']
    const isCertReq = certKeywords.some(kw => req.includes(kw))

    if (isCertReq) {
      const hasCert = userCerts.some(cert => {
        for (const kw of certKeywords) {
          if (req.includes(kw) && cert.includes(kw)) return true
        }
        return false
      })
      certRequirements.push({ name: req, hasCert })
      if (hasCert) {
        satisfied.push(req)
      } else {
        missing.push(req)
      }
      continue
    }

    const expMatch = req.match(/(\d+)\s*年.*经验/)
    if (expMatch) {
      const years = parseInt(expMatch[1])
      if (years <= 3) {
        satisfied.push(req)
      } else {
        missing.push(req)
      }
      continue
    }

    const softKeywords = ['优先', '良好', '强', '佳', '可接受', '能适应', '认真', '负责', '细心', '耐心', '吃苦', '耐劳', '沟通', '责任心']
    const isSoftReq = softKeywords.some(kw => req.includes(kw))

    if (isSoftReq) {
      satisfied.push(req)
    } else {
      satisfied.push(req)
    }
  }

  return {
    satisfied,
    missing,
    allSatisfied: missing.length === 0,
    certRequirements,
    ageRequirement,
  }
}

interface MatchEnhanceInput {
  jobSalaryMin: number
  jobSalaryMax: number
  jobSalaryType: 'hourly' | 'daily' | 'monthly'
  userSalaryMin?: number
  userSalaryMax?: number
  commute: CommuteEstimate
  radiusKm: number
  momShift: MomNightShiftMatch
  qualifications: QualificationCheck
}

export function enhanceMatchReasons(input: MatchEnhanceInput): string[] {
  const reasons: string[] = []
  const {
    jobSalaryMin, jobSalaryMax, jobSalaryType,
    userSalaryMin, userSalaryMax,
    commute, radiusKm, momShift, qualifications
  } = input

  if (commute.withinRadius) {
    reasons.push(`通勤距离匹配(${commute.distanceKm}km ≤ ${radiusKm}km)`)
  } else {
    reasons.push(`通勤距离超出(${commute.distanceKm}km > ${radiusKm}km)`)
  }

  if (momShift.matched) {
    reasons.push(`夜间时段匹配(覆盖宝妈18-22点时段)`)
  } else if (momShift.coveragePercent > 0) {
    reasons.push(`夜间时段部分覆盖(${momShift.coveragePercent}%)`)
  }

  const salaryUnit = jobSalaryType === 'hourly' ? '元/时' : jobSalaryType === 'daily' ? '元/天' : '元/月'
  if (userSalaryMin !== undefined && userSalaryMax !== undefined) {
    const overlapMin = Math.max(jobSalaryMin, userSalaryMin)
    const overlapMax = Math.min(jobSalaryMax, userSalaryMax)
    if (overlapMax >= overlapMin) {
      reasons.push(`薪资期望匹配(${jobSalaryMin}-${jobSalaryMax}${salaryUnit} 在${userSalaryMin}-${userSalaryMax}${salaryUnit}区间内)`)
    } else if (jobSalaryMin >= userSalaryMax) {
      reasons.push(`薪资高于期望(${jobSalaryMin}-${jobSalaryMax}${salaryUnit})`)
    } else {
      reasons.push(`薪资低于期望(${jobSalaryMin}-${jobSalaryMax}${salaryUnit})`)
    }
  }

  for (const cert of qualifications.certRequirements) {
    if (cert.hasCert) {
      reasons.push(`${cert.name}要求已满足`)
    }
  }

  if (qualifications.ageRequirement && qualifications.ageRequirement.satisfied) {
    reasons.push(`年龄要求匹配(${qualifications.ageRequirement.userAge}岁在${qualifications.ageRequirement.min}-${qualifications.ageRequirement.max}岁区间)`)
  }

  return reasons
}
