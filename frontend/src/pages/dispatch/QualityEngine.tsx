import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Users,
  Truck,
  Clock,
  Play,
  Search,
  Filter,
  ChevronDown,
  Zap,
  Ban,
  AlertTriangle,
  DollarSign,
  Beaker,
  ListChecks,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQualityRules,
  getQualityLogs,
  toggleQualityRule,
  updateQualityRule,
  testQualityRule,
  type QualityRule,
  type QualityLog,
} from '../../services/dispatch.api'

const mockRules: QualityRule[] = [
  {
    id: 'r1',
    name: '破损率超标',
    description: '当服务人员破损率超过阈值时触发自动处理',
    scope: 'all',
    metric: 'damage_rate',
    metricLabel: '破损率',
    operator: 'gt',
    operatorLabel: '大于',
    threshold: 5,
    thresholdMin: 0,
    thresholdMax: 30,
    period: 'week',
    periodLabel: '周',
    action: 'auto_compensate',
    actionLabel: '自动赔付',
    compensateAmount: 200,
    enabled: true,
    hitCount: 23,
    createdAt: '2026-05-01',
    updatedAt: '2026-06-10',
  },
  {
    id: 'r2',
    name: '超时率超标',
    description: '当服务人员超时率超过阈值时触发扣分',
    scope: 'driver',
    metric: 'timeout_rate',
    metricLabel: '超时率',
    operator: 'gt',
    operatorLabel: '大于',
    threshold: 10,
    thresholdMin: 0,
    thresholdMax: 50,
    period: 'month',
    periodLabel: '月',
    action: 'deduct_score',
    actionLabel: '扣分',
    deductScore: 5,
    enabled: true,
    hitCount: 56,
    createdAt: '2026-05-05',
    updatedAt: '2026-06-12',
  },
  {
    id: 'r3',
    name: '差评率超标',
    description: '当差评率超过阈值时触发人工审核',
    scope: 'worker',
    metric: 'bad_rate',
    metricLabel: '差评率',
    operator: 'gt',
    operatorLabel: '大于',
    threshold: 8,
    thresholdMin: 0,
    thresholdMax: 30,
    period: 'rolling_30',
    periodLabel: '滚动30天',
    action: 'review',
    actionLabel: '人工审核',
    enabled: true,
    hitCount: 12,
    createdAt: '2026-05-10',
    updatedAt: '2026-06-08',
  },
  {
    id: 'r4',
    name: '爽约率超标',
    description: '当爽约率超过阈值时自动停牌',
    scope: 'all',
    metric: 'no_show_rate',
    metricLabel: '爽约率',
    operator: 'gte',
    operatorLabel: '大于等于',
    threshold: 3,
    thresholdMin: 0,
    thresholdMax: 20,
    period: 'day',
    periodLabel: '日',
    action: 'suspend',
    actionLabel: '停牌',
    suspendDays: 3,
    enabled: false,
    hitCount: 8,
    createdAt: '2026-05-15',
    updatedAt: '2026-06-01',
  },
  {
    id: 'r5',
    name: '投诉率超标',
    description: '当投诉率超过阈值时触发自动赔付+扣分',
    scope: 'all',
    metric: 'complaint_rate',
    metricLabel: '投诉率',
    operator: 'gt',
    operatorLabel: '大于',
    threshold: 2,
    thresholdMin: 0,
    thresholdMax: 15,
    period: 'week',
    periodLabel: '周',
    action: 'auto_compensate',
    actionLabel: '自动赔付',
    compensateAmount: 100,
    enabled: true,
    hitCount: 18,
    createdAt: '2026-05-20',
    updatedAt: '2026-06-14',
  },
]

const generateMockLogs = (): QualityLog[] => {
  const data: QualityLog[] = []
  const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵敏', '周磊', '吴刚', '郑芳']
  const actions = [
    { action: 'auto_compensate', actionLabel: '自动赔付' },
    { action: 'deduct_score', actionLabel: '扣分' },
    { action: 'suspend', actionLabel: '停牌' },
    { action: 'review', actionLabel: '人工审核' },
  ]
  const statuses: ('pending' | 'executed' | 'failed')[] = ['pending', 'executed', 'failed']

  for (let i = 0; i < 30; i++) {
    const now = new Date()
    now.setHours(now.getHours() - i * 3)
    const action = actions[i % actions.length]
    data.push({
      id: `log-${i + 1}`,
      ruleId: mockRules[i % mockRules.length].id,
      ruleName: mockRules[i % mockRules.length].name,
      targetId: `u-${i}`,
      targetName: names[i % names.length],
      targetType: i % 2 === 0 ? 'worker' : 'driver',
      metricValue: Number((Math.random() * 15 + 5).toFixed(2)),
      threshold: mockRules[i % mockRules.length].threshold,
      action: action.action,
      actionLabel: action.actionLabel,
      compensateAmount: action.action === 'auto_compensate' ? Math.round(100 + Math.random() * 400) : 0,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: now.toISOString(),
      executedAt: Math.random() > 0.3 ? now.toISOString() : undefined,
    })
  }
  return data
}

