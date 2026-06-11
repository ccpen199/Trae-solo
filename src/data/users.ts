import type { Worker, Employer, Admin, EarningsBroadcast } from '@/types'

export const currentWorker: Worker = {
  id: 'W001',
  phone: '138****6789',
  name: '张小美',
  role: 'worker',
  realNameVerified: true,
  completedTasks: 23,
  totalEarnings: 2856.5,
  withdrawableBalance: 856.5,
  dailyWithdrawn: 0,
  commissionLevel: 2,
}

export const currentEmployer: Employer = {
  id: 'E001',
  phone: '139****1234',
  name: '慧研科技',
  role: 'employer',
  businessLicense: 'BL-2024-001',
  bankAccountVerified: true,
  depositBalance: 50000,
  certificationStatus: 'approved',
  publishedTasks: 15,
  totalDisbursed: 128600,
}

export const currentAdmin: Admin = {
  id: 'A001',
  name: '平台管理员',
  role: 'admin',
}

export const earningsBroadcasts: EarningsBroadcast[] = [
  { id: 'EB01', userName: '刘**', amount: 8.0, taskTitle: '电商平台用户满意度问卷填写', time: '1分钟前' },
  { id: 'EB02', userName: '王**', amount: 35.0, taskTitle: '餐厅菜品图片标注分类', time: '3分钟前' },
  { id: 'EB03', userName: '陈**', amount: 6.9, taskTitle: '社区团购满意度调研', time: '5分钟前' },
  { id: 'EB04', userName: '李**', amount: 60.0, taskTitle: '短视频内容合规审核', time: '8分钟前' },
  { id: 'EB05', userName: '赵**', amount: 150.0, taskTitle: '公众号文章撰写', time: '12分钟前' },
  { id: 'EB06', userName: '孙**', amount: 25.0, taskTitle: '商品信息录入校验', time: '15分钟前' },
  { id: 'EB07', userName: '周**', amount: 40.0, taskTitle: '在线教育课程体验评测', time: '18分钟前' },
  { id: 'EB08', userName: '吴**', amount: 500.0, taskTitle: '企业品牌LOGO设计方案', time: '22分钟前' },
  { id: 'EB09', userName: '郑**', amount: 30.0, taskTitle: '社交媒体文案编写', time: '25分钟前' },
  { id: 'EB10', userName: '黄**', amount: 180.0, taskTitle: '电商商品图片精修', time: '30分钟前' },
]
