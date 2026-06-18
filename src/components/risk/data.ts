export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'
export type AlertStatus = 'pending' | 'processed' | 'ignored'
export type RuleAction = 'intercept' | 'warning' | 'manual_review'

export interface RiskAlert {
  id: string
  description: string
  user: string
  amount: string
  severity: SeverityLevel
  status: AlertStatus
  time: string
}

export interface RiskRule {
  id: string
  name: string
  code: string
  severity: SeverityLevel
  action: RuleAction
  enabled: boolean
  condition: string
}

export const severityConfig: Record<SeverityLevel, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: '严重', color: 'text-danger', bg: 'bg-danger', dot: 'bg-danger' },
  high: { label: '高', color: 'text-warning', bg: 'bg-warning', dot: 'bg-warning' },
  medium: { label: '中', color: 'text-yellow-600', bg: 'bg-yellow-500', dot: 'bg-yellow-500' },
  low: { label: '低', color: 'text-primary', bg: 'bg-primary', dot: 'bg-primary' },
}

export const statusConfig: Record<AlertStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-danger/10 text-danger' },
  processed: { label: '已处理', className: 'bg-success/10 text-success' },
  ignored: { label: '已忽略', className: 'bg-gray-100 text-gray-500' },
}

export const actionLabels: Record<RuleAction, string> = {
  intercept: '自动拦截',
  warning: '预警提醒',
  manual_review: '人工审核',
}

export const mockAlerts: RiskAlert[] = [
  { id: '1', description: '跨地区重复领取养老金', user: '张三', amount: '3200元/月', severity: 'critical', status: 'pending', time: '2024-06-18 09:15' },
  { id: '2', description: '已死亡人员待遇发放', user: '李四', amount: '2800元/月', severity: 'critical', status: 'pending', time: '2024-06-18 08:42' },
  { id: '3', description: '缴费基数异常波动', user: '王五', amount: '15000元', severity: 'medium', status: 'pending', time: '2024-06-18 08:10' },
  { id: '4', description: '同一账号多地登录', user: '赵六', amount: '-', severity: 'high', status: 'pending', time: '2024-06-17 22:35' },
  { id: '5', description: '重复领取失业金', user: '钱七', amount: '1800元/月', severity: 'high', status: 'processed', time: '2024-06-17 16:20' },
  { id: '6', description: '死亡停发自动触发', user: '孙八', amount: '3200元/月', severity: 'critical', status: 'processed', time: '2024-06-17 14:05' },
  { id: '7', description: '待遇发放金额异常', user: '周九', amount: '8500元', severity: 'medium', status: 'pending', time: '2024-06-17 11:30' },
  { id: '8', description: '疑似冒领养老金', user: '吴十', amount: '2600元/月', severity: 'high', status: 'ignored', time: '2024-06-16 17:50' },
]

export const mockRules: RiskRule[] = [
  {
    id: 'r1',
    name: '跨地区重复领取养老金',
    code: 'duplicate_receipt',
    severity: 'critical',
    action: 'intercept',
    enabled: true,
    condition: '同一身份证号在不同统筹区同时领取养老金 AND 领取时长 > 3个月',
  },
  {
    id: 'r2',
    name: '已死亡人员待遇发放',
    code: 'death_stop',
    severity: 'critical',
    action: 'intercept',
    enabled: true,
    condition: '人员状态=已死亡 AND 当月仍有待遇发放记录',
  },
  {
    id: 'r3',
    name: '缴费基数异常波动',
    code: 'abnormal_payment',
    severity: 'medium',
    action: 'warning',
    enabled: true,
    condition: '缴费基数环比变化 > 50% OR 缴费基数偏离行业均值 > 2倍标准差',
  },
  {
    id: 'r4',
    name: '同一账号多地登录',
    code: 'suspicious_behavior',
    severity: 'high',
    action: 'manual_review',
    enabled: true,
    condition: '同一账号24小时内登录IP跨越不同省份 AND 操作涉及待遇申领',
  },
]
