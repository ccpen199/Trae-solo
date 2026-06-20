import { useState, useMemo } from 'react'
import {
  MessageSquareWarning,
  Loader,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Building2,
  Clock,
  FileText,
  UserCircle,
  ClipboardList,
  CheckCircle,
  Circle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import StatusBadge from '../../components/StatusBadge'
import { complaintRecords } from '../../data/mockData'
import type { ComplaintRecord, ChainStep, TimelineEvent, ReviewRecord } from '../../types'

const statusFilterOptions = [
  { value: '', label: '全部状态' },
  { value: 'submitted', label: '已提交' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已闭环' },
]

const complaintTypeMap: Record<string, string> = {
  service_quality: '服务质量',
  subsidy: '补贴问题',
  facility: '设施问题',
  personnel: '人员问题',
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

const reviewResultMap: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  satisfied: { label: '满意', color: 'text-green-600 bg-green-50', icon: <ThumbsUp className="w-4 h-4" /> },
  normal: { label: '一般', color: 'text-yellow-600 bg-yellow-50', icon: <Minus className="w-4 h-4" /> },
  dissatisfied: { label: '不满意', color: 'text-red-600 bg-red-50', icon: <ThumbsDown className="w-4 h-4" /> },
}

function ChainStepNode({ step, isLast }: { step: ChainStep; isLast: boolean }) {
  const statusConfig = {
    completed: { dot: 'bg-green-500', line: 'bg-green-300', text: 'text-slate-700' },
    active: { dot: 'bg-blue-500 animate-pulse', line: 'bg-slate-200', text: 'text-blue-700 font-medium' },
    pending: { dot: 'bg-slate-300', line: 'bg-slate-200', text: 'text-slate-400' },
  }[step.status]

  return (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        <div className={`w-3 h-3 rounded-full ${statusConfig.dot} ring-2 ring-white shadow-sm`} />
        {!isLast && <div className={`w-0.5 flex-1 mt-1 ${statusConfig.line}`} style={{ minHeight: '48px' }} />
      </div>
      <div className="flex-1 pb-4">
        <div className={`text-sm ${statusConfig.text}`}>{step.label}</div>
        {step.handler && <div className="text-xs text-slate-500 mt-0.5">处理人：{step.handler}</div>}
        {step.time && <div className="text-xs text-slate-400 mt-0.5">{step.time}</div>}
        {step.remark && <div className="text-xs text-slate-500 mt-1 bg-slate-50 rounded px-2 py-1">{step.remark}</div>}
      </div>
    </div>
  )
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  return (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-100" />
        <div className="w-0.5 flex-1 bg-slate-200 mt-1" style={{ minHeight: '40px' }} />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-700">{event.title}</span>
          <span className="text-xs text-slate-400">{event.time}</span>
        </div>
        <div className="text-xs text-slate-500 mb-0.5">操作人：{event.operator}</div>
        <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{event.detail}</div>
      </div>
    </div>
  )
}

function ReviewItem({ review }: { review: ReviewRecord }) {
  const config = reviewResultMap[review.result]
  return (
    <div className="border border-slate-100 rounded-lg p-4 bg-slate-25">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{review.reviewer}</span>
          <span className="text-xs text-slate-400">{review.time}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.icon}
          {config.label}
        </span>
      </div>
      <p className="text-sm text-slate-600">{review.content}</p>
    </div>
  )
}

export default function ComplaintManagement() {
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null)
  const [resolutionText, setResolutionText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return complaintRecords.filter((c: ComplaintRecord) => {
      if (statusFilter && c.status !== statusFilter) return false
      return true
    })
  }, [statusFilter])

  const totalComplaints = complaintRecords.length
  const processingCount = complaintRecords.filter((c) => c.status === 'processing' || c.status === 'submitted').length
  const closedRate = Math.round(
    (complaintRecords.filter((c) => c.status === 'resolved' || c.status === 'closed').length / complaintRecords.length) * 100
  )

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {}
    complaintRecords.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1
    })
    return Object.entries(counts).map(([key, value]) => ({
      name: complaintTypeMap[key] || key,
      value,
    }))
  }, [])

  const institutionRankData = useMemo(() => {
    const counts: Record<string, number> = {}
    complaintRecords.forEach((c) => {
      if (c.institutionName) {
        counts[c.institutionName] = (counts[c.institutionName] || 0) + 1
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [])

  const handleProcess = (complaint: ComplaintRecord) => {
    setSelectedComplaint(complaint)
    setResolutionText(complaint.resolution || '')
    setModalOpen(true)
  }

  const handleSubmit = () => {
    if (!resolutionText.trim()) return
    setModalOpen(false)
    setResolutionText('')
    setSelectedComplaint(null)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getClosureRateColor = (rate: number) => {
    if (rate >= 100) return 'from-green-400 to-green-500'
    if (rate >= 60) return 'from-blue-400 to-blue-500'
    return 'from-yellow-400 to-yellow-500'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">服务质量投诉闭环管理</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquareWarning className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-slate-500 font-medium">本月投诉数</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{totalComplaints}</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Loader className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-500 font-medium">处理中</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{processingCount}</span>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-500 font-medium">已闭环率</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{closedRate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-500" />
            投诉类型分布
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`${value} 件`, '投诉数']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-500" />
            责任方投诉排行
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={institutionRankData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`${value} 件`, '投诉数']}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {statusFilterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">共 {filtered.length} 条记录</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-3 py-3 font-medium w-8"></th>
                <th className="px-3 py-3 font-medium">编号</th>
                <th className="px-3 py-3 font-medium">投诉人</th>
                <th className="px-3 py-3 font-medium">类型</th>
                <th className="px-3 py-3 font-medium">责任机构</th>
                <th className="px-3 py-3 font-medium">处理人</th>
                <th className="px-3 py-3 font-medium">状态</th>
                <th className="px-3 py-3 font-medium">闭环率</th>
                <th className="px-3 py-3 font-medium">处理时长</th>
                <th className="px-3 py-3 font-medium">提交时间</th>
                <th className="px-3 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: ComplaintRecord) => (
                <>
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-25 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(c.id)}
                  >
                    <td className="px-3 py-3">
                      {expandedId === c.id ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 font-mono">{c.id}</td>
                    <td className="px-3 py-3 text-sm text-slate-700 font-medium">{c.elderName}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{complaintTypeMap[c.type]}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.institutionName || '-'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.handler || '-'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={c.status} type="complaint" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getClosureRateColor(c.closureRate || 0)} rounded-full transition-all`}
                            style={{ width: `${c.closureRate || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{c.closureRate || 0}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.processingDuration || '-'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-400">{c.createdAt.slice(0, 10)}</td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {(c.status === 'submitted' || c.status === 'processing') && (
                          <button
                            onClick={() => handleProcess(c)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            处理
                          </button>
                        )}
                        {(c.status === 'resolved' || c.status === 'closed') && c.resolution && (
                          <span className="text-xs text-green-600 cursor-help" title={c.resolution}>
                            已回复
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="bg-slate-25/50">
                      <td colSpan={11} className="px-6 py-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-5">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                投诉详情
                              </h4>
                              <div className="bg-white border border-slate-100 rounded-lg p-4">
                                <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
                                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                                  <a
                                    href={`/government/elders/${c.elderId}`}
                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                                  >
                                    <UserCircle className="w-3.5 h-3.5" />
                                    关联老人档案
                                  </a>
                                  {c.relatedOrderId && (
                                    <a
                                      href={`/government/orders/${c.relatedOrderId}`}
                                      className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800 font-medium px-2.5 py-1 rounded-md bg-orange-50 hover:bg-orange-100 transition-colors"
                                    >
                                      <ClipboardList className="w-3.5 h-3.5" />
                                      关联工单 {c.relatedOrderId}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                闭环责任链
                              </h4>
                              <div className="bg-white border border-slate-100 rounded-lg p-4">
                                {c.chain?.map((step, index) => (
                                  <ChainStepNode
                                    key={step.key}
                                    step={step}
                                    isLast={index === (c.chain?.length || 0) - 1}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-5">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-purple-500" />
                                处理时间线
                              </h4>
                              <div className="bg-white border border-slate-100 rounded-lg p-4 max-h-80 overflow-y-auto">
                                {c.timeline && c.timeline.length > 0 ? (
                                  c.timeline.map((event, index) => (
                                    <TimelineItem key={index} event={event} />
                                  ))
                                ) : (
                                  <div className="text-center py-8 text-slate-400 text-sm">
                                    <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    暂无处理记录
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                复查记录
                              </h4>
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {c.reviews && c.reviews.length > 0 ? (
                                  c.reviews.map((review) => (
                                    <ReviewItem key={review.id} review={review} />
                                  ))
                                ) : (
                                  <div className="bg-white border border-slate-100 rounded-lg p-6 text-center text-slate-400 text-sm">
                                    <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    暂无复查记录
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">处理投诉 - {selectedComplaint.id}</h3>
              <button
                onClick={() => {
                  setModalOpen(false)
                  setSelectedComplaint(null)
                  setResolutionText('')
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">投诉人</div>
                <div className="text-sm text-slate-800">{selectedComplaint.elderName}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">投诉内容</div>
                <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selectedComplaint.content}</div>
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">处理意见</label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  placeholder="请输入处理意见..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setModalOpen(false)
                  setSelectedComplaint(null)
                  setResolutionText('')
                }}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={!resolutionText.trim()}
              >
                提交处理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