const PERIOD_OPTIONS = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'rolling_30', label: '滚动30天' },
]

const OPERATOR_OPTIONS = [
  { value: 'gt', label: '大于 (>)' },
  { value: 'gte', label: '大于等于 (≥)' },
  { value: 'lt', label: '小于 (<)' },
  { value: 'lte', label: '小于等于 (≤)' },
  { value: 'eq', label: '等于 (=)' },
]

function ActionBadge({ action }: { action: string }) {
  const config: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    auto_compensate: { icon: DollarSign, color: 'bg-emerald-500/15 text-emerald-400', label: '自动赔付' },
    deduct_score: { icon: Star, color: 'bg-amber-500/15 text-amber-400', label: '扣分' },
    suspend: { icon: Ban, color: 'bg-red-500/15 text-red-400', label: '停牌' },
    review: { icon: AlertTriangle, color: 'bg-purple-500/15 text-purple-400', label: '人工审核' },
  }
  const cfg = config[action] || config.review
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

export default function QualityEngine() {
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules')
  const [testRuleId, setTestRuleId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterRuleType, setFilterRuleType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const queryClient = useQueryClient()

  const { data: rules } = useQuery({
    queryKey: ['quality-rules'],
    queryFn: getQualityRules,
    initialData: mockRules,
  })

  const { data: logs } = useQuery({
    queryKey: ['quality-logs', filterRuleType, filterStatus],
    queryFn: () => getQualityLogs({ ruleType: filterRuleType === 'all' ? undefined : filterRuleType, status: filterStatus === 'all' ? undefined : filterStatus }),
    initialData: { list: generateMockLogs(), total: 30 },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleQualityRule(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-rules'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QualityRule> }) => updateQualityRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-rules'] })
    },
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => testQualityRule(id),
    onMutate: (id) => setTestRuleId(id),
    onSettled: () => setTestRuleId(null),
  })

  const filteredLogs = logs.list.filter((l) => {
    if (searchText && !l.targetName.includes(searchText) && !l.ruleName.includes(searchText)) {
      return false
    }
    if (filterRuleType !== 'all' && l.action !== filterRuleType) return false
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    return true
  })

  return (
    <div className="p-6 min-w-[1440px]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white">质检规则引擎</h1>
        <p className="text-slate-400 mt-1">自动化质检规则配置与命中记录追溯</p>
      </motion.div>

      <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 w-fit mb-6">
        {[
          { value: 'rules', label: '规则配置', icon: ShieldCheck },
          { value: 'logs', label: '命中记录', icon: ListChecks },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as 'rules' | 'logs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'rules' ? (
        <div className="grid grid-cols-2 gap-4">
          {rules.map((rule, idx) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border transition-all ${
                rule.enabled ? 'border-slate-700/50' : 'border-slate-700/20 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white">{rule.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                      rule.scope === 'worker' ? 'bg-cyan-500/15 text-cyan-400' :
                      rule.scope === 'driver' ? 'bg-purple-500/15 text-purple-400' :
                      'bg-slate-500/15 text-slate-300'
                    }`}>
                      {rule.scope === 'worker' ? <Users className="w-3 h-3" /> :
                       rule.scope === 'driver' ? <Truck className="w-3 h-3" /> :
                       <Users className="w-3 h-3" />}
                      {rule.scope === 'worker' ? '工人' : rule.scope === 'driver' ? '司机' : '全部'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{rule.description}</p>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    rule.enabled ? 'bg-cyan-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-900/50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">监控指标</p>
                  <p className="text-sm text-white font-medium">{rule.metricLabel}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">统计周期</p>
                  <p className="text-sm text-white font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {rule.periodLabel}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">执行动作</p>
                  <ActionBadge action={rule.action} />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">触发条件:</span>
                    <span className="text-white font-medium">{rule.metricLabel}</span>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateMutation.mutate({ id: rule.id, data: { operator: e.target.value as QualityRule['operator'] } })}
                      className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      {OPERATOR_OPTIONS.map((op) => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    <span className="text-cyan-400 font-mono font-bold">{rule.threshold}%</span>
                  </div>
                  <span className="text-xs text-slate-500">命中 {rule.hitCount} 次</span>
                </div>
                <input
                  type="range"
                  min={rule.thresholdMin}
                  max={rule.thresholdMax}
                  value={rule.threshold}
                  onChange={(e) => updateMutation.mutate({ id: rule.id, data: { threshold: Number(e.target.value) } })}
                  disabled={!rule.enabled}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-50
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-cyan-500
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-cyan-500/50
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>{rule.thresholdMin}%</span>
                  <span>{rule.thresholdMax}%</span>
                </div>
              </div>

              {rule.action === 'auto_compensate' && rule.compensateAmount !== undefined && (
                <div className="mb-4 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">自动赔付金额:</span>
                    <span className="text-emerald-400 font-mono font-bold">¥{rule.compensateAmount}</span>
                  </div>
                </div>
              )}
              {rule.action === 'deduct_score' && rule.deductScore !== undefined && (
                <div className="mb-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">信用分扣除:</span>
                    <span className="text-amber-400 font-mono font-bold">-{rule.deductScore} 分</span>
                  </div>
                </div>
              )}
              {rule.action === 'suspend' && rule.suspendDays !== undefined && (
                <div className="mb-4 p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Ban className="w-4 h-4 text-red-400" />
                    <span className="text-slate-300">停牌天数:</span>
                    <span className="text-red-400 font-mono font-bold">{rule.suspendDays} 天</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">
                  更新于 {rule.updatedAt}
                </span>
                <button
                  onClick={() => testMutation.mutate(rule.id)}
                  disabled={testMutation.isLoading && testRuleId === rule.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs font-medium hover:bg-slate-600/50 hover:text-white transition-colors disabled:opacity-50"
                >
                  {testMutation.isLoading && testRuleId === rule.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Beaker className="w-3.5 h-3.5" />
                  )}
                  测试规则
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索规则、人员..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors w-56"
                />
              </div>

              <Filter className="w-4 h-4 text-slate-500" />

              <div className="relative">
                <select
                  value={filterRuleType}
                  onChange={(e) => setFilterRuleType(e.target.value)}
                  className="appearance-none pl-4 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors min-w-[130px]"
                >
                  <option value="all">全部动作</option>
                  <option value="auto_compensate">自动赔付</option>
                  <option value="deduct_score">扣分</option>
                  <option value="suspend">停牌</option>
                  <option value="review">人工审核</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-4 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors min-w-[130px]"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待执行</option>
                  <option value="executed">已执行</option>
                  <option value="failed">执行失败</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <span className="text-sm text-slate-400">
              共 <span className="text-white font-mono font-medium">{filteredLogs.length}</span> 条记录
            </span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-400 bg-slate-900/30 border-b border-slate-700/50">
                    <th className="py-3.5 px-5 font-medium">时间</th>
                    <th className="py-3.5 px-4 font-medium">规则名称</th>
                    <th className="py-3.5 px-4 font-medium">命中对象</th>
                    <th className="py-3.5 px-4 font-medium text-right">指标值</th>
                    <th className="py-3.5 px-4 font-medium text-right">阈值</th>
                    <th className="py-3.5 px-4 font-medium">执行动作</th>
                    <th className="py-3.5 px-4 font-medium text-right">赔付金额</th>
                    <th className="py-3.5 px-5 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="border-b border-slate-700/30 last:border-b-0 hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <p className="text-sm text-white font-mono">
                          {new Date(log.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-white font-medium">{log.ruleName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                            log.targetType === 'worker' ? 'bg-cyan-500/30 text-cyan-400' : 'bg-purple-500/30 text-purple-400'
                          }`}>
                            {log.targetName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-white">{log.targetName}</p>
                            <p className="text-xs text-slate-500">
                              {log.targetType === 'worker' ? '工人' : '司机'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-mono font-semibold text-orange-400">{log.metricValue}%</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-mono text-slate-400">{log.threshold}%</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {log.compensateAmount > 0 ? (
                          <span className="text-sm font-mono font-semibold text-emerald-400">
                            ¥{log.compensateAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                          log.status === 'executed' ? 'bg-emerald-500/15 text-emerald-400' :
                          log.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {log.status === 'executed' ? <CheckCircle2 className="w-3 h-3" /> :
                           log.status === 'pending' ? <Clock className="w-3 h-3" /> :
                           <XCircle className="w-3 h-3" />}
                          {log.status === 'executed' ? '已执行' : log.status === 'pending' ? '待执行' : '失败'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
