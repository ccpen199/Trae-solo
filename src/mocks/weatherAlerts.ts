import type { WeatherAlert } from '@/types'

export const weatherAlerts: WeatherAlert[] = [
  {
    id: 'WA-001',
    level: 'red',
    type: '暴雨',
    region: '山东省寿光市',
    description: '预计未来6小时内寿光市将出现特大暴雨，累计降水量可达150mm以上，并伴有雷电和8级以上大风',
    startTime: '2026-06-08 14:00',
    endTime: '2026-06-09 08:00',
    advice: '请各温室大棚做好加固防风措施，疏通排水沟渠，已成熟蔬菜尽快抢收，低洼地带注意防涝，暂停户外农事作业'
  },
  {
    id: 'WA-002',
    level: 'orange',
    type: '高温',
    region: '新疆阿克苏地区',
    description: '预计未来三天阿克苏地区日最高气温将达到40℃以上，地表温度可能超过60℃',
    startTime: '2026-06-10 10:00',
    endTime: '2026-06-13 20:00',
    advice: '果园加强灌溉补水，果实套袋防止日灼，适当遮阴降温，采摘作业避开中午高温时段，注意防暑降温'
  },
  {
    id: 'WA-003',
    level: 'yellow',
    type: '霜冻',
    region: '黑龙江省五常市',
    description: '预计5月中旬夜间最低气温将降至-2℃，可能出现晚霜冻害，对水稻秧苗和早播作物有影响',
    startTime: '2026-05-15 22:00',
    endTime: '2026-05-16 08:00',
    advice: '水稻秧苗及时覆膜保温，旱田作物可采取熏烟防霜措施，暂停移栽作业，已移栽幼苗加强保温防护'
  },
  {
    id: 'WA-004',
    level: 'blue',
    type: '大风',
    region: '云南省普洱市',
    description: '预计未来24小时内普洱市将出现6-7级大风，局部地区阵风可达8级',
    startTime: '2026-06-10 16:00',
    endTime: '2026-06-11 16:00',
    advice: '茶园注意加固防护设施，采摘作业注意安全，制茶车间关好门窗防止粉尘污染，室外晾晒茶叶及时收回'
  }
]
