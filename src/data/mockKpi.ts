import type { KpiData, DeviceAlert, Notification } from '@/types';

export const mockKpiList: KpiData[] = [
  { period: '本周', avgResponseMinutes: 7.2, avgHandleMinutes: 135, completionRate: 94.5, satisfaction: 4.72, totalTickets: 128, repairTickets: 62, complaintTickets: 28, suggestionTickets: 38, onTimeRate: 91.2 },
  { period: '上周', avgResponseMinutes: 8.5, avgHandleMinutes: 148, completionRate: 92.3, satisfaction: 4.65, totalTickets: 115, repairTickets: 55, complaintTickets: 25, suggestionTickets: 35, onTimeRate: 88.7 },
  { period: '本月', avgResponseMinutes: 7.9, avgHandleMinutes: 142, completionRate: 93.4, satisfaction: 4.68, totalTickets: 520, repairTickets: 248, complaintTickets: 118, suggestionTickets: 154, onTimeRate: 90.1 },
  { period: '上月', avgResponseMinutes: 9.1, avgHandleMinutes: 165, completionRate: 90.1, satisfaction: 4.52, totalTickets: 485, repairTickets: 230, complaintTickets: 110, suggestionTickets: 145, onTimeRate: 86.5 },
];

export const mockKpiDaily = [
  { day: '周一', tickets: 24, response: 7.1, handle: 130, satisfaction: 4.8 },
  { day: '周二', tickets: 18, response: 6.8, handle: 125, satisfaction: 4.7 },
  { day: '周三', tickets: 22, response: 7.5, handle: 140, satisfaction: 4.6 },
  { day: '周四', tickets: 20, response: 7.3, handle: 138, satisfaction: 4.7 },
  { day: '周五', tickets: 25, response: 7.8, handle: 142, satisfaction: 4.7 },
  { day: '周六', tickets: 10, response: 6.2, handle: 110, satisfaction: 4.8 },
  { day: '周日', tickets: 9, response: 6.5, handle: 115, satisfaction: 4.8 },
];

export const mockAlerts: DeviceAlert[] = [
  { id: 'AL001', deviceId: 'D006', deviceName: '8栋1单元门', deviceLocation: '8栋1单元入口', level: 'critical', type: 'offline', message: '设备离线超过8小时，请现场检查电源和网络', timestamp: '2026-06-10 06:15:30', resolved: false },
  { id: 'AL002', deviceId: 'D006', deviceName: '8栋1单元门', deviceLocation: '8栋1单元入口', level: 'warning', type: 'low_battery', message: '设备电量低(12%)，请尽快更换电池', timestamp: '2026-06-10 05:30:00', resolved: false },
  { id: 'AL003', deviceId: 'D007', deviceName: '小区北门', deviceLocation: '小区北侧行人入口', level: 'critical', type: 'fault', message: '设备自检异常，二维码模块故障', timestamp: '2026-06-09 18:45:22', resolved: false },
  { id: 'AL004', deviceId: 'D003', deviceName: '5栋1单元门', deviceLocation: '5栋1单元入口', level: 'warning', type: 'low_battery', message: '设备电量中等(22%)，建议安排更换', timestamp: '2026-06-10 03:10:00', resolved: false },
  { id: 'AL005', deviceId: 'D001', deviceName: '小区东门', deviceLocation: '小区东侧主入口', level: 'info', type: 'tamper', message: '检测到异常撬动，已自动拍照上传', timestamp: '2026-06-09 03:22:11', resolved: true, resolvedAt: '2026-06-09 08:30:00', resolvedBy: '李主管' },
  { id: 'AL006', deviceId: 'D005', deviceName: '地下车库入口A', deviceLocation: 'B1层车库入口', level: 'warning', type: 'offline', message: '设备网络波动，已自动重连恢复', timestamp: '2026-06-09 22:15:30', resolved: true, resolvedAt: '2026-06-09 22:16:05', resolvedBy: '系统自动' },
];

export const mockNotifications: Notification[] = [
  { id: 'N001', type: 'ticket', title: '工单T004已派单', content: '您的报修【客厅空调制冷效果差】已分派至赵师傅，预计30分钟内到达', read: false, timestamp: '2026-06-10 08:12:40', relateId: 'T004' },
  { id: 'N002', type: 'system', title: '6月15日停水通知', content: '因市政管网维修，6月15日09:00-15:00全小区暂停供水，请提前储水', read: false, timestamp: '2026-06-09 14:30:00' },
  { id: 'N003', type: 'service', title: '保洁服务即将开始', content: '您预约的全屋深度保洁将于今日14:00开始，阿姨正在路上', read: false, timestamp: '2026-06-10 13:30:00', relateId: 'O001' },
  { id: 'N004', type: 'access', title: '访客邀请已生效', content: '您为【刘姐】生成的访客二维码已生效，有效期至今日18:00', read: true, timestamp: '2026-06-10 10:00:00' },
  { id: 'N005', type: 'ticket', title: '工单T001已完成，请评价', content: '您的报修【厨房水龙头漏水】已完成处理，请对服务进行评价', read: true, timestamp: '2026-06-09 11:50:00', relateId: 'T001' },
  { id: 'N006', type: 'payment', title: '快递柜取件通知', content: '您的顺丰快递已存入A-01柜，取件码8823#56，请48小时内取件', read: true, timestamp: '2026-06-10 07:46:00' },
  { id: 'N007', type: 'ticket', title: '投诉T002处理进展', content: '您的投诉【楼上邻居深夜噪音扰民】已联系1602住户沟通', read: true, timestamp: '2026-06-10 08:15:00', relateId: 'T002' },
  { id: 'N008', type: 'service', title: '订单完成评价有礼', content: '您的金龙鱼调和油订单已完成，评价可获得5积分奖励', read: true, timestamp: '2026-06-09 21:10:00', relateId: 'O002' },
];

export const kpiTargets = {
  responseMinutes: 10,
  handleMinutes: 180,
  completionRate: 90,
  satisfaction: 4.5,
  onTimeRate: 88,
};

export const mockDailyStats = mockKpiDaily.map(d => ({
  date: d.day.slice(-1) === '一' ? '周一' :
        d.day === '周二' ? '周二' :
        d.day === '周三' ? '周三' :
        d.day === '周四' ? '周四' :
        d.day === '周五' ? '周五' :
        d.day === '周六' ? '周六' : '周日',
  total: d.tickets,
  repair: Math.round(d.tickets * 0.5),
  complaint: Math.round(d.tickets * 0.2),
  suggestion: d.tickets - Math.round(d.tickets * 0.5) - Math.round(d.tickets * 0.2),
}));
