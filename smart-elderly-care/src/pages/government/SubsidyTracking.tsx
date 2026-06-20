import { useState } from 'react'
import {
  Wallet,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Building2,
  Home,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Circle,
  FileText,
  ClipboardList,
  PenTool,
  AlertCircle,
  Search,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import StatusBadge from '../../components/StatusBadge'
import { subsidyRecords, serviceOrders, nursingPlans } from '../../data/mockData'
import type { SubsidyRecord, AuditEntry } from '../../types'

const tabs = [
  { key: 'pension', label: '高龄津贴' },
  { key: 'disability', label: '失能补贴' },
  { key: 'nursing', label: '护理补贴' },
  { key: 'medical', label: '医疗救助' },
] as const

const reviewTabs = [
  { key: 'pending', label: '待复查' },
  { key: 'completed', label: '已复查' },
] as const

const mainTabs = [
  { key: 'records', label: '补贴记录' },
  { key: 'review', label: '复查记录' },
] as const

const timelineSteps = [
  { key: 'apply', label: '申请' },
  { key: 'initial', label: '初审' },
  { key: 'review', label: '复核' },
  { key: 'approve', label: '审批' },
  { key: 'disburse', label: '发放' },
  { key: 'confirm', label: '到账确认' },
  { key: 'audit', label: '复查留痕' },
] as const

function getProgress(status: SubsidyRecord['status'], trailLength: number) {
  if (status === 'disbursed') return 100
  if (status === 'approved') return 75
  if (status === 'pending') return Math.min(trailLength * 25, 50)
  if (status === 'rejected') return trailLength * 20
  return 0
}

function getProgressColor(progress: number) {
  if (progress >= 100) return 'bg-blue-500'
  if (progress >= 75) return 'bg-green-500'
  if (progress >= 50) return 'bg-yellow-500'
  return 'bg-orange-500'
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getStepStatus(auditTrail: AuditEntry[], stepKey: string) {
  const stepActionMap: Record<string, string[]> = {
    apply: ['提交申请'],
    initial: ['初审通过', '已受理', '材料补正通知'],
    review: ['评估完成', '复审通过'],
    approve: ['审批通过', '审批驳回'],
    disburse: ['发放完成'],
    confirm: ['到账确认'],
    audit: ['复查留痕'],
  }
  const actions = stepActionMap[stepKey] || []
  const entry = auditTrail.find((e) => actions.some((a) => e.action.includes(a)))
  if (entry) {
    if (entry.action.includes('驳回') || entry.action.includes('补正')) {
      return { status: 'rejected', entry }
    }
    return { status: 'completed', entry }
  }
  return { status: 'pending', entry: null }
}

const subsidyTypeNames: Record<string, string> = {
  pension: '高龄津贴',
  disability: '失能补贴',
  nursing: '护理补贴',
  medical: '医疗救助',
}

const reviewRecords = [
  {
    id: 'RR001',
    subsidyId: 'SR001',
    elderName: '王建国',
    type: 'pension',
    amount: 3600,
    status: 'completed',
    reviewer: '张督察',
    reviewedAt: '2026-02-10T14:30:00',
    result: '通过',
    notes: '材料齐全，发放流程合规',
  },
  {
    id: 'RR002',
    subsidyId: 'SR002',
    elderName: '张秀兰',
    type: 'nursing',
    amount: 7200,
    status: 'completed',
    reviewer: '李督察',
    reviewedAt: '2026-03-15T10:00:00',
    result: '通过',
    notes: '失能等级评估准确，补贴金额无误',
  },
  {
    id: 'RR003',
    subsidyId: 'SR004',
    elderName: '刘桂芳',
    type: 'pension',
    amount: 2400,
    status: 'completed',
    reviewer: '王督察',
    reviewedAt: '2026-02-20T09:30:00',
    result: '通过',
    notes: '符合发放条件，流程规范',
  },
  {
    id: 'RR004',
    subsidyId: 'SR006',
    elderName: '陈志强',
    type: 'pension',
    amount: 3600,
    status: 'pending',
    reviewer: '',
    reviewedAt: '',
    result: '',
    notes: '等待复查',
  },
  {
    id: 'RR005',
    subsidyId: 'SR007',
    elderName: '孙玉华',
    type: 'disability',
    amount: 1800,
    status: 'pending',
    reviewer: '',
    reviewedAt: '',
    result: '',
    notes: '驳回申请需复核',
  },
  {
    id: 'RR006',
    subsidyId: 'SR009',
    elderName: '赵福来',
    type: 'pension',
    amount: 1200,
    status: 'pending',
    reviewer: '',
    reviewedAt: '',
    result: '',
    notes: '等待复查',
  },
]

export default function SubsidyTracking() {
  const [activeMainTab, setActiveMainTab] = useState<string>('records')
  const [activeTab, setActiveTab] = useState<string>('pension')
  const [activeReviewTab, setActiveReviewTab] = useState<string>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showVerifyModal, setShowVerifyModal] = useState<string | null>(null)

  const filtered = subsidyRecords.filter((r: SubsidyRecord) => r.type === activeTab)
  const filteredReviews = reviewRecords.filter((r) => r.status === activeReviewTab)

  const totalDisbursed = subsidyRecords
    .filter((r) => r.status === 'disbursed')
    .reduce((sum, r) => sum + r.amount, 0)
  const pendingCount = subsidyRecords.filter((r) => r.status === 'pending').length
  const precisionRate = 96.5

  const chartData = [
    { name: '1月', pension: 12500, disability: 8200, nursing: 15600, medical: 9800 },
    { name: '2月', pension: 13200, disability: 9100, nursing: 16800, medical: 10500 },
    { name: '3月', pension: 14500, disability: 8800, nursing: 17200, medical: 11200 },
    { name: '4月', pension: 13800, disability: 9500, nursing: 18500, medical: 12000 },
    { name: '5月', pension: 15200, disability: 10200, nursing: 19000, medical: 11800 },
    { name: '6月', pension: 16000, disability: 11000, nursing: 20500, medical: 13200 },
  ]

  const precisionData = [
    { name: '1月', rate: 94.2 },
    { name: '2月', rate: 95.1 },
    { name: '3月', rate: 94.8 },
    { name: '4月', rate: 96.0 },
    { name: '5月', rate: 96.2 },
    { name: '6月', rate: 96.5 },
  ]

  const getRelatedOrders = (elderName: string) => {
    return serviceOrders.filter((o) => o.elderName === elderName).slice(0, 3)
  }

  const getRelatedPlans = (elderName: string) => {
    return nursingPlans.filter((p) => p.elderName === elderName).slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">补贴发放精准追踪</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-500 font-medium">本月发放总额</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">¥{totalDisbursed.toLocaleString()}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-slate-500 font-medium">待审批数</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{pendingCount}</span>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-500 font-medium">发放精准率</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{precisionRate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">各补贴类型发放对比</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="pension" name="高龄津贴" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="disability" name="失能补贴" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="nursing" name="护理补贴" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="medical" name="医疗救助" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">发放精准度趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={precisionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, '精准度']}
              />
              <Line
                type="monotone"
                dataKey="rate"
                name="发放精准度"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex border-b border-slate-100">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className={`px-6 py-3.5 text-sm font-medium transition-colors relative ${
                activeMainTab === tab.key
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeMainTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {activeMainTab === 'records' ? (
          <>
            <div className="flex border-b border-slate-100 px-5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">暂无记录</div>
            ) : (
              <div className="space-y-4 p-5">
                {filtered.map((r: SubsidyRecord) => {
                  const progress = getProgress(r.status, r.auditTrail.length)
                  const isExpanded = expandedId === r.id
                  const relatedOrders = getRelatedOrders(r.elderName)
                  const relatedPlans = getRelatedPlans(r.elderName)

                  return (
                    <div
                      key={r.id}
                      className="border border-slate-100 rounded-lg hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                              {r.elderName.slice(0, 1)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">{r.elderName}</div>
                              <div className="text-xs text-slate-400">{r.id}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={r.status} type="subsidy" />
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-slate-800">¥{r.amount.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">申请日期: {r.appliedDate}</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>审计进度</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50 p-5 space-y-6">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              资金流向时间线
                            </h4>
                            <div className="relative">
                              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                              <div className="space-y-4">
                                {timelineSteps.map((step, idx) => {
                                  const { status, entry } = getStepStatus(r.auditTrail, step.key)
                                  return (
                                    <div key={step.key} className="relative flex gap-4 pl-10">
                                      <div
                                        className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                                          status === 'completed'
                                            ? 'bg-green-500 text-white'
                                            : status === 'rejected'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-slate-200 text-slate-400'
                                        }`}
                                      >
                                        {status === 'completed' ? (
                                          <CheckCircle2 className="w-3 h-3" />
                                        ) : status === 'rejected' ? (
                                          <AlertCircle className="w-3 h-3" />
                                        ) : (
                                          <Circle className="w-3 h-3" />
                                        )}
                                      </div>
                                      <div className="flex-1 bg-white rounded-lg p-3 border border-slate-100">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium text-slate-700">
                                            {idx + 1}. {step.label}
                                          </span>
                                          {entry && (
                                            <span className="text-xs text-slate-400">
                                              {formatDateTime(entry.timestamp)}
                                            </span>
                                          )}
                                        </div>
                                        {entry ? (
                                          <>
                                            <div className="text-xs text-slate-600 mb-1">
                                              <span className="text-slate-400">处理人：</span>
                                              {entry.operator}
                                            </div>
                                            <div className="text-xs text-slate-600">
                                              <span className="text-slate-400">意见：</span>
                                              {entry.details}
                                            </div>
                                          </>
                                        ) : (
                                          <div className="text-xs text-slate-400">等待处理</div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-green-500" />
                              资金流向追溯路径
                            </h4>
                            <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-slate-100">
                              <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                  <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">民政局</span>
                                <span className="text-xs text-slate-400">补贴发放</span>
                              </div>
                              <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                              <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                                  <Home className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">养老机构</span>
                                <span className="text-xs text-slate-400">服务结算</span>
                              </div>
                              <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                              <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                                  <CreditCard className="w-6 h-6 text-orange-600" />
                                </div>
                                <span className="text-xs font-medium text-slate-700">个人银行账户</span>
                                <span className="text-xs text-slate-400">补贴到账</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                              <Search className="w-4 h-4 text-purple-500" />
                              服务真实性核验
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowVerifyModal(`${r.id}-orders`)
                                }}
                                className="flex items-center gap-3 bg-white rounded-lg p-4 border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <ClipboardList className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-700">工单记录</div>
                                  <div className="text-xs text-slate-400">{relatedOrders.length} 条关联记录</div>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowVerifyModal(`${r.id}-plans`)
                                }}
                                className="flex items-center gap-3 bg-white rounded-lg p-4 border border-slate-100 hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-700">护理记录</div>
                                  <div className="text-xs text-slate-400">{relatedPlans.length} 条护理方案</div>
                                </div>
                              </button>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-3 bg-white rounded-lg p-4 border border-slate-100 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                  <PenTool className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-700">电子签名</div>
                                  <div className="text-xs text-slate-400">查看签名凭证</div>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {showVerifyModal === `${r.id}-orders` && (
                        <div className="border-t border-slate-100 bg-blue-50 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-semibold text-slate-700">关联工单记录 - {r.elderName}</h5>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowVerifyModal(null)
                              }}
                              className="text-xs text-slate-500 hover:text-slate-700"
                            >
                              关闭
                            </button>
                          </div>
                          {relatedOrders.length > 0 ? (
                            <div className="space-y-2">
                              {relatedOrders.map((order) => (
                                <div key={order.id} className="bg-white rounded-lg p-3 border border-slate-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-700">{order.id}</span>
                                    <StatusBadge status={order.status} type="order" />
                                  </div>
                                  <div className="text-xs text-slate-600">
                                    <span className="text-slate-400">服务类型：</span>
                                    {order.type === 'bathing' && '助浴服务'}
                                    {order.type === 'medical_escort' && '就医陪诊'}
                                    {order.type === 'meal_delivery' && '送餐服务'}
                                    {order.type === 'companionship' && '陪伴服务'}
                                    {order.type === 'rehabilitation' && '康复训练'}
                                    {order.type === 'cleaning' && '保洁服务'}
                                    <span className="mx-2">|</span>
                                    <span className="text-slate-400">服务人员：</span>
                                    {order.serviceProviderName}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1">
                                    预约时间：{formatDateTime(order.scheduledTime)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-slate-400 text-sm py-4">暂无关联工单</div>
                          )}
                        </div>
                      )}

                      {showVerifyModal === `${r.id}-plans` && (
                        <div className="border-t border-slate-100 bg-green-50 p-5">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-semibold text-slate-700">关联护理记录 - {r.elderName}</h5>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowVerifyModal(null)
                              }}
                              className="text-xs text-slate-500 hover:text-slate-700"
                            >
                              关闭
                            </button>
                          </div>
                          {relatedPlans.length > 0 ? (
                            <div className="space-y-2">
                              {relatedPlans.map((plan) => (
                                <div key={plan.id} className="bg-white rounded-lg p-3 border border-slate-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-700">{plan.planName}</span>
                                    <StatusBadge status={plan.status} type="plan" />
                                  </div>
                                  <div className="text-xs text-slate-600 mb-2">
                                    <span className="text-slate-400">有效期：</span>
                                    {plan.startDate} 至 {plan.endDate}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    <span className="text-slate-400">包含任务：</span>
                                    {plan.tasks.map((t) => t.content).join('、')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-slate-400 text-sm py-4">暂无关联护理记录</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex border-b border-slate-100 px-5">
              {reviewTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveReviewTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeReviewTab === tab.key
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500">
                    {reviewRecords.filter((r) => r.status === tab.key).length}
                  </span>
                  {activeReviewTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>

            {filteredReviews.length === 0 ? (
              <div className="py-16 text-center text-slate-400">暂无记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        复查编号
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        老人姓名
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        补贴类型
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        补贴金额
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        复查人
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        复查时间
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        复查结果
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        备注
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-800">
                          {review.id}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                          {review.elderName}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                          {subsidyTypeNames[review.type]}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                          ¥{review.amount.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                          {review.reviewer || '-'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                          {review.reviewedAt ? formatDateTime(review.reviewedAt) : '-'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              review.result === '通过'
                                ? 'bg-green-100 text-green-700'
                                : review.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {review.result || '待复查'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500 max-w-xs truncate">
                          {review.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
