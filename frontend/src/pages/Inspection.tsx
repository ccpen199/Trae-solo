import { useState } from 'react'
import { mockInspectionIssues } from '@/store/platformStore'
import { usePlatformStore } from '@/store/platformStore'
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  MapPin,
  Plus,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Wrench,
  RotateCcw,
  Box,
} from 'lucide-react'

const rooms = ['客厅', '主卧', '次卧', '厨房', '卫生间', '阳台']
const severityConfig: Record<string, { color: string; bg: string }> = {
  严重: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  一般: { color: 'text-warn-600 dark:text-warn-400', bg: 'bg-warn-100 dark:bg-warn-900/30' },
  轻微: { color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-100 dark:bg-brand-900/30' },
}
const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  待整改: { color: 'badge-warn', icon: AlertTriangle },
  整改中: { color: 'badge-brand', icon: Wrench },
  已整改: { color: 'badge-accent', icon: CheckCircle2 },
  已验收: { color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400', icon: CheckCircle2 },
}

export default function Inspection() {
  const { inspectionRoom, setInspectionRoom } = usePlatformStore()
  const [showAddIssue, setShowAddIssue] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string>('全部')
  const [filterStatus, setFilterStatus] = useState<string>('全部')
  const [hoveredPin, setHoveredPin] = useState<string | null>(null)

  const roomIssues = mockInspectionIssues.filter((i) => i.room === inspectionRoom)
  const filteredIssues = roomIssues.filter((i) => {
    if (filterSeverity !== '全部' && i.severity !== filterSeverity) return false
    if (filterStatus !== '全部' && i.status !== filterStatus) return false
    return true
  })

  const activeIssue = selectedIssue ? mockInspectionIssues.find((i) => i.id === selectedIssue) : null

  const stats = {
    total: roomIssues.length,
    pending: roomIssues.filter((i) => i.status === '待整改').length,
    inProgress: roomIssues.filter((i) => i.status === '整改中').length,
    done: roomIssues.filter((i) => i.status === '已整改' || i.status === '已验收').length,
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-title">验收系统</h1>
          <p className="mt-1 text-surface-500">AR实景标注问题，整改项自动进入待办清单</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddIssue(true)}>
          <Plus size={16} className="mr-1.5" /> 标注问题
        </button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => { setInspectionRoom(room); setSelectedIssue(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              inspectionRoom === room
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
            }`}
          >
            {room}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={16} className="text-surface-500" />
            <span className="text-sm text-surface-500">问题总数</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-warn-500" />
            <span className="text-sm text-surface-500">待整改</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-warn-600 dark:text-warn-400">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-brand-500" />
            <span className="text-sm text-surface-500">整改中</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-accent-500" />
            <span className="text-sm text-surface-500">已完成</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-accent-600 dark:text-accent-400">{stats.done}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-brand-500" />
                <span className="font-medium text-surface-900 dark:text-white">
                  {inspectionRoom} - AR实景标注
                </span>
                <span className="badge-brand">模拟视图</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary p-1.5" title="旋转视角">
                  <RotateCcw size={14} />
                </button>
                <button className="btn-secondary p-1.5" title="3D视图">
                  <Box size={14} />
                </button>
              </div>
            </div>
            <div className="relative bg-gradient-to-b from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-900" style={{ height: 420 }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[85%] h-[85%] bg-white dark:bg-surface-700 rounded-lg shadow-xl border border-surface-200 dark:border-surface-600 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:from-surface-600 dark:via-surface-700 dark:to-surface-600">
                    <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-stone-200 to-stone-100 dark:from-stone-800 dark:to-stone-700" />
                    <div className="absolute bottom-[20%] left-[5%] w-[30%] h-[50%] bg-gradient-to-t from-stone-100 to-transparent border-l-2 border-b-2 border-surface-300 dark:border-surface-500 dark:from-stone-700" />
                    <div className="absolute bottom-[20%] right-[5%] w-[25%] h-[45%] bg-gradient-to-t from-stone-100 to-transparent border-r-2 border-b-2 border-surface-300 dark:border-surface-500 dark:from-stone-700" />
                    <div className="absolute top-[10%] left-[30%] w-[40%] h-[30%] border-2 border-surface-200 dark:border-surface-500 rounded-sm" />
                    <div className="absolute bottom-[25%] left-[35%] w-[30%] h-[15%] bg-surface-100 dark:bg-surface-600 rounded-sm border border-surface-300 dark:border-surface-500" />
                  </div>

                  {roomIssues.map((issue) => {
                    const sc = severityConfig[issue.severity]
                    const isHovered = hoveredPin === issue.id
                    const isSelected = selectedIssue === issue.id
                    return (
                      <div
                        key={issue.id}
                        className="absolute cursor-pointer"
                        style={{ left: `${issue.x}%`, top: `${issue.y}%` }}
                        onMouseEnter={() => setHoveredPin(issue.id)}
                        onMouseLeave={() => setHoveredPin(null)}
                        onClick={() => setSelectedIssue(issue.id)}
                      >
                        <div className={`relative flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold shadow-lg transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white scale-125 ring-2 ring-brand-200'
                            : isHovered
                              ? 'scale-110'
                              : ''
                        } ${issue.severity === '严重' ? 'bg-red-500 text-white' : issue.severity === '一般' ? 'bg-warn-500 text-white' : 'bg-brand-500 text-white'}`}>
                          <Camera size={14} />
                        </div>

                        {(isHovered || isSelected) && (
                          <div className="absolute left-4 top-0 z-20 w-56 rounded-lg bg-white p-3 shadow-xl dark:bg-surface-700 border border-surface-200 dark:border-surface-600">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`badge ${sc.bg} ${sc.color}`}>{issue.severity}</span>
                              <span className={`badge ${statusConfig[issue.status].color}`}>
                                {issue.status}
                              </span>
                            </div>
                            <p className="text-sm text-surface-700 dark:text-surface-300">{issue.description}</p>
                            <div className="mt-1 text-xs text-surface-400">{issue.type} · {issue.assignee}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs text-surface-600 backdrop-blur-sm dark:bg-surface-800/90 dark:text-surface-400">
                {inspectionRoom} · {roomIssues.length}个问题标注点
              </div>

              <div className="absolute bottom-3 right-3 flex gap-1.5">
                {['严重', '一般', '轻微'].map((sev) => {
                  const sc = severityConfig[sev]
                  const count = roomIssues.filter((i) => i.severity === sev).length
                  return (
                    <div key={sev} className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${sc.bg} ${sc.color}`}>
                      <Camera size={8} /> {sev}({count})
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">问题清单</h3>
            <div className="flex items-center gap-2">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="rounded-lg border border-surface-300 bg-white px-2 py-1 text-xs dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
              >
                <option value="全部">全部等级</option>
                <option value="严重">严重</option>
                <option value="一般">一般</option>
                <option value="轻微">轻微</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-surface-300 bg-white px-2 py-1 text-xs dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
              >
                <option value="全部">全部状态</option>
                <option value="待整改">待整改</option>
                <option value="整改中">整改中</option>
                <option value="已整改">已整改</option>
                <option value="已验收">已验收</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {filteredIssues.map((issue) => {
              const sc = severityConfig[issue.severity]
              const stc = statusConfig[issue.status]
              const StatusIcon = stc.icon
              return (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue.id === selectedIssue ? null : issue.id)}
                  className={`card cursor-pointer p-3 transition-all ${
                    selectedIssue === issue.id ? 'ring-2 ring-brand-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      issue.severity === '严重' ? 'bg-red-500 text-white' : issue.severity === '一般' ? 'bg-warn-500 text-white' : 'bg-brand-500 text-white'
                    }`}>
                      <Camera size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`badge ${sc.bg} ${sc.color}`}>{issue.severity}</span>
                        <span className={`badge ${stc.color}`}>
                          <StatusIcon size={10} className="mr-0.5 inline" />{issue.status}
                        </span>
                      </div>
                      <p className="text-sm text-surface-700 dark:text-surface-300">{issue.description}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-surface-400">
                        <span>{issue.type}</span>
                        <span>{issue.assignee}</span>
                        <span>{issue.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredIssues.length === 0 && (
              <div className="py-8 text-center text-sm text-surface-400">
                暂无匹配的验收问题
              </div>
            )}
          </div>

          <div className="mt-4 card p-4">
            <h4 className="mb-3 text-sm font-medium text-surface-900 dark:text-white">整改待办清单</h4>
            <div className="space-y-2">
              {mockInspectionIssues.filter((i) => i.status === '待整改' || i.status === '整改中').map((issue) => (
                <div key={issue.id} className="flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700 p-2">
                  <div className={`h-2 w-2 rounded-full ${issue.status === '待整改' ? 'bg-red-500' : 'bg-brand-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-surface-700 dark:text-surface-300 truncate">{issue.description}</p>
                    <p className="text-[10px] text-surface-400">{issue.room} · {issue.assignee}</p>
                  </div>
                  <span className={`badge text-[10px] ${issue.status === '待整改' ? 'badge-warn' : 'badge-brand'}`}>
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddIssue(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-surface-200 px-5 py-3 dark:border-surface-700">
              <h3 className="font-semibold text-surface-900 dark:text-white">标注新问题</h3>
              <button onClick={() => setShowAddIssue(false)} className="text-surface-400 hover:text-surface-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">房间</label>
                <select className="input-field">
                  {rooms.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">问题类型</label>
                <select className="input-field">
                  {['墙面空鼓', '渗水', '裂缝', '尺寸偏差', '色差', '其他'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">严重程度</label>
                <div className="flex gap-2">
                  {['严重', '一般', '轻微'].map((sev) => (
                    <button key={sev} className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                      sev === '严重' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      sev === '一般' ? 'bg-warn-100 text-warn-700 dark:bg-warn-900/30 dark:text-warn-300' :
                      'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    }`}>
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">问题描述</label>
                <textarea className="input-field" rows={3} placeholder="详细描述问题位置和情况..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">拍照标记</label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-surface-300 py-8 text-surface-400 dark:border-surface-600">
                  <Camera size={24} className="mr-2" /> 点击拍照或上传图片
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn-primary flex-1" onClick={() => setShowAddIssue(false)}>提交标注</button>
                <button className="btn-secondary flex-1" onClick={() => setShowAddIssue(false)}>取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
