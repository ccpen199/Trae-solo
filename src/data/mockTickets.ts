import type { Ticket, TicketProgress } from '@/types';

const makeProgress = (arr: Array<[string, string, string, string]>): TicketProgress[] =>
  arr.map(([id, status, remark, ts], idx) => ({ id, status: status as any, operator: idx === 0 ? '张明' : idx === 1 ? '物业调度·李主管' : '维修工·王师傅', remark, timestamp: ts }));

export const mockTickets: Ticket[] = [
  {
    id: 'T001', type: 'repair', title: '厨房水龙头漏水',
    description: '厨房水槽水龙头根部持续滴水，关紧也无法完全止住，已接水盆盛水，需要尽快维修更换阀芯或整个龙头。',
    images: ['https://picsum.photos/id/225/600/400'], location: '5栋2单元1502 厨房',
    contactName: '张明', contactPhone: '138****6688',
    submitterId: 'U001', submitterName: '张明',
    handlerId: 'H001', handlerName: '王师傅',
    status: 'completed', priority: 'medium',
    createdAt: '2026-06-09 09:12:30', assignedAt: '2026-06-09 09:20:15', completedAt: '2026-06-09 11:45:00',
    responseMinutes: 8, handleMinutes: 145,
    satisfaction: 5, comment: '师傅响应很快，技术专业，现场清理得很干净，非常满意！',
    progress: makeProgress([
      ['P001', 'pending', '工单已提交，等待处理', '2026-06-09 09:12:30'],
      ['P002', 'assigned', '已派单至王师傅', '2026-06-09 09:20:15'],
      ['P003', 'processing', '师傅已上门检查，确认需要更换阀芯', '2026-06-09 10:05:22'],
      ['P004', 'completed', '更换阀芯完成，测试无漏水', '2026-06-09 11:45:00'],
    ])
  },
  {
    id: 'T002', type: 'complaint', title: '楼上邻居深夜噪音扰民',
    description: '1602住户连续多日深夜11点至凌晨1点有重物拖拽和大声喧哗声，严重影响家人休息，已上楼沟通但效果不佳，希望物业协调处理。',
    images: [], location: '5栋2单元1602',
    contactName: '张明', contactPhone: '138****6688',
    submitterId: 'U001', submitterName: '张明',
    handlerId: 'H002', handlerName: '李主管',
    status: 'processing', priority: 'high',
    createdAt: '2026-06-10 07:30:12', assignedAt: '2026-06-10 07:38:05',
    responseMinutes: 8,
    progress: makeProgress([
      ['P005', 'pending', '投诉已受理', '2026-06-10 07:30:12'],
      ['P006', 'assigned', '已分派至李主管跟进', '2026-06-10 07:38:05'],
      ['P007', 'processing', '已致电1602住户沟通，对方表示会注意', '2026-06-10 08:15:00'],
    ])
  },
  {
    id: 'T003', type: 'suggestion', title: '建议增加儿童游乐区遮阳设施',
    description: '小区中央花园儿童游乐区夏季正午暴晒，小孩玩耍容易中暑，建议安装遮阳棚或种植攀爬架绿植，提升公共区域体验。',
    images: ['https://picsum.photos/id/1018/600/400'], location: '中央花园儿童游乐区',
    contactName: '张明', contactPhone: '138****6688',
    submitterId: 'U001', submitterName: '张明',
    handlerId: 'H003', handlerName: '物业经理·周总',
    status: 'pending', priority: 'low',
    createdAt: '2026-06-08 16:25:40',
    progress: makeProgress([
      ['P008', 'pending', '建议已收悉，正在评估可行性', '2026-06-08 16:25:40'],
    ])
  },
  {
    id: 'T004', type: 'repair', title: '客厅空调制冷效果差',
    description: '客厅挂式空调出风不够凉，已确认遥控器设置正确、滤网已清洗，怀疑缺少氟利昂或压缩机问题。',
    images: [], location: '5栋2单元1502 客厅',
    contactName: '李芳', contactPhone: '139****8866',
    submitterId: 'U002', submitterName: '李芳',
    handlerId: 'H004', handlerName: '赵师傅',
    status: 'assigned', priority: 'urgent',
    createdAt: '2026-06-10 08:05:18', assignedAt: '2026-06-10 08:12:40',
    responseMinutes: 7,
    progress: makeProgress([
      ['P009', 'pending', '已提交报修，紧急工单', '2026-06-10 08:05:18'],
      ['P010', 'assigned', '紧急派单至赵师傅，预计30分钟内到达', '2026-06-10 08:12:40'],
    ])
  },
  {
    id: 'T005', type: 'repair', title: '电梯运行有异响',
    description: '5栋2单元电梯上行至10-12层时有明显机械摩擦异响，偶尔有轻微顿挫，存在安全隐患。',
    images: [], location: '5栋2单元 电梯',
    contactName: '物业值班', contactPhone: '0755-8888****',
    submitterId: 'SYS', submitterName: '日常巡检',
    handlerId: 'H005', handlerName: '电梯维保·刘工',
    status: 'processing', priority: 'urgent',
    createdAt: '2026-06-10 06:30:00', assignedAt: '2026-06-10 06:40:00',
    responseMinutes: 10,
    progress: makeProgress([
      ['P011', 'pending', '巡检发现问题，已创建工单', '2026-06-10 06:30:00'],
      ['P012', 'assigned', '已联系电梯维保单位', '2026-06-10 06:40:00'],
      ['P013', 'processing', '维保人员现场检查中，钢丝绳需润滑调整', '2026-06-10 07:45:00'],
    ])
  },
  {
    id: 'T006', type: 'complaint', title: '3栋门口垃圾清运不及时',
    description: '3栋单元门口垃圾桶满溢严重，厨余垃圾外露气味难闻，夏季易招蚊虫，请增加清运频次。',
    images: ['https://picsum.photos/id/292/600/400'], location: '3栋1单元门口',
    contactName: '匿名业主', contactPhone: '188****0000',
    submitterId: 'U999', submitterName: '匿名业主',
    handlerId: 'H002', handlerName: '李主管',
    status: 'completed', priority: 'medium',
    createdAt: '2026-06-07 18:20:00', assignedAt: '2026-06-07 18:28:00', completedAt: '2026-06-07 19:50:00',
    responseMinutes: 8, handleMinutes: 82,
    satisfaction: 4, comment: '处理速度较快，希望能持续保持',
    progress: makeProgress([
      ['P014', 'pending', '投诉已受理', '2026-06-07 18:20:00'],
      ['P015', 'assigned', '分派环卫组处理', '2026-06-07 18:28:00'],
      ['P016', 'processing', '环卫车已到达，正在清理', '2026-06-07 19:05:00'],
      ['P017', 'completed', '已清理完毕，已安排增加清运频次至每日3次', '2026-06-07 19:50:00'],
    ])
  },
];

