import { formatWorkHours, formatWorkHoursStructured, matchMomNightShift, estimateCommute } from './src/utils/helpers'

const mockWorkHours = [
  { day: 1, startTime: '09:00', endTime: '14:00' },
  { day: 1, startTime: '17:00', endTime: '21:00' },
  { day: 2, startTime: '09:00', endTime: '14:00' },
  { day: 2, startTime: '17:00', endTime: '21:00' },
  { day: 3, startTime: '09:00', endTime: '14:00' },
  { day: 3, startTime: '17:00', endTime: '21:00' },
  { day: 4, startTime: '09:00', endTime: '14:00' },
  { day: 4, startTime: '17:00', endTime: '21:00' },
  { day: 5, startTime: '09:00', endTime: '14:00' },
  { day: 5, startTime: '17:00', endTime: '21:00' },
]

console.log('=== formatWorkHours 测试 ===')
console.log('输出:', formatWorkHours(mockWorkHours))
console.log('期望: 周一至周五 早晚班(09:00-14:00, 17:00-21:00)')
console.log('无"周一/周一"重复?:', !formatWorkHours(mockWorkHours).includes('周一/周一'))

console.log('\n=== structured 详情 ===')
const structured = formatWorkHoursStructured(mockWorkHours)
console.log('summary:', structured.summary)
console.log('总工时/周:', structured.totalHoursPerWeek, '小时')
structured.details.forEach(d => {
  console.log(`  ${d.dayName}: ${d.shifts.map(s => s.startTime + '-' + s.endTime).join('、')}`)
})

console.log('\n=== 宝妈时段匹配测试 ===')
const momResult = matchMomNightShift(mockWorkHours)
console.log('matched:', momResult.matched)
console.log('覆盖小时数:', momResult.coverageHours, 'h')
console.log('覆盖率:', momResult.coveragePercent, '%')
console.log('详情:', momResult.details)

console.log('\n=== 通勤估算测试 ===')
const commute1 = estimateCommute(121.5256, 31.2337, 121.5, 31.2, 10)
console.log('味千餐饮通勤:', commute1.displayWithMode)
console.log('是否在半径内:', commute1.withinRadius)

const commute2 = estimateCommute(121.3816, 31.1117, 121.5, 31.2, 10)
console.log('顺达物流通勤:', commute2.displayWithMode)
console.log('是否在半径内:', commute2.withinRadius)