export const mockAnnouncements = [
  { id: 'AN001', title: '6月15日停水通知', content: '因市政管网维修，6月15日09:00-15:00全小区将暂停供水，请提前做好储水准备。恢复供水后可能出现短暂水质浑浊，请放水片刻后使用。给您带来不便，敬请谅解！', publisher: '物业管理处', publishTime: '2026-06-09 14:30', level: 'important' as const },
  { id: 'AN002', title: '电梯年度维保公告', content: '5栋、6栋电梯将于6月12日至6月14日分批进行年度安全检测与维保，期间将有部分时段单梯运行，请合理安排出行。', publisher: '物业管理处', publishTime: '2026-06-08 10:00', level: 'normal' as const },
  { id: 'AN003', title: '端午社区文化活动邀您参与', content: '6月11日下午14:00中央花园将举办端午亲子活动，现场有包粽子、做香囊、趣味游戏，所有业主均可免费参与，欢迎带小朋友一起来！', publisher: '业委会', publishTime: '2026-06-07 16:00', level: 'normal' as const },
  { id: 'AN004', title: '【紧急】防诈骗安全提醒', content: '近期小区有业主遭遇冒充客服退款诈骗，请不要点击陌生链接、不要向陌生人转账。如遇可疑情况请立即拨打物业24小时值班电话或110报警。', publisher: '社区警务室', publishTime: '2026-06-06 20:15', level: 'urgent' as const },
];
